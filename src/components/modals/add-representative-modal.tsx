import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertRepresentativeSchema, type InsertRepresentative, type Vendor, type PhoneContact, type EmailContact } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PhoneInput } from "@/components/ui/phone-input";
import { MultiPhoneField, MultiEmailField } from "@/components/ui/multi-contact-field";

interface AddRepresentativeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddRepresentativeModal({ isOpen, onClose }: AddRepresentativeModalProps) {
  const { toast } = useToast();
  
  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const form = useForm<InsertRepresentative>({
    resolver: zodResolver(insertRepresentativeSchema),
    defaultValues: {
      name: "",
      vendorId: "",
      position: "",
      cellPhone: "",
      cellPhoneExtension: "",
      email: "",
      vendorName: "",
      phones: [],
      emails: [],
    }
  });

  const createRepresentativeMutation = useMutation({
    mutationFn: async (data: InsertRepresentative) => {
      const response = await apiRequest("POST", "/api/representatives", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/representatives"] });
      toast({
        title: "Success",
        description: "Representative created successfully",
      });
      form.reset();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create representative",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertRepresentative) => {
    // Find the vendor name from the selected vendor ID
    const selectedVendor = vendors?.find(v => v.id === data.vendorId);
    const submissionData = {
      ...data,
      vendorName: selectedVendor?.companyName || "",
    };
    createRepresentativeMutation.mutate(submissionData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">Add Sales Representative</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
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
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter position/title" {...field} value={field.value || ""} />
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
                  <FormLabel>Vendor *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vendor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vendors?.sort((a, b) => a.companyName.localeCompare(b.companyName)).map((vendor) => (
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PhoneInput
                phoneValue={form.watch("cellPhone") || ""}
                extensionValue={form.watch("cellPhoneExtension") || ""}
                onPhoneChange={(value) => form.setValue("cellPhone", value)}
                onExtensionChange={(value) => form.setValue("cellPhoneExtension", value)}
                phoneLabel="Cell Phone (Backup)"
                extensionLabel="Ext"
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address (Backup)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={createRepresentativeMutation.isPending}
              >
                {createRepresentativeMutation.isPending ? "Adding..." : "Add Representative"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
