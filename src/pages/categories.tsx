import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, ChevronDown, ChevronRight, Edit, Box, Home, TreePine, Layers, Expand, Minimize2, Trash2 } from "lucide-react";
import { type Category } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AddCategoryModal from "@/components/modals/add-category-modal";
import EditCategoryModal from "@/components/modals/edit-category-modal";

export default function Categories() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandAll, setExpandAll] = useState(false);
  const { toast } = useToast();

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/categories?id=${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    },
  });

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleExpandAll = () => {
    if (expandAll) {
      setExpandedCategories(new Set());
    } else {
      const allCategoryIds = new Set<string>();
      const collectIds = (cats: Category[]) => {
        cats.forEach(cat => {
          // Collect all category IDs that have children
          const hasChildren = cats.some(c => c.parentId === cat.id);
          if (hasChildren) {
            allCategoryIds.add(cat.id);
          }
        });
      };
      if (categories) collectIds(categories);
      setExpandedCategories(allCategoryIds);
    }
    setExpandAll(!expandAll);
  };

  // Build hierarchical structure
  const buildCategoryTree = (allCategories: Category[]) => {
    const categoryMap = new Map<string, Category & { children: Category[] }>();
    
    // Initialize all categories with children array
    allCategories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });
    
    // Build the tree structure
    const rootCategories: (Category & { children: Category[] })[] = [];
    
    allCategories.forEach(cat => {
      const categoryWithChildren = categoryMap.get(cat.id)!;
      
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(categoryWithChildren);
        } else {
          // If parent not found, treat as root (data consistency issue)
          rootCategories.push(categoryWithChildren);
        }
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });
    
    // Sort categories by name at each level
    const sortCategories = (categories: (Category & { children: Category[] })[]) => {
      categories.sort((a, b) => a.name.localeCompare(b.name));
      categories.forEach(cat => {
        if (cat.children.length > 0) {
          sortCategories(cat.children);
        }
      });
    };
    
    sortCategories(rootCategories);
    return rootCategories;
  };

  const getCategoryIcon = (categoryName: string) => {
    const iconMap: Record<string, any> = {
      'concrete': Box,
      'roofing': Home,
      'lumber': TreePine,
      'decking': Layers,
    };
    
    return iconMap[categoryName.toLowerCase()] || Box;
  };

  const getCategoryColor = (categoryName: string) => {
    const colorMap: Record<string, string> = {
      'concrete': 'bg-gray-100',
      'roofing': 'bg-blue-100',
      'lumber': 'bg-yellow-100',
      'decking': 'bg-green-100',
    };
    
    return colorMap[categoryName.toLowerCase()] || 'bg-gray-100';
  };

  const getCategoryIconColor = (categoryName: string) => {
    const colorMap: Record<string, string> = {
      'concrete': 'text-gray-600',
      'roofing': 'text-blue-600',
      'lumber': 'text-yellow-600',
      'decking': 'text-green-600',
    };
    
    return colorMap[categoryName.toLowerCase()] || 'text-gray-600';
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setShowEditModal(true);
  };

  const handleDeleteCategory = (category: Category) => {
    // Prevent deletion while another deletion is pending
    if (deleteCategoryMutation.isPending) {
      return;
    }

    // Check if category has children
    const hasChildren = categories?.some(cat => cat.parentId === category.id);
    
    if (hasChildren) {
      toast({
        title: "Cannot Delete",
        description: "This category has subcategories. Please delete all subcategories first.",
        variant: "destructive",
      });
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"? This action cannot be undone.`
    );
    
    if (confirmed) {
      deleteCategoryMutation.mutate(category.id);
    }
  };

  // Recursive component to render category tree
  const CategoryTreeNode = ({ 
    category, 
    level = 0 
  }: { 
    category: Category & { children: Category[] }, 
    level?: number 
  }) => {
    const isExpanded = expandedCategories.has(category.id);
    const Icon = getCategoryIcon(category.name);
    const hasChildren = category.children.length > 0;
    const indentSize = level * 24; // 24px per level
    
    return (
      <div key={category.id}>
        <div 
          className={`flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-l-4 ${
            level === 0 ? 'border-blue-500 bg-blue-50' : 
            level === 1 ? 'border-green-400 bg-green-50' : 
            'border-yellow-400 bg-yellow-50'
          }`}
          style={{ marginLeft: `${indentSize}px` }}
          onClick={() => hasChildren && toggleCategory(category.id)}
        >
          <div className="flex items-center space-x-3">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )
            ) : (
              <div className="w-4 h-4" /> // Spacer for alignment
            )}
            <div className={`w-6 h-6 ${getCategoryColor(category.name)} rounded flex items-center justify-center`}>
              <Icon className={`h-3 w-3 ${getCategoryIconColor(category.name)}`} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <p className="font-medium text-gray-900 text-sm">{category.name}</p>
                <span className="text-xs text-gray-400">Level {category.level}</span>
              </div>
              <div className="flex items-center space-x-2">
                {hasChildren && (
                  <p className="text-xs text-gray-500">{category.children.length} subcategories</p>
                )}
                {category.path && (
                  <span className="text-xs text-gray-400">Path: {category.path}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={parseInt(category.vendorCount || "0") > 0 ? "default" : "secondary"}
              className={`text-xs ${parseInt(category.vendorCount || "0") > 0 ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-500"}`}
            >
              {category.vendorCount || "0"}
            </Badge>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-blue-600 hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                handleEditCategory(category);
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-red-600 hover:bg-red-50"
              disabled={deleteCategoryMutation.isPending}
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCategory(category);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div>
            {category.children.map((child) => (
              <CategoryTreeNode key={child.id} category={child as Category & { children: Category[] }} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <div className="flex-1 p-6">Loading...</div>;
  }

  const categoryTree = categories ? buildCategoryTree(categories) : [];
  const topCategories = categories?.filter(cat => parseInt(cat.vendorCount || "0") > 0).slice(0, 4) || [];

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">Organize construction material categories</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Button variant="outline" className="font-medium">
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 font-medium"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Category Tree */}
      <Card className="construction-shadow">
        <CardContent className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Category Structure</h3>
              <p className="text-gray-600">Hierarchical organization of construction materials and subcategories (up to 3+ levels deep)</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleExpandAll}
              className="flex items-center space-x-2"
            >
              {expandAll ? <Minimize2 className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
              <span>{expandAll ? "Collapse All" : "Expand All"}</span>
            </Button>
          </div>

          {/* Category Tree Structure */}
          <div className="space-y-1 border border-gray-200 rounded-lg bg-white">
            {categoryTree.map((category) => (
              <CategoryTreeNode key={category.id} category={category as Category & { children: Category[] }} level={0} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="construction-shadow">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
            <div className="h-48 bg-gradient-to-br from-blue-50 to-orange-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <div className="w-8 h-8 bg-gray-400 rounded-full"></div>
                </div>
                <p className="text-gray-500 font-medium">Distribution Chart</p>
                <p className="text-sm text-gray-400">Vendor distribution across categories</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="construction-shadow">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
            <div className="space-y-4">
              {topCategories.map((category) => {
                const Icon = getCategoryIcon(category.name);
                const percentage = (parseInt(category.vendorCount || "0") / 8) * 100; // 8 is total vendors
                
                return (
                  <div key={category.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 ${getCategoryColor(category.name)} rounded-lg flex items-center justify-center`}>
                        <Icon className={`h-4 w-4 ${getCategoryIconColor(category.name)}`} />
                      </div>
                      <span className="font-medium text-gray-900">{category.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-blue-600 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-600">{category.vendorCount || "0"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <AddCategoryModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
      />

      <EditCategoryModal 
        category={selectedCategory}
        isOpen={showEditModal} 
        onClose={() => {
          setShowEditModal(false);
          setSelectedCategory(null);
        }} 
      />
    </div>
  );
}
