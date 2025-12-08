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
import { insertServiceSchema, type InsertService, type Service } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EditServiceModalProps {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditServiceModal({ service, isOpen, onClose }: EditServiceModalProps) {
  const { toast } = useToast();

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const form = useForm<InsertService>({
    resolver: zodResolver(insertServiceSchema),
    defaultValues: {
      name: "",
      description: "",
      level: "1",
      parentId: null,
      path: "",
      subservices: [],
      vendorCount: "0",
    }
  });

  // Reset form when service changes
  useEffect(() => {
    if (service) {
      form.reset({
        name: service.name,
        description: service.description || "",
        level: service.level,
        parentId: service.parentId,
        path: service.path || "",
        subservices: service.subservices || [],
        vendorCount: service.vendorCount || "0",
      });
    }
  }, [service, form]);

  const updateServiceMutation = useMutation({
    mutationFn: async (data: InsertService) => {
      if (!service) return;
      const response = await apiRequest("PUT", `/api/services/${service.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: "Success",
        description: "Service updated successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update service",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertService) => {
    // Build the path based on parent selection
    let servicePath = data.name;
    if (data.parentId) {
      const parent = services.find(s => s.id === data.parentId);
      if (parent) {
        servicePath = `${parent.path} > ${data.name}`;
      }
    }

    updateServiceMutation.mutate({
      ...data,
      path: servicePath,
    });
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Get available parent services (level 1 and 2 only), excluding current service and its children
  const availableParents = services.filter(s => 
    (s.level === "1" || s.level === "2") && 
    s.id !== service?.id && 
    !s.path?.includes(service?.name || "")
  );

  const selectedLevel = form.watch("level");

  // Filter parents based on selected level
  const filteredParents = availableParents.filter(parent => {
    if (selectedLevel === "1") return false; // Level 1 services have no parent
    if (selectedLevel === "2") return parent.level === "1";
    if (selectedLevel === "3") return parent.level === "2";
    return false;
  });

  if (!service) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Service</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter service name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Level *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Level 1 (Main Category)</SelectItem>
                        <SelectItem value="2">Level 2 (Subcategory)</SelectItem>
                        <SelectItem value="3">Level 3 (Sub-subcategory)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedLevel !== "1" && (
              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Service *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredParents.map((parent) => (
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter service description" 
                      {...field} 
                      value={field.value || ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={updateServiceMutation.isPending}
              >
                {updateServiceMutation.isPending ? "Updating..." : "Update Service"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}