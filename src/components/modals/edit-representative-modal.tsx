import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertRepresentativeSchema, type InsertRepresentative, type Representative, type Vendor, type PhoneContact, type EmailContact } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Save, X } from "lucide-react";
import { MultiPhoneField, MultiEmailField } from "@/components/ui/multi-contact-field";

interface EditRepresentativeModalProps {
  representative: Representative | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditRepresentativeModal({ representative, isOpen, onClose }: EditRepresentativeModalProps) {
  const { toast } = useToast();
  
  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });
  
  const form = useForm<InsertRepresentative>({
    resolver: zodResolver(insertRepresentativeSchema),
    defaultValues: {
      name: "",
      position: "",
      email: "",
      cellPhone: "",
      vendorId: "",
      vendorName: "",
      phones: [],
      emails: [],
    }
  });

  // Reset form when representative changes
  useEffect(() => {
    if (representative) {
      form.reset({
        name: representative.name,
        position: representative.position || "",
        email: representative.email || "",
        cellPhone: representative.cellPhone || "",
        vendorId: representative.vendorId || "",
        vendorName: representative.vendorName || "",
        phones: representative.phones || [],
        emails: representative.emails || [],
      });
    }
  }, [representative, form]);

  const updateRepresentativeMutation = useMutation({
    mutationFn: async (data: InsertRepresentative) => {
      if (!representative) return;
      const response = await apiRequest("PUT", `/api/representatives/${representative.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/representatives"] });
      toast({
        title: "Success",
        description: "Representative updated successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update representative",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: InsertRepresentative) => {
    updateRepresentativeMutation.mutate(data);
  };

  if (!representative) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">Edit Representative</DialogTitle>
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
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter representative name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position/Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Sales Manager, Account Executive" 
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address (Backup)</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="email@company.com"
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
                name="cellPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Backup)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="(555) 123-4567"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="vendorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Associated Vendor *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor company" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vendors?.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                disabled={updateRepresentativeMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {updateRepresentativeMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}