import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Edit, 
  Globe, 
  Calendar,
  Package,
  Building2,
  Trash2,
  Settings
} from "lucide-react";

const editBrandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  description: z.string().optional(),
  isGeneric: z.boolean(),
  industry: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
});

type EditBrandForm = z.infer<typeof editBrandSchema>;

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

interface BrandDetailModalProps {
  brand: Brand;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BrandDetailModal({ brand, open, onOpenChange }: BrandDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditBrandForm>({
    resolver: zodResolver(editBrandSchema),
    defaultValues: {
      name: brand.name,
      description: brand.description || "",
      isGeneric: brand.isGeneric,
      industry: brand.industry || "",
      website: brand.website || "",
    },
  });

  const updateBrandMutation = useMutation({
    mutationFn: async (data: EditBrandForm) => {
      const response = await apiRequest("PATCH", `/api/brands/${brand.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      toast({
        title: "Success",
        description: "Brand updated successfully!",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update brand",
        variant: "destructive",
      });
    },
  });

  const deleteBrandMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/brands/${brand.id}`);
      if (response.status === 204) {
        return null; // 204 responses have no content
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      toast({
        title: "Success",
        description: "Brand deleted successfully!",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete brand",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditBrandForm) => {
    updateBrandMutation.mutate(data);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this brand? This action cannot be undone.")) {
      deleteBrandMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="modal-brand-detail">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {brand.name}
              {brand.isGeneric && (
                <Badge variant="outline">Generic</Badge>
              )}
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                data-testid="button-edit"
              >
                <Edit className="h-4 w-4 mr-1" />
                {isEditing ? "Cancel" : "Edit"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={deleteBrandMutation.isPending}
                data-testid="button-delete"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            {isEditing ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand Name *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-name" />
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
                          <Textarea {...field} data-testid="input-edit-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-website" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-industry" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isGeneric"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Generic Brand</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Check if this represents unbranded/generic products
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-edit-generic"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      data-testid="button-cancel-edit"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateBrandMutation.isPending}
                      data-testid="button-save"
                    >
                      {updateBrandMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="space-y-6">
                {/* Brand Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Industry
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-semibold capitalize" data-testid="text-industry">
                        {brand.industry ? brand.industry.replace('_', ' & ') : 'Not specified'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Active Vendors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-semibold" data-testid="text-vendor-count">
                        {brand.vendorCount}
                      </p>
                    </CardContent>
                  </Card>

                  {brand.website && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Website
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <a 
                          href={brand.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                          data-testid="link-website"
                        >
                          {brand.website.replace(/^https?:\/\//, '')}
                        </a>
                      </CardContent>
                    </Card>
                  )}

                  {brand.templateVersion && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Template Version
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="outline" data-testid="badge-template-version">
                          v{brand.templateVersion}
                        </Badge>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {brand.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground" data-testid="text-description">
                        {brand.description}
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Timestamps
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Created:</span>
                      <span data-testid="text-created">
                        {new Date(brand.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Updated:</span>
                      <span data-testid="text-updated">
                        {new Date(brand.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Category Management</h3>
                <p className="text-muted-foreground mb-4">
                  Brand category management will be available in the next update
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vendors" className="space-y-4">
            <Card>
              <CardContent className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Associated Vendors</h3>
                <p className="text-muted-foreground mb-4">
                  View vendors that work with this brand
                </p>
                <p className="text-sm text-muted-foreground">
                  Currently {brand.vendorCount} vendors are associated with this brand
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}