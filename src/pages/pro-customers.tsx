import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, Search, Building, Edit, Trash2, ArrowUpDown, Download, Phone, Mail, Send } from "lucide-react";
import { type ProCustomer } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AddProCustomerModal from "@/components/modals/add-pro-customer-modal";
import ProCustomerDetailModal from "@/components/modals/pro-customer-detail-modal";
import { formatPhoneNumber } from "@/lib/phone-utils";

export default function ProCustomers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<ProCustomer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [startInEditMode, setStartInEditMode] = useState(false);
  const [sortField, setSortField] = useState<string>('businessName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const { toast } = useToast();

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const { data: customers, isLoading } = useQuery<ProCustomer[]>({
    queryKey: ["/api/pro-customers"],
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/pro-customers?id=${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pro-customers"] });
      toast({
        title: "Success",
        description: "Pro customer deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete pro customer",
        variant: "destructive",
      });
    },
  });

  const exportMailingListMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/pro-customers/mailing-list");
      if (!response.ok) {
        throw new Error("Failed to generate mailing list");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'pro-customers-mailing-list.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Pro customer mailing list exported successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to export mailing list",
        variant: "destructive",
      });
    },
  });

  // Filter customers based on search query
  const filteredCustomers = customers?.filter(customer => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      customer.businessName?.toLowerCase().includes(query) ||
      customer.primaryContactName?.toLowerCase().includes(query) ||
      customer.trades?.some(trade => trade.toLowerCase().includes(query)) ||
      customer.lowesProAccountNumber?.toLowerCase().includes(query)
    );
  }) || [];

  // Sort customers
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    let aValue = '', bValue = '';
    
    switch (sortField) {
      case 'businessName':
        aValue = a.businessName || '';
        bValue = b.businessName || '';
        break;
      case 'primaryContactName':
        aValue = a.primaryContactName || '';
        bValue = b.primaryContactName || '';
        break;
      case 'lowesProAccountNumber':
        aValue = a.lowesProAccountNumber || '';
        bValue = b.lowesProAccountNumber || '';
        break;
      default:
        aValue = a.businessName || '';
        bValue = b.businessName || '';
    }
    
    const comparison = aValue.localeCompare(bValue);
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleCustomerClick = (customer: ProCustomer) => {
    setSelectedCustomer(customer);
    setStartInEditMode(false);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedCustomer(null);
    setStartInEditMode(false);
  };

  const handleEditCustomer = (customer: ProCustomer) => {
    setSelectedCustomer(customer);
    setStartInEditMode(true);
    setShowDetailModal(true);
  };

  const handleDeleteCustomer = (customer: ProCustomer) => {
    if (window.confirm(`Are you sure you want to delete ${customer.businessName}?`)) {
      deleteCustomerMutation.mutate(customer.id);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const getTradeColor = (trade: string) => {
    const colorMap: Record<string, string> = {
      'general contractor': 'bg-blue-100 text-blue-800',
      'remodeler': 'bg-green-100 text-green-800',
      'plumber': 'bg-cyan-100 text-cyan-800',
      'electrician': 'bg-yellow-100 text-yellow-800',
      'landscaper': 'bg-green-100 text-green-800',
      'painter': 'bg-purple-100 text-purple-800',
      'hvac': 'bg-orange-100 text-orange-800',
      'roofer': 'bg-red-100 text-red-800',
    };
    
    return colorMap[trade.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-80 mt-2" />
          </div>
          <div className="flex space-x-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pro Customers</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage your professional construction customers</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
          <Button 
            variant="outline"
            onClick={() => exportMailingListMutation.mutate()}
            disabled={exportMailingListMutation.isPending}
            data-testid="button-export-mailing-list"
            className="w-full sm:w-auto"
          >
            <Send className="mr-2 h-4 w-4" />
            {exportMailingListMutation.isPending ? "Exporting..." : "Export Mailing List"}
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 font-medium w-full sm:w-auto"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Pro Customer
          </Button>
        </div>
      </div>

      {/* Search Section */}
      <Card className="construction-shadow">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search customers by business name, contact, trade, or account number..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card Layout */}
      <div className="block md:hidden space-y-4">
        {sortedCustomers.map((customer) => (
          <Card 
            key={customer.id} 
            className="construction-shadow cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleCustomerClick(customer)}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building className="text-purple-600 h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1">{customer.businessName}</h3>
                  {customer.lowesProAccountNumber && (
                    <p className="text-sm text-gray-500 mb-2">Account: {customer.lowesProAccountNumber}</p>
                  )}
                  
                  {/* Contact Info */}
                  <div className="space-y-1 mb-3">
                    {customer.primaryContactName && (
                      <p className="text-sm text-gray-600">{customer.primaryContactName}</p>
                    )}
                    {customer.primaryContactMobile && (
                      <p className="text-sm text-gray-600">
                        {formatPhoneNumber(customer.primaryContactMobile)}
                        {customer.primaryContactMobileExtension && ` ext. ${customer.primaryContactMobileExtension}`}
                      </p>
                    )}
                    {customer.primaryContactEmail && (
                      <p className="text-sm text-blue-600 break-all">{customer.primaryContactEmail}</p>
                    )}
                  </div>

                  {/* Trades */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {customer.trades && customer.trades.length > 0 ? (
                      customer.trades.slice(0, 2).map((trade, index) => (
                        <Badge 
                          key={index}
                          variant="secondary"
                          className={`text-xs ${getTradeColor(trade)}`}
                        >
                          {trade}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                        No trades specified
                      </Badge>
                    )}
                    {customer.trades && customer.trades.length > 2 && (
                      <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                        +{customer.trades.length - 2}
                      </Badge>
                    )}
                  </div>

                  {/* Business Types */}
                  {customer.businessTypes && customer.businessTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {customer.businessTypes.slice(0, 2).map((type, index) => (
                        <Badge 
                          key={index}
                          variant="outline"
                          className="text-xs border-purple-200 text-purple-700"
                        >
                          {type}
                        </Badge>
                      ))}
                      {customer.businessTypes.length > 2 && (
                        <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">
                          +{customer.businessTypes.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <Card className="construction-shadow overflow-hidden hidden md:block">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Pro Customer Directory</h3>
            <span className="text-sm text-gray-500">{sortedCustomers.length} customers</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="px-6 py-4">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-semibold text-gray-900">Business</span>
                    <ArrowUpDown 
                      className="h-3 w-3 text-gray-400 cursor-pointer hover:text-gray-600" 
                      onClick={() => handleSort('businessName')}
                    />
                    {sortOrder === 'asc' ? (
                      <span className="text-xs text-gray-500">A-Z</span>
                    ) : (
                      <span className="text-xs text-gray-500">Z-A</span>
                    )}
                  </div>
                </TableHead>
                <TableHead className="px-6 py-4">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-semibold text-gray-900">Primary Contact</span>
                    <ArrowUpDown 
                      className="h-3 w-3 text-gray-400 cursor-pointer hover:text-gray-600" 
                      onClick={() => handleSort('primaryContactName')}
                    />
                  </div>
                </TableHead>
                <TableHead className="px-6 py-4">
                  <span className="text-sm font-semibold text-gray-900">Trade</span>
                </TableHead>
                <TableHead className="px-6 py-4">
                  <span className="text-sm font-semibold text-gray-900">Contact Info</span>
                </TableHead>
                <TableHead className="px-6 py-4">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-semibold text-gray-900">Account</span>
                    <ArrowUpDown 
                      className="h-3 w-3 text-gray-400 cursor-pointer hover:text-gray-600" 
                      onClick={() => handleSort('lowesProAccountNumber')}
                    />
                  </div>
                </TableHead>
                <TableHead className="px-6 py-4 text-right">
                  <span className="text-sm font-semibold text-gray-900">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCustomers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="px-6 py-4">
                    <div 
                      className="flex items-center space-x-3 cursor-pointer"
                      onClick={() => handleCustomerClick(customer)}
                    >
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Users className="text-green-600 h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                          {customer.businessName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {customer.typicalProjectType || "Not specified"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{customer.primaryContactName || "Not provided"}</p>
                      <p className="text-sm text-gray-500">{customer.primaryContactRole || "No role specified"}</p>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {customer.trades && customer.trades.length > 0 ? (
                        customer.trades.map((trade, index) => (
                          <Badge 
                            key={index}
                            variant="secondary"
                            className={`text-xs ${getTradeColor(trade)}`}
                          >
                            {trade}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                          No trades specified
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="space-y-1">
                      {customer.primaryContactMobile && (
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          <span>
                            {formatPhoneNumber(customer.primaryContactMobile)}
                            {customer.primaryContactMobileExtension && ` ext. ${customer.primaryContactMobileExtension}`}
                          </span>
                        </div>
                      )}
                      {customer.primaryContactEmail && (
                        <div className="flex items-center space-x-1 text-sm text-blue-600">
                          <Mail className="h-3 w-3" />
                          <span className="break-all">{customer.primaryContactEmail}</span>
                        </div>
                      )}
                      {!customer.primaryContactMobile && !customer.primaryContactEmail && (
                        <p className="text-sm text-gray-400 italic">No contact info</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div>
                      {customer.lowesProAccountNumber ? (
                        <p className="text-sm font-mono text-gray-900">{customer.lowesProAccountNumber}</p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No account #</p>
                      )}
                      {customer.preferredContactMethod && (
                        <p className="text-xs text-gray-500 mt-1">
                          Prefers: {customer.preferredContactMethod}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCustomer(customer)}
                        className="text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCustomer(customer)}
                        className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {sortedCustomers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pro customers</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? "No customers match your search." : "Get started by adding your first pro customer."}
              </p>
              {!searchQuery && (
                <div className="mt-6">
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Pro Customer
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Modals */}
      <AddProCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
      
      <ProCustomerDetailModal
        customer={selectedCustomer}
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        startInEditMode={startInEditMode}
      />
    </div>
  );
}