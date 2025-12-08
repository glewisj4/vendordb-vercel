import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ChevronDown, ChevronRight, Edit, Trash2 } from "lucide-react";
import { type Service } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AddServiceModal from "@/components/modals/add-service-modal";
import EditServiceModal from "@/components/modals/edit-service-modal";

export default function Services() {
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [expandAll, setExpandAll] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const { toast } = useToast();

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      });
    },
  });

  // Filter services based on active filter
  const getFilteredServices = () => {
    if (!services) return [];
    
    switch (activeFilter) {
      case 'delivery':
        return services.filter(s => s.name.toLowerCase().includes('delivery'));
      case 'support':
        return services.filter(s => s.name.toLowerCase().includes('support'));
      case 'custom':
        return services.filter(s => s.name.toLowerCase().includes('custom'));
      default:
        return services;
    }
  };

  const filteredServices = getFilteredServices();

  // Build service tree structure from filtered services
  const serviceTree = filteredServices?.filter(service => !service.parentId).map(service => ({
    ...service,
    children: filteredServices.filter(s => s.parentId === service.id).map(child => ({
      ...child,
      children: filteredServices.filter(s => s.parentId === child.id)
    }))
  })) || [];

  const toggleService = (serviceId: string) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(serviceId)) {
      newExpanded.delete(serviceId);
    } else {
      newExpanded.add(serviceId);
    }
    setExpandedServices(newExpanded);
  };

  const toggleExpandAll = () => {
    if (expandAll) {
      setExpandedServices(new Set());
    } else {
      const allServiceIds = new Set<string>();
      const collectIds = (servs: Service[]) => {
        servs.forEach(serv => {
          const hasChildren = servs.some(s => s.parentId === serv.id);
          if (hasChildren) {
            allServiceIds.add(serv.id);
          }
        });
      };
      if (services) collectIds(services);
      setExpandedServices(allServiceIds);
    }
    setExpandAll(!expandAll);
  };

  const handleDeleteService = (service: Service) => {
    if (window.confirm(`Are you sure you want to delete "${service.name}"?`)) {
      deleteServiceMutation.mutate(service.id);
    }
  };

  interface ServiceTreeNodeProps {
    service: Service & { children: Service[] };
    level: number;
  }

  const ServiceTreeNode = ({ service, level }: ServiceTreeNodeProps) => {
    const hasChildren = service.children && service.children.length > 0;
    const isExpanded = expandedServices.has(service.id);
    
    const getServiceColor = (level: number) => {
      switch (level) {
        case 0: return 'bg-blue-50 border-l-4 border-blue-400';
        case 1: return 'bg-green-50 border-l-4 border-green-400';
        case 2: return 'bg-yellow-50 border-l-4 border-yellow-400';
        default: return 'bg-gray-50 border-l-4 border-gray-400';
      }
    };

    return (
      <div>
        <div className={`p-4 ${getServiceColor(level)} ${level > 0 ? 'ml-6' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => toggleService(service.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
              {!hasChildren && <div className="w-6" />}
              
              <div>
                <h3 className="font-semibold text-gray-900">{service.name}</h3>
                {service.description && (
                  <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                )}
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {service.vendorCount} vendors
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Level {service.level}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-blue-600 hover:text-blue-800"
                onClick={() => setEditingService(service)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-600 hover:text-red-800"
                onClick={() => handleDeleteService(service)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div>
            {service.children.map((child) => (
              <ServiceTreeNode key={child.id} service={child as Service & { children: Service[] }} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card className="construction-shadow">
          <CardContent className="p-6 space-y-4">
            {[...Array(5)].map((_, index) => (
              <Skeleton key={index} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-1">Manage vendor service offerings and capabilities</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Button 
            variant="outline" 
            className="font-medium"
            onClick={toggleExpandAll}
          >
            {expandAll ? "Collapse All" : "Expand All"}
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 font-medium"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Services Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card 
          className={`construction-shadow cursor-pointer transition-all duration-200 hover:shadow-lg ${
            activeFilter === 'all' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
          }`}
          onClick={() => setActiveFilter('all')}
        >
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <div className="w-8 h-8 bg-blue-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Services</p>
                <p className="text-2xl font-bold text-gray-900">{services?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`construction-shadow cursor-pointer transition-all duration-200 hover:shadow-lg ${
            activeFilter === 'delivery' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'
          }`}
          onClick={() => setActiveFilter('delivery')}
        >
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <div className="w-8 h-8 bg-green-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Delivery Services</p>
                <p className="text-2xl font-bold text-gray-900">
                  {services?.filter(s => s.name.toLowerCase().includes('delivery')).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`construction-shadow cursor-pointer transition-all duration-200 hover:shadow-lg ${
            activeFilter === 'support' ? 'ring-2 ring-yellow-500 bg-yellow-50' : 'hover:bg-gray-50'
          }`}
          onClick={() => setActiveFilter('support')}
        >
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <div className="w-8 h-8 bg-yellow-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Support Services</p>
                <p className="text-2xl font-bold text-gray-900">
                  {services?.filter(s => s.name.toLowerCase().includes('support')).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`construction-shadow cursor-pointer transition-all duration-200 hover:shadow-lg ${
            activeFilter === 'custom' ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:bg-gray-50'
          }`}
          onClick={() => setActiveFilter('custom')}
        >
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <div className="w-8 h-8 bg-purple-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Custom Services</p>
                <p className="text-2xl font-bold text-gray-900">
                  {services?.filter(s => s.name.toLowerCase().includes('custom')).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Management */}
      <Card className="construction-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Service Hierarchy</h3>
              {activeFilter !== 'all' && (
                <p className="text-sm text-blue-600 mt-1">
                  Filtered by: {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Services
                  <button 
                    className="ml-2 text-blue-600 hover:text-blue-800 underline"
                    onClick={() => setActiveFilter('all')}
                  >
                    Clear filter
                  </button>
                </p>
              )}
            </div>
            <span className="text-sm text-gray-500">{serviceTree.length} services shown</span>
          </div>

          {/* Service Tree Structure */}
          <div className="space-y-1 border border-gray-200 rounded-lg bg-white">
            {serviceTree.map((service) => (
              <ServiceTreeNode key={service.id} service={service as Service & { children: Service[] }} level={0} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <AddServiceModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
      <EditServiceModal 
        service={editingService} 
        isOpen={!!editingService} 
        onClose={() => setEditingService(null)} 
      />
    </div>
  );
}