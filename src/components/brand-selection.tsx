import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronDown, ChevronRight, Building2 } from "lucide-react";
import type { Brand } from "@shared/schema";
import { getBrandTemplateCategories, mergeCategoriesUniquely, removeBrandCategories } from "@/lib/utils";

interface BrandSelectionProps {
  selectedBrands: string[];
  onBrandsChange: (brands: string[]) => void;
  onBrandCategoriesChange?: (categories: string[]) => void;
  currentCategories?: string[];
}

export default function BrandSelection({ selectedBrands, onBrandsChange, onBrandCategoriesChange, currentCategories = [] }: BrandSelectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIndustries, setExpandedIndustries] = useState<Set<string>>(new Set());

  // Get brands from API
  const { data: brands = [], isLoading } = useQuery<Brand[]>({
    queryKey: ["/api/brands"],
  });

  // Filter brands based on search query
  const filteredBrands = brands.filter(brand => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      brand.name.toLowerCase().includes(searchLower) ||
      (brand.industry && brand.industry.toLowerCase().includes(searchLower)) ||
      (brand.description && brand.description.toLowerCase().includes(searchLower))
    );
  });

  // Group brands by industry
  const brandsByIndustry = filteredBrands.reduce((acc, brand) => {
    const industry = brand.industry ?? "Other";
    if (!acc[industry]) acc[industry] = [];
    acc[industry].push(brand);
    return acc;
  }, {} as Record<string, Brand[]>);

  const handleBrandToggle = async (brandId: string) => {
    const isCurrentlySelected = selectedBrands.includes(brandId);
    const newBrands = isCurrentlySelected
      ? selectedBrands.filter(id => id !== brandId)
      : [...selectedBrands, brandId];
    
    onBrandsChange(newBrands);
    
    // Handle category auto-assignment if callback is provided
    if (onBrandCategoriesChange && brands.length > 0) {
      try {
        if (isCurrentlySelected) {
          // Brand is being deselected - remove its categories
          const brandToRemove = brands.find(b => b.id === brandId);
          if (brandToRemove) {
            const updatedCategories = removeBrandCategories(currentCategories, brandToRemove.name);
            onBrandCategoriesChange(updatedCategories);
          }
        } else {
          // Brand is being selected - add its categories
          const brandCategories = await getBrandTemplateCategories([brandId], brands);
          const updatedCategories = mergeCategoriesUniquely(currentCategories, brandCategories);
          onBrandCategoriesChange(updatedCategories);
        }
      } catch (error) {
        console.warn('Failed to update categories for brand change:', error);
      }
    }
  };

  const toggleIndustryExpansion = (industry: string) => {
    const newExpanded = new Set(expandedIndustries);
    if (newExpanded.has(industry)) {
      newExpanded.delete(industry);
    } else {
      newExpanded.add(industry);
    }
    setExpandedIndustries(newExpanded);
  };

  const getSelectedBrandNames = () => {
    return brands
      .filter(brand => selectedBrands.includes(brand.id))
      .map(brand => brand.name);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Brands</Label>
        <div className="text-sm text-muted-foreground">Loading brands...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Brands</Label>
        <div className="text-sm text-muted-foreground">
          {selectedBrands.length} selected
        </div>
      </div>

      {/* Selected brands display */}
      {selectedBrands.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {getSelectedBrandNames().map(brandName => (
            <Badge key={brandName} variant="secondary" className="text-xs">
              {brandName}
            </Badge>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search brands..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-brand-search"
        />
      </div>

      {/* Brand selection grouped by industry */}
      <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-2">
        {Object.keys(brandsByIndustry).length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No brands found
          </div>
        ) : (
          Object.entries(brandsByIndustry).map(([industry, industryBrands]) => (
            <div key={industry} className="space-y-1">
              {/* Industry header */}
              <button
                type="button"
                onClick={() => toggleIndustryExpansion(industry)}
                className="flex items-center gap-2 w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid={`button-toggle-industry-${industry.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {expandedIndustries.has(industry) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <Building2 className="h-4 w-4" />
                {industry} ({industryBrands.length})
              </button>

              {/* Brands in this industry */}
              {expandedIndustries.has(industry) && (
                <div className="ml-6 space-y-1">
                  {industryBrands.map(brand => (
                    <div key={brand.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`brand-${brand.id}`}
                        checked={selectedBrands.includes(brand.id)}
                        onCheckedChange={() => handleBrandToggle(brand.id)}
                        data-testid={`checkbox-brand-${brand.id}`}
                      />
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={`brand-${brand.id}`}
                          className="text-sm cursor-pointer"
                          data-testid={`label-brand-${brand.id}`}
                        >
                          {brand.name}
                        </Label>
                        {brand.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {brand.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 text-xs">
        <button
          type="button"
          onClick={() => setExpandedIndustries(new Set(Object.keys(brandsByIndustry)))}
          className="text-muted-foreground hover:text-foreground transition-colors"
          data-testid="button-expand-all-industries"
        >
          Expand All
        </button>
        <span className="text-muted-foreground">•</span>
        <button
          type="button"
          onClick={() => setExpandedIndustries(new Set())}
          className="text-muted-foreground hover:text-foreground transition-colors"
          data-testid="button-collapse-all-industries"
        >
          Collapse All
        </button>
      </div>
    </div>
  );
}