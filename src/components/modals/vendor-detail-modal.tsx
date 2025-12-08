import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building, Edit, Save, X, Phone, Mail, Calendar, Hash, User, Users, ChevronDown, ChevronRight, Search, Trash2, Plus, UserPlus } from "lucide-react";
import { insertVendorSchema, insertRepresentativeSchema, type Vendor, type InsertVendor, type Representative, type InsertRepresentative, type Category, type Service, type PhoneContact, type EmailContact } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PhoneInput } from "@/components/ui/phone-input";
import BrandSelection from "@/components/brand-selection";
import { MultiPhoneField, MultiEmailField } from "@/components/ui/multi-contact-field";
import { z } from "zod";

interface VendorDetailModalProps {
  vendor: Vendor | null;
  isOpen: boolean;
  onClose: () => void;
  startInEditMode?: boolean;
}

export default function VendorDetailModal({ vendor, isOpen, onClose, startInEditMode = false }: VendorDetailModalProps) {
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [showAddRepForm, setShowAddRepForm] = useState(false);
  const { toast } = useToast();

  // Get sales representatives for this vendor
  const { data: representatives = [] } = useQuery<Representative[]>({
    queryKey: ["/api/representatives"],
    enabled: !!vendor?.id,
  });

  // Get categories and services from API
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const { data: brands = [] } = useQuery<any[]>({
    queryKey: ["/api/brands"],
  });

  const vendorReps = representatives.filter(rep => rep.vendorId === vendor?.id);

  // Form for adding new sales rep
  const repFormSchema = insertRepresentativeSchema.extend({
    name: z.string().min(1, "Name is required"),
  });
  
  const repForm = useForm<InsertRepresentative>({
    resolver: zodResolver(repFormSchema),
    defaultValues: {
      name: "",
      vendorId: vendor?.id || "",
      vendorName: vendor?.companyName || "",
      position: "",
      cellPhone: "",
      cellPhoneExtension: "",
      email: "",
      phones: [],
      emails: [],
    }
  });

  // Reset rep form when vendor changes
  useEffect(() => {
    if (vendor) {
      repForm.reset({
        name: "",
        vendorId: vendor.id,
        vendorName: vendor.companyName,
        position: "",
        cellPhone: "",
        cellPhoneExtension: "",
        email: "",
        phones: [],
        emails: [],
      });
    }
  }, [vendor, repForm]);

  // Mutation for creating new sales rep
  const createRepMutation = useMutation({
    mutationFn: async (data: InsertRepresentative) => {
      const response = await apiRequest("POST", "/api/representatives", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/representatives"] });
      toast({
        title: "Success",
        description: "Sales representative added successfully",
      });
      repForm.reset({
        name: "",
        vendorId: vendor?.id || "",
        vendorName: vendor?.companyName || "",
        position: "",
        cellPhone: "",
        cellPhoneExtension: "",
        email: "",
        phones: [],
        emails: [],
      });
      setShowAddRepForm(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add sales representative",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting sales rep
  const deleteRepMutation = useMutation({
    mutationFn: async (repId: string) => {
      await apiRequest("DELETE", `/api/representatives/${repId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/representatives"] });
      toast({
        title: "Success",
        description: "Sales representative removed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove sales representative",
        variant: "destructive",
      });
    },
  });

  const onSubmitRep = (data: InsertRepresentative) => {
    createRepMutation.mutate({
      ...data,
      vendorId: vendor?.id || "",
      vendorName: vendor?.companyName || "",
    });
  };

  const handleDeleteRep = (repId: string, repName: string) => {
    if (confirm(`Are you sure you want to remove ${repName}?`)) {
      deleteRepMutation.mutate(repId);
    }
  };

  const form = useForm<InsertVendor>({
    resolver: zodResolver(insertVendorSchema),
    defaultValues: {
      companyName: vendor?.companyName || "",
      phone: vendor?.phone || "",
      email: vendor?.email || "",
      fax: vendor?.fax || "",
      categories: vendor?.categories || [],
      brands: vendor?.brands || [],
      services: vendor?.services || [],
      notes: vendor?.notes || "",
      vendorNumber: vendor?.vendorNumber || "",
      phones: [],
      emails: [],
    }
  });

  // Reset form when vendor changes and set edit mode
  useEffect(() => {
    if (vendor) {
      form.reset({
        companyName: vendor.companyName,
        phone: vendor.phone || "",
        email: vendor.email || "",
        fax: vendor.fax || "",
        categories: vendor.categories || [],
        brands: vendor.brands || [],
        services: vendor.services || [],
        notes: vendor.notes || "",
        vendorNumber: vendor.vendorNumber,
        phones: vendor.phones || [],
        emails: vendor.emails || [],
      });
    }
    setIsEditing(startInEditMode);
  }, [vendor, form, startInEditMode]);

  const updateVendorMutation = useMutation({
    mutationFn: async (data: InsertVendor) => {
      if (!vendor) return;
      const response = await apiRequest("PUT", `/api/vendors/${vendor.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: "Success",
        description: "Vendor updated successfully",
      });
      setIsEditing(false);
      // Close the modal after successful update
      setTimeout(() => {
        handleClose();
      }, 500); // Small delay to show success message
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update vendor",
        variant: "destructive",
      });
    },
  });

  const deleteVendorMutation = useMutation({
    mutationFn: async () => {
      if (!vendor) return;
      await apiRequest("DELETE", `/api/vendors/${vendor.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: "Success",
        description: "Vendor deleted successfully",
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete vendor",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertVendor) => {
    updateVendorMutation.mutate(data);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${vendor?.companyName}? This action cannot be undone.`)) {
      deleteVendorMutation.mutate();
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setShowAddRepForm(false);
    form.reset();
    repForm.reset();
    onClose();
  };

  // Build hierarchical category structure
  const topLevelCategories = categories.filter(cat => cat.level === "1");
  
  // Filter categories based on search query
  const filteredTopLevelCategories = topLevelCategories.filter(category => {
    if (!categorySearchQuery) return true;
    
    const searchLower = categorySearchQuery.toLowerCase();
    const categoryMatches = category.name.toLowerCase().includes(searchLower);
    
    // Also check if any subcategories match
    const subcategoriesMatch = getSubcategories(category.id).some(subcat => 
      subcat.name.toLowerCase().includes(searchLower) ||
      getSubcategories(subcat.id).some(subSubcat => 
        subSubcat.name.toLowerCase().includes(searchLower)
      )
    );
    
    return categoryMatches || subcategoriesMatch;
  });

  // Auto-expand categories when searching
  const shouldAutoExpand = (categoryId: string): boolean => {
    if (!categorySearchQuery) return expandedCategories.has(categoryId);
    
    const searchLower = categorySearchQuery.toLowerCase();
    const subcategories = getSubcategories(categoryId);
    
    return subcategories.some(subcat => 
      subcat.name.toLowerCase().includes(searchLower) ||
      getSubcategories(subcat.id).some(subSubcat => 
        subSubcat.name.toLowerCase().includes(searchLower)
      )
    ) || expandedCategories.has(categoryId);
  };
  
  // Extract service names from database services
  const availableServices = services.map(service => service.name);

  // Function to get subcategories for a parent category
  const getSubcategories = (parentId: string) => {
    return categories.filter(cat => cat.parentId === parentId);
  };

  // Toggle category expansion
  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
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
    };
    return colorMap[category.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (!vendor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building className="text-blue-600 h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  {vendor.companyName}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  {vendor.vendorNumber} - Vendor Details and Information
                </DialogDescription>
              </div>
            </div>
{isEditing ? (
              <div className="flex items-center space-x-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteVendorMutation.isPending}
                  className="flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{deleteVendorMutation.isPending ? "Deleting..." : "Delete"}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="vendorNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Vendor number" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="phones"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <MultiPhoneField 
                        value={field.value || []} 
                        onChange={field.onChange} 
                        label="Phone Numbers" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emails"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <MultiEmailField 
                        value={field.value || []} 
                        onChange={field.onChange} 
                        label="Email Addresses" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Backup)</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Enter phone number" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Backup)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email address" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="fax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fax</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Enter fax number" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="categories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categories</FormLabel>
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search categories..."
                          value={categorySearchQuery}
                          onChange={(e) => setCategorySearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                      {filteredTopLevelCategories.map((category) => {
                        const subcategories = getSubcategories(category.id);
                        const isExpanded = shouldAutoExpand(category.id);
                        const hasSubcategories = subcategories.length > 0;
                        
                        return (
                          <div key={category.id} className="mb-2">
                            {/* Top-level category */}
                            <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                              {hasSubcategories && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => toggleCategoryExpansion(category.id)}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                              {!hasSubcategories && <div className="w-6" />}
                              
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(category.name)}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || [];
                                    return checked
                                      ? field.onChange([...currentValue, category.name])
                                      : field.onChange(
                                          currentValue.filter((value) => value !== category.name)
                                        )
                                  }}
                                />
                              </FormControl>
                              
                              <FormLabel className="text-sm font-medium cursor-pointer flex-1">
                                {category.name}
                              </FormLabel>
                            </div>
                            
                            {/* Subcategories */}
                            {isExpanded && hasSubcategories && (
                              <div className="ml-8 mt-2 space-y-1">
                                {subcategories.map((subcat) => {
                                  const subSubcategories = getSubcategories(subcat.id);
                                  const isSubExpanded = shouldAutoExpand(subcat.id);
                                  const hasSubSubcategories = subSubcategories.length > 0;
                                  
                                  return (
                                    <div key={subcat.id}>
                                      <div className="flex items-center space-x-2 p-1 rounded hover:bg-gray-50">
                                        {hasSubSubcategories && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 w-5 p-0"
                                            onClick={() => toggleCategoryExpansion(subcat.id)}
                                          >
                                            {isSubExpanded ? (
                                              <ChevronDown className="h-3 w-3" />
                                            ) : (
                                              <ChevronRight className="h-3 w-3" />
                                            )}
                                          </Button>
                                        )}
                                        {!hasSubSubcategories && <div className="w-5" />}
                                        
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(subcat.name)}
                                            onCheckedChange={(checked) => {
                                              const currentValue = field.value || [];
                                              return checked
                                                ? field.onChange([...currentValue, subcat.name])
                                                : field.onChange(
                                                    currentValue.filter((value) => value !== subcat.name)
                                                  )
                                            }}
                                          />
                                        </FormControl>
                                        
                                        <FormLabel className="text-sm font-normal cursor-pointer flex-1">
                                          {subcat.name}
                                        </FormLabel>
                                      </div>
                                      
                                      {/* Sub-subcategories */}
                                      {isSubExpanded && hasSubSubcategories && (
                                        <div className="ml-6 mt-1 space-y-1">
                                          {subSubcategories.map((subSubcat) => (
                                            <div key={subSubcat.id} className="flex items-center space-x-2 p-1 rounded hover:bg-gray-50">
                                              <div className="w-5" />
                                              <FormControl>
                                                <Checkbox
                                                  checked={field.value?.includes(subSubcat.name)}
                                                  onCheckedChange={(checked) => {
                                                    const currentValue = field.value || [];
                                                    return checked
                                                      ? field.onChange([...currentValue, subSubcat.name])
                                                      : field.onChange(
                                                          currentValue.filter((value) => value !== subSubcat.name)
                                                        )
                                                  }}
                                                />
                                              </FormControl>
                                              
                                              <FormLabel className="text-xs font-normal cursor-pointer flex-1">
                                                {subSubcat.name}
                                              </FormLabel>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brands"
                render={({ field }) => {
                  const currentCategories = form.watch("categories") || [];
                  
                  return (
                    <FormItem>
                      <FormControl>
                        <BrandSelection
                          selectedBrands={field.value || []}
                          onBrandsChange={field.onChange}
                          onBrandCategoriesChange={(newCategories: string[]) => {
                            // Update the categories field with the new brand-derived categories
                            form.setValue("categories", newCategories);
                          }}
                          currentCategories={currentCategories}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="services"
                render={() => (
                  <FormItem>
                    <FormLabel>Services</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {availableServices.map((service) => (
                        <FormField
                          key={service}
                          control={form.control}
                          name="services"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={service}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(service)}
                                    onCheckedChange={(checked) => {
                                      const currentValue = field.value || [];
                                      return checked
                                        ? field.onChange([...currentValue, service])
                                        : field.onChange(
                                            currentValue.filter(
                                              (value) => value !== service
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {service}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter additional notes about this vendor..." 
                        className="min-h-[100px]"
                        {...field} 
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Sales Representatives Section in Edit Mode */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Sales Representatives</h3>
                    {vendorReps.length > 0 && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {vendorReps.length}
                      </Badge>
                    )}
                  </div>
                  {!showAddRepForm && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddRepForm(true)}
                      className="flex items-center space-x-1"
                      data-testid="button-add-rep"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Add Rep</span>
                    </Button>
                  )}
                </div>

                {/* Existing Sales Reps */}
                {vendorReps.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {vendorReps.map((rep) => (
                      <div 
                        key={rep.id} 
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        data-testid={`rep-item-${rep.id}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="text-green-600 h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{rep.name}</p>
                            <div className="flex items-center space-x-3 text-sm text-gray-500">
                              {rep.position && <span>{rep.position}</span>}
                              {rep.cellPhone && (
                                <span className="flex items-center space-x-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{rep.cellPhone}</span>
                                </span>
                              )}
                              {rep.email && (
                                <span className="flex items-center space-x-1">
                                  <Mail className="h-3 w-3" />
                                  <span>{rep.email}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRep(rep.id, rep.name)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid={`button-delete-rep-${rep.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Rep Form */}
                {showAddRepForm && (
                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                        <UserPlus className="h-4 w-4 text-blue-600" />
                        <span>Add New Sales Representative</span>
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowAddRepForm(false);
                          repForm.reset();
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Form {...repForm}>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={repForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Rep name" {...field} data-testid="input-rep-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={repForm.control}
                            name="position"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Position</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Sales Manager" {...field} value={field.value || ""} data-testid="input-rep-position" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={repForm.control}
                            name="cellPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cell Phone</FormLabel>
                                <FormControl>
                                  <Input placeholder="(555) 555-5555" {...field} value={field.value || ""} data-testid="input-rep-phone" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={repForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="email@example.com" {...field} value={field.value || ""} data-testid="input-rep-email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="flex justify-end space-x-2 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowAddRepForm(false);
                              repForm.reset();
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={repForm.handleSubmit(onSubmitRep)}
                            disabled={createRepMutation.isPending}
                            data-testid="button-save-rep"
                          >
                            {createRepMutation.isPending ? "Adding..." : "Add Rep"}
                          </Button>
                        </div>
                      </div>
                    </Form>
                  </div>
                )}

                {vendorReps.length === 0 && !showAddRepForm && (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No sales representatives yet</p>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => setShowAddRepForm(true)}
                      className="mt-1"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add your first rep
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={updateVendorMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updateVendorMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-6">
            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Hash className="text-gray-600 h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Vendor Number</p>
                    <p className="text-sm text-gray-600">{vendor.vendorNumber}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Phone className="text-gray-600 h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Phone</p>
                    <p className="text-sm text-gray-600">{vendor.phone || "No phone provided"}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Mail className="text-gray-600 h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">{vendor.email || "No email provided"}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Phone className="text-gray-600 h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Fax</p>
                    <p className="text-sm text-gray-600">{vendor.fax || "No fax provided"}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Sales Representatives Section */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Sales Representatives</h3>
                {vendorReps.length > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {vendorReps.length} {vendorReps.length === 1 ? 'rep' : 'reps'}
                  </Badge>
                )}
              </div>
              
              {vendorReps.length > 0 ? (
                <div className="grid gap-4">
                  {vendorReps.map((rep) => (
                    <div key={rep.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <User className="text-green-600 h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900">{rep.name}</h4>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {rep.position || "Sales Representative"}
                            </Badge>
                          </div>
                          <div className="mt-2 space-y-1">
                            {rep.cellPhone && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Phone className="h-4 w-4" />
                                <span>{rep.cellPhone}</span>
                              </div>
                            )}
                            {rep.email && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Mail className="h-4 w-4" />
                                <span>{rep.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No Sales Representatives</p>
                  <p className="text-sm text-gray-400">No sales reps have been assigned to this vendor yet.</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Categories */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {vendor.categories && vendor.categories.length > 0 ? (
                  vendor.categories.map((category, index) => (
                    <Badge 
                      key={index}
                      variant="secondary"
                      className={`text-sm ${getCategoryColors(category)}`}
                    >
                      {category}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No categories assigned</p>
                )}
              </div>
            </div>

            {/* Brands */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Brands</h3>
              <div className="flex flex-wrap gap-2">
                {vendor.brands && vendor.brands.length > 0 ? (
                  vendor.brands.map((brandId, index) => {
                    const brand = brands.find(b => b.id === brandId);
                    return brand ? (
                      <Badge 
                        key={index}
                        variant="outline"
                        className="text-sm bg-green-50 text-green-700 border-green-200"
                        data-testid={`modal-brand-${index}`}
                      >
                        {brand.name}
                      </Badge>
                    ) : null;
                  }).filter(Boolean)
                ) : (
                  <p className="text-sm text-gray-500 italic">No brands assigned</p>
                )}
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Services</h3>
              <div className="flex flex-wrap gap-2">
                {vendor.services && vendor.services.length > 0 ? (
                  vendor.services.map((service, index) => (
                    <Badge 
                      key={index}
                      variant="outline"
                      className="text-sm bg-orange-50 text-orange-700 border-orange-200"
                    >
                      {service}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No services assigned</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Notes */}
            {vendor.notes && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{vendor.notes}</p>
                </div>
              </div>
            )}

            {vendor.notes && <Separator />}

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Calendar className="text-gray-600 h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Date Added</p>
                    <p className="text-sm text-gray-600">
                      {vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : "Unknown"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Calendar className="text-gray-600 h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Last Updated</p>
                    <p className="text-sm text-gray-600">
                      {vendor.updatedAt ? new Date(vendor.updatedAt).toLocaleDateString() : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}