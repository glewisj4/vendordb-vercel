import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Lightbulb, Package, CheckCircle2 } from "lucide-react";

const addBrandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  description: z.string().optional(),
  isGeneric: z.boolean().default(false),
  industry: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  templateId: z.string().optional(),
});

type AddBrandForm = z.infer<typeof addBrandSchema>;

interface BrandTemplate {
  id: string;
  name: string;
  industry: string;
  description?: string;
  version: string;
  isDefault: boolean;
}

interface AddBrandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddBrandModal({ open, onOpenChange }: AddBrandModalProps) {
  const [suggestedTemplates, setSuggestedTemplates] = useState<string[]>([]);
  const [autoSelectionDone, setAutoSelectionDone] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AddBrandForm>({
    resolver: zodResolver(addBrandSchema),
    defaultValues: {
      name: "",
      description: "",
      isGeneric: false,
      industry: "",
      website: "",
      templateId: "",
    },
  });

  const { data: templates = [] } = useQuery<BrandTemplate[]>({
    queryKey: ["/api/brand-templates"],
  });

  const createBrandMutation = useMutation({
    mutationFn: async (data: AddBrandForm) => {
      const response = await apiRequest("POST", "/api/brands", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      toast({
        title: "Success",
        description: "Brand created successfully!",
      });
      onOpenChange(false);
      form.reset();
      setSuggestedTemplates([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create brand",
        variant: "destructive",
      });
    },
  });

  // Template suggestion logic based on brand name
  const suggestTemplatesForBrand = (brandName: string): string[] => {
    if (!brandName) return [];
    
    const name = brandName.toLowerCase();
    const suggestions: string[] = [];

    // Roofing brands
    if (name.includes('gaf') || name.includes('owens') || name.includes('certainteed') || 
        name.includes('iko') || name.includes('tamko') || name.includes('atlas')) {
      suggestions.push('roofing');
    }

    // Electrical brands
    if (name.includes('square d') || name.includes('general electric') || name.includes('ge') ||
        name.includes('eaton') || name.includes('siemens') || name.includes('cutler')) {
      suggestions.push('electrical');
    }

    // Wire & Cable brands
    if (name.includes('southwire') || name.includes('cerro') || name.includes('republic') ||
        name.includes('encore') || name.includes('wirenut')) {
      suggestions.push('wire_cable');
    }

    // Decking brands
    if (name.includes('trex') || name.includes('timbertech') || name.includes('fiberon') ||
        name.includes('azek') || name.includes('moistureshield')) {
      suggestions.push('decking');
    }

    // Concrete brands
    if (name.includes('quikrete') || name.includes('sakrete') || name.includes('quickcrete') ||
        name.includes('concrete') || name.includes('cement')) {
      suggestions.push('concrete');
    }

    return suggestions;
  };

  // Watch brand name and suggest templates
  const brandName = form.watch("name");
  useEffect(() => {
    if (brandName) {
      const suggestions = suggestTemplatesForBrand(brandName);
      setSuggestedTemplates(suggestions);
    } else {
      setSuggestedTemplates([]);
    }
  }, [brandName]);

  // Safe auto-selection effect
  useEffect(() => {
    if (suggestedTemplates.length === 1 && !autoSelectionDone && templates.length > 0) {
      const suggestion = suggestedTemplates[0];
      form.setValue("industry", suggestion);
      
      // Find default template for this industry
      const defaultTemplate = templates.find(t => t.industry === suggestion && t.isDefault);
      if (defaultTemplate) {
        form.setValue("templateId", defaultTemplate.id);
      }
      
      setAutoSelectionDone(true);
    }
  }, [suggestedTemplates, autoSelectionDone, templates, form]);

  // Reset auto-selection when modal opens/closes
  useEffect(() => {
    if (!open) {
      setAutoSelectionDone(false);
      setSuggestedTemplates([]);
    }
  }, [open]);

  const onSubmit = (data: AddBrandForm) => {
    // Convert "none" templateId to undefined for proper backend handling
    const submitData = {
      ...data,
      templateId: data.templateId === "none" ? undefined : data.templateId
    };
    createBrandMutation.mutate(submitData);
  };

  const selectedTemplate = templates.find(t => t.id === form.watch("templateId"));
  const industry = form.watch("industry");
  const isGeneric = form.watch("isGeneric");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-add-brand">
        <DialogHeader>
          <DialogTitle>Add New Brand</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., GAF, Square D, Trex"
                        {...field}
                        data-testid="input-brand-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the brand..."
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://www.brandwebsite.com"
                        {...field}
                        data-testid="input-website"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isGeneric"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Generic Brand</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Check if this represents unbranded/generic products
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-generic"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Template Suggestions */}
            {suggestedTemplates.length > 0 && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-900">Template Suggestions</h4>
                      <p className="text-sm text-blue-700">
                        Based on the brand name, we suggest these industry templates:
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {suggestedTemplates.map((suggestion) => (
                          <Badge key={suggestion} variant="secondary" className="capitalize">
                            {suggestion.replace('_', ' & ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Industry & Template Selection */}
            {!isGeneric && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Industry & Template</h3>
                
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger data-testid="select-industry">
                            <SelectValue placeholder="Select industry type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="roofing">Roofing</SelectItem>
                            <SelectItem value="electrical">Electrical</SelectItem>
                            <SelectItem value="wire_cable">Wire & Cable</SelectItem>
                            <SelectItem value="decking">Decking</SelectItem>
                            <SelectItem value="concrete">Concrete</SelectItem>
                            <SelectItem value="plumbing">Plumbing</SelectItem>
                            <SelectItem value="lumber">Lumber</SelectItem>
                            <SelectItem value="hardware">Hardware</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {industry && (
                  <FormField
                    control={form.control}
                    name="templateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category Template</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger data-testid="select-template">
                              <SelectValue placeholder="Choose a template or none" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No template (manual setup)</SelectItem>
                              {templates
                                .filter(t => t.industry === industry)
                                .map((template) => (
                                  <SelectItem key={template.id} value={template.id}>
                                    <div className="flex items-center gap-2">
                                      <Package className="h-4 w-4" />
                                      {template.name} (v{template.version})
                                      {template.isDefault && (
                                        <Badge variant="outline" className="text-xs">Default</Badge>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {selectedTemplate && (
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="space-y-2">
                          <h4 className="font-medium text-green-900">Template Selected</h4>
                          <p className="text-sm text-green-700">
                            {selectedTemplate.description}
                          </p>
                          <p className="text-xs text-green-600">
                            A complete category hierarchy will be automatically created for this brand.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createBrandMutation.isPending}
                data-testid="button-submit"
              >
                {createBrandMutation.isPending ? "Creating..." : "Create Brand"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}