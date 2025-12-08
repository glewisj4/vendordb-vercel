import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertManagedPropertySchema, type ManagedProperty, type InsertManagedProperty } from "@shared/schema";

export function useManagedProperties(proCustomerId: string | undefined) {
  return useQuery<ManagedProperty[]>({
    queryKey: ["/api/managed-properties", proCustomerId],
    enabled: !!proCustomerId,
  });
}

export function useCreateManagedProperty() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertManagedProperty) => {
      const validatedData = insertManagedPropertySchema.parse(data);
      const response = await apiRequest("POST", "/api/managed-properties", validatedData);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/managed-properties", variables.proCustomerId] 
      });
      toast({
        title: "Success",
        description: "Property created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create property",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateManagedProperty() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertManagedProperty> }) => {
      const response = await apiRequest("PATCH", `/api/managed-properties/${id}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/managed-properties", data.proCustomerId] 
      });
      toast({
        title: "Success",
        description: "Property updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update property",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteManagedProperty() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, proCustomerId }: { id: string; proCustomerId: string }) => {
      await apiRequest("DELETE", `/api/managed-properties/${id}`);
      return { proCustomerId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/managed-properties", data.proCustomerId] 
      });
      toast({
        title: "Success",
        description: "Property deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete property",
        variant: "destructive",
      });
    },
  });
}
