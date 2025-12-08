import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertCategorySchema, type InsertCategory, type Category, type Brand } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Save, X } from "lucide-react";

interface EditCategoryModalProps {
  category: Category | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditCategoryModal({ category, isOpen, onClose }: EditCategoryModalProps) {
  const { toast } = useToast();
  
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  const { data: brands = [] } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });
  
  const form = useForm<InsertCategory>({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      categoryType: "generic",
      brandId: null,
      level: "1",
      parentId: null,
      path: "",
      subcategories: [],
      vendorCount: "0",
    }
  });

  // Reset form when category changes
  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        description: category.description || "",
        categoryType: category.categoryType || "generic",
        brandId: category.brandId || null,
        level: category.level,
        parentId: category.parentId,
        path: category.path || "",
        subcategories: category.subcategories || [],
        vendorCount: category.vendorCount || "0",
      });
    }
  }, [category, form]);

  const updateCategoryMutation = useMutation({
    mutationFn: async (data: InsertCategory) => {
      if (!category) return;
      const response = await apiRequest("PUT", `/api/categories/${category.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    },
  });

  const watchedLevel = form.watch("level");
  const watchedCategoryType = form.watch("categoryType");
  const watchedBrandId = form.watch("brandId");

  // Filter categories based on level and category type for parent selection
  const getAvailableParents = () => {
    if (!categories) return [];
    
    const selectedLevel = parseInt(watchedLevel || "1");
    if (selectedLevel === 1) return []; // Level 1 has no parents
    
    const parentLevel = (selectedLevel - 1).toString();
    
    return categories.filter(cat => {
      // Exclude self
      if (cat.id === category?.id) return false;
      
      // Must be the correct parent level
      if (cat.level !== parentLevel) return false;
      
      // Category type matching rules
      if (watchedCategoryType === "generic") {
        // Generic categories can only have generic parents
        return cat.categoryType === "generic";
      } else if (watchedCategoryType === "branded") {
        // Branded categories can only have branded parents with the same brandId
        return cat.categoryType === "branded" && cat.brandId === watchedBrandId;
      }
      
      return false;
    });
  };

  const onSubmit = async (data: InsertCategory) => {
    // Build the path based on parent selection and category type
    let path = data.name;
    
    if (data.categoryType === "branded" && data.brandId && brands) {
      // For branded categories, include brand name in path
      const brand = brands.find(b => b.id === data.brandId);
      if (brand) {
        if (data.parentId && categories) {
          const parentCategory = categories.find(cat => cat.id === data.parentId);
          if (parentCategory) {
            path = `${parentCategory.path} > ${data.name}`;
          } else {
            // Top-level branded category
            path = `${brand.name} > ${data.name}`;
          }
        } else {
          // Top-level branded category
          path = `${brand.name} > ${data.name}`;
        }
      }
    } else {
      // For generic categories, standard hierarchy
      if (data.parentId && categories) {
        const parentCategory = categories.find(cat => cat.id === data.parentId);
        if (parentCategory) {
          path = parentCategory.path ? `${parentCategory.path} > ${data.name}` : `${parentCategory.name} > ${data.name}`;
        }
      }
    }
    
    const submissionData = {
      ...data,
      path,
    };
    
    updateCategoryMutation.mutate(submissionData);
  };

  if (!category) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">Edit Category</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter category name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter category description" 
                      className="resize-none" 
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Type *</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    // Reset parent when category type changes
                    form.setValue("parentId", null);
                    // Reset brandId when switching to generic
                    if (value === "generic") {
                      form.setValue("brandId", null);
                    }
                  }} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category-type">
                        <SelectValue placeholder="Select category type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="generic" data-testid="option-generic">Generic/Commodity</SelectItem>
                      <SelectItem value="branded" data-testid="option-branded">Brand-Specific</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("categoryType") === "branded" && (
              <FormField
                control={form.control}
                name="brandId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand *</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      // Reset parent when brand changes
                      form.setValue("parentId", null);
                    }} defaultValue={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-brand">
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id} data-testid={`option-brand-${brand.id}`}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Reset parent when level changes
                        form.setValue("parentId", null);
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Level 1 (Root)</SelectItem>
                        <SelectItem value="2">Level 2</SelectItem>
                        <SelectItem value="3">Level 3</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedLevel && parseInt(watchedLevel) > 1 && (
                <FormField
                  control={form.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select parent" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getAvailableParents().map((parent) => (
                            <SelectItem key={parent.id} value={parent.id}>
                              {parent.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={updateCategoryMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {updateCategoryMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}