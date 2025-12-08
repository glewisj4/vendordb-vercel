import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Trade, InsertTrade } from "@shared/schema";

export function useTrades() {
  return useQuery<Trade[]>({
    queryKey: ["/api/trades"],
  });
}

export function useCreateTrade() {
  return useMutation({
    mutationFn: async (data: InsertTrade) => {
      const response = await apiRequest("POST", "/api/trades", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
    },
  });
}