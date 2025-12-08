import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Brand, BrandTemplate } from "@shared/schema"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to extract categories from brand templates
export async function getBrandTemplateCategories(brandIds: string[], brands: Brand[]): Promise<string[]> {
  if (brandIds.length === 0) return [];

  const categories: string[] = [];
  
  // Get selected brands
  const selectedBrands = brands.filter(brand => brandIds.includes(brand.id));
  
  // For each selected brand, fetch its template and extract categories
  for (const brand of selectedBrands) {
    if (brand.templateId) {
      try {
        // Fetch the brand template
        const response = await fetch(`/api/brand-templates/${brand.templateId}`);
        if (response.ok) {
          const template: BrandTemplate = await response.json();
          
          // Extract categories from template
          if (template.template?.categories) {
            const brandCategories = extractCategoriesFromTemplate(brand.name, template.template.categories);
            categories.push(...brandCategories);
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch template for brand ${brand.name}:`, error);
      }
    }
  }
  
  return categories;
}

// Helper function to recursively extract categories from template structure
function extractCategoriesFromTemplate(
  brandName: string, 
  categories: Array<{
    name: string;
    description?: string;
    subcategories?: Array<{
      name: string;
      description?: string;
      subcategories?: any[];
    }>;
  }>,
  parentPath: string = ""
): string[] {
  const result: string[] = [];
  
  for (const category of categories) {
    // Build the current path
    const currentPath = parentPath 
      ? `${parentPath} > ${category.name}`
      : `${brandName} > ${category.name}`;
    
    // Add the current category
    result.push(currentPath);
    
    // Recursively process subcategories
    if (category.subcategories && category.subcategories.length > 0) {
      const subcategoryPaths = extractCategoriesFromTemplate(
        brandName, 
        category.subcategories, 
        currentPath
      );
      result.push(...subcategoryPaths);
    }
  }
  
  return result;
}

// Helper function to merge categories while avoiding duplicates
export function mergeCategoriesUniquely(existingCategories: string[], newCategories: string[]): string[] {
  const merged = [...existingCategories];
  
  for (const newCategory of newCategories) {
    if (!merged.includes(newCategory)) {
      merged.push(newCategory);
    }
  }
  
  return merged;
}

// Helper function to remove brand-specific categories when a brand is deselected
export function removeBrandCategories(allCategories: string[], brandName: string): string[] {
  return allCategories.filter(category => !category.startsWith(`${brandName} >`));
}
