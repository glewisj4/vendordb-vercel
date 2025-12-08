import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertProContactSchema, type ProContact, type InsertProContact } from "@shared/schema";

export function useProContacts(proCustomerId: string | undefined) {
  return useQuery<ProContact[]>({
    queryKey: ["/api/pro-contacts", proCustomerId],
    enabled: !!proCustomerId,
  });
}

export function useCreateProContact() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertProContact) => {
      const validatedData = insertProContactSchema.parse(data);
      const response = await apiRequest("POST", "/api/pro-contacts", validatedData);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/pro-contacts", variables.proCustomerId] 
      });
      toast({
        title: "Success",
        description: "Contact created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create contact",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateProContact() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertProContact> }) => {
      const response = await apiRequest("PATCH", `/api/pro-contacts/${id}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/pro-contacts", data.proCustomerId] 
      });
      toast({
        title: "Success",
        description: "Contact updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update contact",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteProContact() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, proCustomerId }: { id: string; proCustomerId: string }) => {
      await apiRequest("DELETE", `/api/pro-contacts/${id}`);
      return { proCustomerId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/pro-contacts", data.proCustomerId] 
      });
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive",
      });
    },
  });
}
