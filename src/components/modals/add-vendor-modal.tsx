import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { X, ChevronDown, ChevronRight, Search } from "lucide-react";
import { insertVendorSchema, type InsertVendor, type Category, type Service, type PhoneContact, type EmailContact } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PhoneInput } from "@/components/ui/phone-input";
import { MultiPhoneField, MultiEmailField } from "@/components/ui/multi-contact-field";
import BrandSelection from "@/components/brand-selection";

interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddVendorModal({ isOpen, onClose }: AddVendorModalProps) {
  const { toast } = useToast();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [categorySearchQuery, setCategorySearchQuery] = useState("");

  // Get categories and services from API
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });
  
  const form = useForm<InsertVendor>({
    resolver: zodResolver(insertVendorSchema),
    defaultValues: {
      companyName: "",
      phone: "",
      phoneExtension: "",
      email: "",
      fax: "",
      phones: [],
      emails: [],
      categories: [],
      brands: [],
      services: [],
      notes: "",
      vendorNumber: "", // This will be auto-generated on the server
    }
  });

  const createVendorMutation = useMutation({
    mutationFn: async (data: InsertVendor) => {
      const response = await apiRequest("POST", "/api/vendors", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: "Success",
        description: "Vendor created successfully",
      });
      form.reset();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create vendor",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertVendor) => {
    createVendorMutation.mutate(data);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">Add New Vendor</DialogTitle>
        </DialogHeader>
        
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
                      <Input placeholder="Auto-generated if empty" {...field} value={field.value || ""} />
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
                const brands: string[] = Array.isArray(field.value) ? [...field.value] : [];
                const currentCategories = form.watch("categories") || [];
                
                return (
                  <FormItem>
                    <FormControl>
                      <BrandSelection
                        selectedBrands={brands}
                        onBrandsChange={(newBrands: string[]) => field.onChange(newBrands)}
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Services Offered</FormLabel>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {availableServices.map((service) => (
                        <FormItem key={service} className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(service)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...(field.value || []), service]);
                                } else {
                                  field.onChange(field.value?.filter((value) => value !== service));
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {service}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </div>
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
                      placeholder="Enter any additional notes about this vendor..."
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={createVendorMutation.isPending}
              >
                {createVendorMutation.isPending ? "Adding..." : "Add Vendor"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
