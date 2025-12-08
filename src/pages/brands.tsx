import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  Building2,
  Package,
  Globe,
  Settings,
  HelpCircle
} from "lucide-react";
import AddBrandModal from "@/components/modals/add-brand-modal";
import BrandDetailModal from "@/components/modals/brand-detail-modal";

interface Brand {
  id: string;
  name: string;
  description?: string;
  isGeneric: boolean;
  industry?: string;
  logo?: string;
  website?: string;
  templateId?: string;
  templateVersion?: string;
  vendorCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export function Brands() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [showHowToModal, setShowHowToModal] = useState(false);

  const { data: brands = [], isLoading } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (brand.industry && brand.industry.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group brands by industry
  const brandsByIndustry = filteredBrands.reduce((acc, brand) => {
    const industry = brand.industry || "Other";
    if (!acc[industry]) {
      acc[industry] = [];
    }
    acc[industry].push(brand);
    return acc;
  }, {} as Record<string, Brand[]>);

  return (
    <div className="container mx-auto py-6 space-y-6" data-testid="brands-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold" data-testid="page-title">Brands</h1>
            <Button
              variant="ghost" 
              size="sm"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-sm font-medium"
              onClick={() => setShowHowToModal(true)}
              data-testid="button-how-to"
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              How To Use
            </Button>
          </div>
          <p className="text-muted-foreground">
            Manage construction brands and their product hierarchies
          </p>
        </div>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="shrink-0"
          data-testid="button-add-brand"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Brand
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search brands or industries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="input-search"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-brands">
              {brands.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Industries</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-industries">
              {Object.keys(brandsByIndustry).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generic Brands</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-generic-brands">
              {brands.filter(b => b.isGeneric).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-active-vendors">
              {brands.reduce((sum, brand) => sum + brand.vendorCount, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Brands by Industry */}
      {!isLoading && Object.keys(brandsByIndustry).length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No brands found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first brand"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Brand
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!isLoading && Object.entries(brandsByIndustry).map(([industry, industryBrands]) => (
        <div key={industry} className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold capitalize" data-testid={`industry-${industry}`}>
              {industry.replace('_', ' & ')}
            </h2>
            <Badge variant="secondary" data-testid={`industry-count-${industry}`}>
              {industryBrands.length}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {industryBrands.map((brand) => (
              <Card 
                key={brand.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedBrand(brand)}
                data-testid={`card-brand-${brand.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg" data-testid={`text-brand-name-${brand.id}`}>
                        {brand.name}
                      </CardTitle>
                      {brand.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {brand.description}
                        </p>
                      )}
                    </div>
                    {brand.isGeneric && (
                      <Badge variant="outline" data-testid={`badge-generic-${brand.id}`}>
                        Generic
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Vendors:</span>
                    <span className="font-medium" data-testid={`text-vendor-count-${brand.id}`}>
                      {brand.vendorCount}
                    </span>
                  </div>
                  
                  {brand.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-3 w-3 text-muted-foreground" />
                      <a 
                        href={brand.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`link-website-${brand.id}`}
                      >
                        {brand.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}

                  {brand.templateVersion && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Template:</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        v{brand.templateVersion}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Modals */}
      <AddBrandModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen}
      />

      {selectedBrand && (
        <BrandDetailModal
          brand={selectedBrand}
          open={!!selectedBrand}
          onOpenChange={(open: boolean) => !open && setSelectedBrand(null)}
        />
      )}

      {/* How To Modal */}
      <Dialog open={showHowToModal} onOpenChange={setShowHowToModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              How to Use Brand Management
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Learn how to set up and manage construction brands effectively
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Quick Start */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm mr-3">
                  1
                </div>
                Quick Start
              </h3>
              <div className="ml-9 space-y-2 text-sm text-gray-600">
                <p>• Click <strong>"Add Brand"</strong> to create your first brand</p>
                <p>• Choose from predefined industry templates (Roofing, Electrical, etc.)</p>
                <p>• Brand templates automatically create organized category hierarchies</p>
              </div>
            </div>

            {/* Brand Setup */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm mr-3">
                  2
                </div>
                Brand Setup
              </h3>
              <div className="ml-9 space-y-2 text-sm text-gray-600">
                <p><strong>Industry Templates:</strong> Select the right industry to get organized categories</p>
                <p><strong>GAF → Roofing:</strong> Automatically creates Shingles, Underlayment, Ventilation categories</p>
                <p><strong>Square D → Electrical:</strong> Creates Panels, Breakers, Switches, Outlets categories</p>
                <p><strong>Generic Categories:</strong> Choose "Generic/Unbranded" for commodity products</p>
              </div>
            </div>

            {/* Assigning to Vendors */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm mr-3">
                  3
                </div>
                Assign to Vendors
              </h3>
              <div className="ml-9 space-y-2 text-sm text-gray-600">
                <p>• Go to <strong>Vendors</strong> page and edit any vendor</p>
                <p>• Use the <strong>Brand Selection</strong> section to assign brands</p>
                <p>• Vendors can carry multiple brands (e.g., GAF + Owens Corning for roofing)</p>
                <p>• Filter vendors by brand using the new Brand filter dropdown</p>
              </div>
            </div>

            {/* Best Practices */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm mr-3">
                  4
                </div>
                Best Practices
              </h3>
              <div className="ml-9 space-y-2 text-sm text-gray-600">
                <p><strong>Start with Major Brands:</strong> Add well-known brands first (GAF, Trex, Andersen)</p>
                <p><strong>Use Templates:</strong> Industry templates ensure consistent organization</p>
                <p><strong>Generic Products:</strong> Use "Generic/Unbranded" for lumber, hardware, basic supplies</p>
                <p><strong>Search & Filter:</strong> Use brand search to quickly find vendors carrying specific brands</p>
              </div>
            </div>

            {/* Pro Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-blue-900">💡 Pro Tips</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Brand hierarchies create organized categories automatically</li>
                <li>• Vendors display their brands with green badges for easy identification</li>
                <li>• Use the search bar to find vendors by brand name</li>
                <li>• Templates ensure consistent product organization across similar brands</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowHowToModal(false)}
            >
              Got it, let's get started!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}