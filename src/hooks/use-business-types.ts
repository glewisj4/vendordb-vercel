import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BusinessType, InsertBusinessType } from "@shared/schema";

export function useBusinessTypes() {
  return useQuery<BusinessType[]>({
    queryKey: ["/api/business-types"],
  });
}

export function useCreateBusinessType() {
  return useMutation({
    mutationFn: async (businessType: InsertBusinessType) => {
      return apiRequest("POST", "/api/business-types", businessType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-types"] });
    },
  });
}

export function useDeleteBusinessType() {
  return useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/business-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-types"] });
    },
  });
}