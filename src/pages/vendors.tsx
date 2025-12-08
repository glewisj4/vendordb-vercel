import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, Search, Filter, Building, Edit, Trash2, ChevronDown, ChevronRight, ArrowUpDown, Download, Send } from "lucide-react";
import { type Vendor, type Representative, type Category } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneNumber } from "@/lib/phone-utils";
import AddVendorModal from "@/components/modals/add-vendor-modal";
import VendorDetailModal from "@/components/modals/vendor-detail-modal";
import EditRepresentativeModal from "@/components/modals/edit-representative-modal";
import { exportVendorsToPDF } from "@/lib/pdf-export";

export default function Vendors() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [startInEditMode, setStartInEditMode] = useState(false);
  const [selectedRepresentative, setSelectedRepresentative] = useState<Representative | null>(null);
  const [showEditRepModal, setShowEditRepModal] = useState(false);
  const [sortField, setSortField] = useState<string>('companyName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedBrands, setExpandedBrands] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const { data: vendors, isLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: representatives = [] } = useQuery<Representative[]>({
    queryKey: ["/api/representatives"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: brands = [] } = useQuery<any[]>({
    queryKey: ["/api/brands"],
  });

  // Helper function to get brand names from brand IDs
  const getBrandNames = (brandIds: string[]): string[] => {
    if (!brandIds || brandIds.length === 0) return [];
    return brandIds
      .map(brandId => {
        const brand = brands.find(b => b.id === brandId);
        return brand ? brand.name : null;
      })
      .filter(Boolean);
  };

  // Helper function to group categories by brand
  const groupCategoriesByBrand = (categories: string[], vendorBrands: string[]) => {
    const brandGroups: Record<string, string[]> = {};
    
    // Group categories by their brand prefix
    categories.forEach(category => {
      const brandMatch = vendorBrands.find(brand => 
        category.toLowerCase().startsWith(brand.toLowerCase())
      );
      
      if (brandMatch) {
        if (!brandGroups[brandMatch]) brandGroups[brandMatch] = [];
        // Remove brand prefix from category display
        const categoryWithoutBrand = category.replace(`${brandMatch} > `, '');
        brandGroups[brandMatch].push(categoryWithoutBrand);
      } else {
        // Generic/unbranded categories
        if (!brandGroups['Generic']) brandGroups['Generic'] = [];
        brandGroups['Generic'].push(category);
      }
    });
    
    return brandGroups;
  };

  // Toggle brand dropdown state
  const toggleBrandDropdown = (vendorId: string, brand: string) => {
    const key = `${vendorId}-${brand}`;
    setExpandedBrands(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Helper function to get all subcategories recursively for a given category
  const getAllSubcategories = (categoryName: string): string[] => {
    const category = categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
    if (!category) return [];
    
    const subcategories = categories.filter(cat => cat.parentId === category.id);
    const allSubs = [categoryName]; // Include the parent category itself
    
    subcategories.forEach(subcat => {
      allSubs.push(subcat.name);
      // Recursively get sub-subcategories
      const subSubcategories = getAllSubcategories(subcat.name);
      allSubs.push(...subSubcategories.filter(name => name !== subcat.name));
    });
    
    return allSubs;
  };

  // Helper function to check if a search term matches any category in a hierarchy
  const matchesAnyInHierarchy = (vendorCategories: string[], searchTerm: string): boolean => {
    const searchLower = searchTerm.toLowerCase();
    
    // Get all possible category matches including subcategories
    const allPossibleMatches = new Set<string>();
    
    // For each category in the database, get its full hierarchy
    categories.forEach(category => {
      const categoryLower = category.name.toLowerCase();
      if (categoryLower.includes(searchLower)) {
        // If search matches this category, add all its subcategories
        const hierarchy = getAllSubcategories(category.name);
        hierarchy.forEach(h => allPossibleMatches.add(h.toLowerCase()));
      }
    });
    
    // Also check if the search term is a parent category that should include its children
    const hierarchyMatches = getAllSubcategories(searchTerm);
    hierarchyMatches.forEach(h => allPossibleMatches.add(h.toLowerCase()));
    
    // Check if any vendor category matches any possible category in the hierarchy
    return vendorCategories.some(vendorCat => 
      allPossibleMatches.has(vendorCat.toLowerCase()) || 
      vendorCat.toLowerCase().includes(searchLower)
    );
  };

  const deleteVendorMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/vendors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({
        title: "Success",
        description: "Vendor deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete vendor",
        variant: "destructive",
      });
    },
  });

  const filteredVendors = vendors?.filter(vendor => {
    const searchLower = searchQuery.toLowerCase().trim();
    
    // If no search query, show all vendors (filtered by category and brand only)
    if (!searchQuery) {
      const matchesCategory = !categoryFilter || categoryFilter === "all-categories" ||
        (vendor.categories && matchesAnyInHierarchy(vendor.categories, categoryFilter));
      const matchesBrand = !brandFilter || brandFilter === "all-brands" ||
        (vendor.brands && getBrandNames(vendor.brands).some(brandName => 
          brandName.toLowerCase().includes(brandFilter.toLowerCase())
        ));
      return matchesCategory && matchesBrand;
    }
    
    // Enhanced search logic with hierarchical category support
    const matchesSearch = 
      // Exact company name match
      vendor.companyName.toLowerCase().includes(searchLower) ||

      // Vendor number match
      vendor.vendorNumber?.toLowerCase().includes(searchLower) ||
      // Phone match
      vendor.phone?.toLowerCase().includes(searchLower) ||
      // Hierarchical category matching - includes subcategories
      (vendor.categories && matchesAnyInHierarchy(vendor.categories, searchLower)) ||
      // Brand matching using vendor.brands field
      (vendor.brands && getBrandNames(vendor.brands).some(brandName => 
        brandName.toLowerCase().includes(searchLower)
      ));
    
    const matchesCategory = !categoryFilter || categoryFilter === "all-categories" ||
      (vendor.categories && matchesAnyInHierarchy(vendor.categories, categoryFilter));
    
    const matchesBrand = !brandFilter || brandFilter === "all-brands" ||
      (vendor.brands && getBrandNames(vendor.brands).some(brandName => 
        brandName.toLowerCase().includes(brandFilter.toLowerCase())
      ));
    
    return matchesSearch && matchesCategory && matchesBrand;
  }) || [];

  // Apply sorting
  const sortedVendors = [...filteredVendors].sort((a, b) => {
    let aValue = '', bValue = '';
    
    switch (sortField) {
      case 'vendorNumber':
        aValue = a.vendorNumber || '';
        bValue = b.vendorNumber || '';
        break;
      case 'companyName':
        aValue = a.companyName;
        bValue = b.companyName;
        break;
      case 'phone':
        aValue = a.phone || '';
        bValue = b.phone || '';
        break;
      case 'email':
        aValue = a.email || '';
        bValue = b.email || '';
        break;
      default:
        aValue = a.companyName;
        bValue = b.companyName;
    }
    
    const comparison = aValue.localeCompare(bValue);
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleDeleteVendor = (id: string, companyName: string) => {
    if (window.confirm(`Are you sure you want to delete ${companyName}?`)) {
      deleteVendorMutation.mutate(id);
    }
  };

  const exportMailingListMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/vendors/mailing-list");
      if (!response.ok) {
        throw new Error("Failed to generate mailing list");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'vendors-mailing-list.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vendor mailing list exported successfully",
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

  const handleExportPDF = () => {
    try {
      const pdf = exportVendorsToPDF(sortedVendors, representatives, {
        title: searchQuery ? `LowesPro Vendor Directory - "${searchQuery}"` : 'LowesPro Vendor Directory',
        includeContacts: true,
        includeCategories: true,
        orientation: 'landscape',
        sortField: sortField,
        sortOrder: sortOrder
      });
      
      const fileName = `lowespro-vendors-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "PDF Generated",
        description: `Vendor list exported successfully as ${fileName}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleVendorClick = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setStartInEditMode(true); // Always start in edit mode on mobile
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedVendor(null);
    setStartInEditMode(false);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setStartInEditMode(true);
    setShowDetailModal(true);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getCategoryColors = (category: string) => {
    const colorMap: Record<string, string> = {
      'roofing': 'bg-blue-100 text-blue-800',
      'lumber': 'bg-yellow-100 text-yellow-800',
      'concrete': 'bg-gray-100 text-gray-800',
      'decking': 'bg-green-100 text-green-800',
      'hardware': 'bg-gray-100 text-gray-800',
      'gaf': 'bg-green-100 text-green-800',
      'owens corning': 'bg-purple-100 text-purple-800',
      'certainteed': 'bg-orange-100 text-orange-800',
      'iko': 'bg-red-100 text-red-800',
      'trex': 'bg-green-100 text-green-800',
      'timbertech': 'bg-indigo-100 text-indigo-800',
      'fiberon': 'bg-indigo-100 text-indigo-800',
      'azek': 'bg-blue-100 text-blue-800',
      'andersen': 'bg-gray-100 text-gray-800',
    };
    
    return colorMap[category.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <div className="flex space-x-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
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
    <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Vendors</h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">Manage your construction material suppliers</p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button 
              variant="outline" 
              className="font-medium text-sm"
              onClick={() => exportMailingListMutation.mutate()}
              disabled={exportMailingListMutation.isPending}
              data-testid="button-export-mailing-list"
            >
              <Send className="mr-2 h-4 w-4" />
              {exportMailingListMutation.isPending ? "Exporting..." : "Export Mailing List"}
            </Button>
            <Button variant="outline" className="font-medium text-sm" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 font-medium text-sm"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <Card className="construction-shadow">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search vendors..."
                className="pl-10 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-categories">All Categories</SelectItem>
                  {categories?.map(category => (
                    <SelectItem key={category.id} value={category.name.toLowerCase()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Brand Filter */}
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-brands">All Brands</SelectItem>
                  {(() => {
                    const allBrandNames = new Set<string>();
                    vendors?.forEach(vendor => {
                      if (vendor.brands) {
                        getBrandNames(vendor.brands).forEach(brandName => {
                          allBrandNames.add(brandName);
                        });
                      }
                    });
                    return Array.from(allBrandNames).sort().map(brandName => (
                      <SelectItem key={brandName} value={brandName.toLowerCase()}>
                        {brandName}
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>

              {/* Mobile Sort Control */}
              <div className="block md:hidden">
                <Select value={`${sortField}-${sortOrder}`} onValueChange={(value) => {
                  const [field, order] = value.split('-');
                  setSortField(field);
                  setSortOrder(order as 'asc' | 'desc');
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="companyName-asc">Company Name (A-Z)</SelectItem>
                    <SelectItem value="companyName-desc">Company Name (Z-A)</SelectItem>
                    <SelectItem value="vendorNumber-asc">Vendor Number (1-9)</SelectItem>
                    <SelectItem value="vendorNumber-desc">Vendor Number (9-1)</SelectItem>
                    <SelectItem value="phone-asc">Phone (A-Z)</SelectItem>
                    <SelectItem value="phone-desc">Phone (Z-A)</SelectItem>
                    <SelectItem value="email-asc">Email (A-Z)</SelectItem>
                    <SelectItem value="email-desc">Email (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Advanced Filters Toggle */}
              <Button 
                variant="outline" 
                className="text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white text-sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Status</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="has-contact">Has Contact</SelectItem>
                      <SelectItem value="no-contact">No Contact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Status</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="has-phone">Has Phone</SelectItem>
                      <SelectItem value="no-phone">No Phone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recent Activity</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Card Layout */}
      <div className="block md:hidden space-y-4">
        {sortedVendors.map((vendor) => (
          <Card 
            key={vendor.id} 
            className="construction-shadow cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleVendorClick(vendor)}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building className="text-blue-600 h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1">{vendor.companyName}</h3>
                  <p className="text-sm text-gray-500 mb-2">{vendor.vendorNumber}</p>
                  
                  {/* Contact Info */}
                  <div className="space-y-1 mb-3">
                    {vendor.phone && (
                      <p className="text-sm text-gray-600">
                        {formatPhoneNumber(vendor.phone)}
                        {vendor.phoneExtension && ` ext. ${vendor.phoneExtension}`}
                      </p>
                    )}
                    {vendor.email && (
                      <p className="text-sm text-blue-600 break-all">{vendor.email}</p>
                    )}
                    {!vendor.phone && !vendor.email && (
                      <p className="text-sm text-gray-400 italic">No contact info</p>
                    )}
                  </div>

                  {/* Brand Categories */}
                  <div className="space-y-2 mb-3">
                    {(() => {
                      const vendorBrands = getBrandNames(vendor.brands || []);
                      const brandGroups = groupCategoriesByBrand(vendor.categories || [], vendorBrands);
                      
                      if (Object.keys(brandGroups).length === 0) {
                        return (
                          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                            No categories
                          </Badge>
                        );
                      }
                      
                      return Object.entries(brandGroups).map(([brand, subcategories]) => (
                        <div key={brand}>
                          <button 
                            className="flex items-center gap-1 text-sm hover:bg-gray-50 p-1 rounded"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              toggleBrandDropdown(vendor.id, brand); 
                            }}
                          >
                            {expandedBrands[`${vendor.id}-${brand}`] ? 
                              <ChevronDown className="h-3 w-3 text-gray-500" /> : 
                              <ChevronRight className="h-3 w-3 text-gray-500" />
                            }
                            <Badge 
                              variant="outline" 
                              className="text-xs bg-green-50 text-green-700 border-green-200"
                            >
                              {brand} ({subcategories.length})
                            </Badge>
                          </button>
                          {expandedBrands[`${vendor.id}-${brand}`] && (
                            <div className="ml-4 mt-1 space-y-1">
                              {subcategories.slice(0, 5).map((subcat, idx) => (
                                <div key={idx} className="text-xs text-gray-600 flex items-center">
                                  <span className="w-2 h-px bg-gray-300 mr-2"></span>
                                  {subcat}
                                </div>
                              ))}
                              {subcategories.length > 5 && (
                                <div className="text-xs text-gray-400 ml-4">
                                  +{subcategories.length - 5} more...
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Brands */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(() => {
                      const vendorBrands = getBrandNames(vendor.brands || []);
                      if (vendorBrands.length > 0) {
                        return (
                          <>
                            {vendorBrands.slice(0, 2).map((brandName, index) => (
                              <Badge 
                                key={index}
                                variant="outline"
                                className="text-xs bg-green-50 text-green-700 border-green-200"
                                data-testid={`badge-brand-${index}`}
                              >
                                {brandName}
                              </Badge>
                            ))}
                            {vendorBrands.length > 2 && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                +{vendorBrands.length - 2} more
                              </Badge>
                            )}
                          </>
                        );
                      }
                      return (
                        <Badge variant="outline" className="text-xs bg-gray-50 text-gray-500 border-gray-200">
                          No brands
                        </Badge>
                      );
                    })()}
                  </div>

                  {/* Sales Rep Info */}
                  {(() => {
                    const vendorReps = representatives.filter(rep => rep.vendorId === vendor.id);
                    if (vendorReps.length > 0) {
                      const primaryRep = vendorReps[0];
                      return (
                        <div className="text-sm">
                          <button
                            className="font-medium text-blue-600 hover:text-blue-800 underline text-left"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRepresentative(primaryRep);
                              setShowEditRepModal(true);
                            }}
                          >
                            {primaryRep.name}
                          </button>
                          <div className="text-gray-500 text-xs">
                            {primaryRep.cellPhone && <span>{formatPhoneNumber(primaryRep.cellPhone)}</span>}
                            {primaryRep.email && primaryRep.cellPhone && <span> • </span>}
                            {primaryRep.email && <span>{primaryRep.email}</span>}
                          </div>
                          {vendorReps.length > 1 && (
                            <p className="text-xs text-gray-400">+{vendorReps.length - 1} more rep{vendorReps.length > 2 ? 's' : ''}</p>
                          )}
                        </div>
                      );
                    }
                    return <p className="text-sm text-gray-400 italic">No sales reps assigned</p>;
                  })()}
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
            <h3 className="text-lg font-semibold text-gray-900">Vendor Directory</h3>
            <span className="text-sm text-gray-500">{sortedVendors.length} vendors</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="px-6 py-4">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-semibold text-gray-900">Company</span>
                    <ArrowUpDown 
                      className="h-3 w-3 text-gray-400 cursor-pointer hover:text-gray-600" 
                      onClick={() => handleSort('companyName')}
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
                    <span className="text-sm font-semibold text-gray-900">Contact</span>
                    <ArrowUpDown 
                      className="h-3 w-3 text-gray-400 cursor-pointer hover:text-gray-600" 
                      onClick={() => handleSort('phone')}
                    />
                  </div>
                </TableHead>
                <TableHead className="px-6 py-4">
                  <span className="text-sm font-semibold text-gray-900">Categories</span>
                </TableHead>
                <TableHead className="px-6 py-4">
                  <span className="text-sm font-semibold text-gray-900">Brands</span>
                </TableHead>
                <TableHead className="px-6 py-4">
                  <span className="text-sm font-semibold text-gray-900">Services</span>
                </TableHead>
                <TableHead className="px-6 py-4">
                  <span className="text-sm font-semibold text-gray-900">Sales Representatives</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedVendors.map((vendor) => (
                <TableRow 
                  key={vendor.id} 
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleVendorClick(vendor)}
                >
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building className="text-blue-600 h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">{vendor.companyName}</p>
                        <p className="text-sm text-gray-500">{vendor.vendorNumber}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="space-y-1">
                      {vendor.phone && (
                        <p className="text-sm text-gray-600">
                          {formatPhoneNumber(vendor.phone)}
                          {vendor.phoneExtension && ` ext. ${vendor.phoneExtension}`}
                        </p>
                      )}
                      {vendor.email && (
                        <p className="text-sm text-blue-600 break-all">{vendor.email}</p>
                      )}
                      {!vendor.phone && !vendor.email && (
                        <p className="text-sm text-gray-400 italic">No contact info</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="space-y-1">
                      {(() => {
                        const vendorBrands = getBrandNames(vendor.brands || []);
                        const brandGroups = groupCategoriesByBrand(vendor.categories || [], vendorBrands);
                        
                        if (Object.keys(brandGroups).length === 0) {
                          return (
                            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                              No categories
                            </Badge>
                          );
                        }
                        
                        return Object.entries(brandGroups).slice(0, 2).map(([brand, subcategories]) => (
                          <div key={brand}>
                            <button 
                              className="flex items-center gap-1 text-sm hover:bg-gray-50 p-1 rounded"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                toggleBrandDropdown(vendor.id, brand); 
                              }}
                            >
                              {expandedBrands[`${vendor.id}-${brand}`] ? 
                                <ChevronDown className="h-3 w-3 text-gray-500" /> : 
                                <ChevronRight className="h-3 w-3 text-gray-500" />
                              }
                              <Badge 
                                variant="outline" 
                                className="text-xs bg-green-50 text-green-700 border-green-200"
                              >
                                {brand} ({subcategories.length})
                              </Badge>
                            </button>
                            {expandedBrands[`${vendor.id}-${brand}`] && (
                              <div className="ml-4 mt-1 space-y-1 max-w-xs">
                                {subcategories.slice(0, 3).map((subcat, idx) => (
                                  <div key={idx} className="text-xs text-gray-600 flex items-center">
                                    <span className="w-2 h-px bg-gray-300 mr-2"></span>
                                    <span className="truncate">{subcat}</span>
                                  </div>
                                ))}
                                {subcategories.length > 3 && (
                                  <div className="text-xs text-gray-400 ml-4">
                                    +{subcategories.length - 3} more...
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ));
                      })()}
                      {(() => {
                        const vendorBrands = getBrandNames(vendor.brands || []);
                        const brandGroups = groupCategoriesByBrand(vendor.categories || [], vendorBrands);
                        const totalBrands = Object.keys(brandGroups).length;
                        
                        if (totalBrands > 2) {
                          return (
                            <div className="text-xs text-gray-400">
                              +{totalBrands - 2} more brands...
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(() => {
                        const vendorBrands = getBrandNames(vendor.brands || []);
                        if (vendorBrands.length > 0) {
                          return (
                            <>
                              {vendorBrands.slice(0, 2).map((brandName, index) => (
                                <Badge 
                                  key={index}
                                  variant="outline"
                                  className="text-xs bg-green-50 text-green-700 border-green-200"
                                  data-testid={`table-brand-${index}`}
                                >
                                  {brandName}
                                </Badge>
                              ))}
                              {vendorBrands.length > 2 && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  +{vendorBrands.length - 2}
                                </Badge>
                              )}
                            </>
                          );
                        }
                        return (
                          <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                            No brands
                          </Badge>
                        );
                      })()}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {vendor.services && vendor.services.length > 0 ? (
                        vendor.services.slice(0, 2).map((service, index) => (
                          <Badge 
                            key={index}
                            variant="outline"
                            className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                          >
                            {service}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                          No services
                        </Badge>
                      )}
                      {vendor.services && vendor.services.length > 2 && (
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                          +{vendor.services.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {(() => {
                      const vendorReps = representatives.filter(rep => rep.vendorId === vendor.id);
                      if (vendorReps.length === 0) {
                        return <p className="text-gray-400 italic text-sm">No sales reps assigned</p>;
                      }
                      return (
                        <div className="space-y-2">
                          {vendorReps.slice(0, 2).map((rep, index) => (
                            <div key={index} className="text-sm">
                              <button
                                className="font-medium text-blue-600 hover:text-blue-800 underline text-left"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRepresentative(rep);
                                  setShowEditRepModal(true);
                                }}
                              >
                                {rep.name}
                              </button>
                              <div className="flex items-center space-x-2 text-gray-500 text-xs">
                                {rep.cellPhone && <span>{formatPhoneNumber(rep.cellPhone)}</span>}
                                {rep.email && <span>{rep.email}</span>}
                              </div>
                            </div>
                          ))}
                          {vendorReps.length > 2 && (
                            <p className="text-xs text-gray-400">+{vendorReps.length - 2} more</p>
                          )}
                        </div>
                      );
                    })()}
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <span>Showing 1 to {filteredVendors.length} of {filteredVendors.length} vendors</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </Card>

      <AddVendorModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
      />

      <VendorDetailModal
        vendor={selectedVendor}
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        startInEditMode={startInEditMode}
      />

      <EditRepresentativeModal
        representative={selectedRepresentative}
        isOpen={showEditRepModal}
        onClose={() => {
          setShowEditRepModal(false);
          setSelectedRepresentative(null);
        }}
      />
    </div>
  );
}
