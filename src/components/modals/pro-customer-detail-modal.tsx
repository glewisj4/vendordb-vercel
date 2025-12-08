import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Edit, Save, X, Phone, Mail, User, Hash, Briefcase, Calendar, FileText, Download, Copy, MessageCircle, ExternalLink, Clock, Star, CreditCard, Check, Users, Home, Plus, Trash2 } from "lucide-react";
import { insertProCustomerSchema, type ProCustomer, type InsertProCustomer, type PhoneContact, type EmailContact } from "@shared/schema";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTrades, useCreateTrade } from "@/hooks/use-trades";
import { useBusinessTypes, useCreateBusinessType } from "@/hooks/use-business-types";
import { useProContacts, useCreateProContact, useUpdateProContact, useDeleteProContact } from "@/hooks/use-pro-contacts";
import { useManagedProperties, useCreateManagedProperty, useUpdateManagedProperty, useDeleteManagedProperty } from "@/hooks/use-managed-properties";
import { PhoneInput } from "@/components/ui/phone-input";
import { MultiPhoneField, MultiEmailField } from "@/components/ui/multi-contact-field";

interface ProCustomerDetailModalProps {
  customer: ProCustomer | null;
  isOpen: boolean;
  onClose: () => void;
  startInEditMode?: boolean;
}

export default function ProCustomerDetailModal({ customer, isOpen, onClose, startInEditMode = false }: ProCustomerDetailModalProps) {
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [lastActivity, setLastActivity] = useState<string | null>(null);
  const [showCustomTrade, setShowCustomTrade] = useState(false);
  const [customTrade, setCustomTrade] = useState("");
  const [showCustomBusinessType, setShowCustomBusinessType] = useState(false);
  const [customBusinessType, setCustomBusinessType] = useState("");
  const { toast } = useToast();
  const { data: trades = [], isLoading: tradesLoading } = useTrades();
  const createTradeMutation = useCreateTrade();
  const { data: businessTypes = [], isLoading: businessTypesLoading } = useBusinessTypes();
  const createBusinessTypeMutation = useCreateBusinessType();

  // Quick action handlers
  const handleCall = (phoneNumber: string) => {
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, '_self');
      // Track this activity
      setLastActivity(`Called ${phoneNumber} at ${new Date().toLocaleString()}`);
      toast({
        title: "Call Initiated",
        description: `Calling ${phoneNumber}`,
      });
    }
  };

  const handleEmail = (email: string) => {
    if (email) {
      window.open(`mailto:${email}?subject=Lowe's Pro Customer Follow-up`, '_blank');
      setLastActivity(`Emailed ${email} at ${new Date().toLocaleString()}`);
      toast({
        title: "Email Opened",
        description: `Opening email to ${email}`,
      });
    }
  };

  const handleCopyInfo = () => {
    const customerInfo = `
Business: ${customer?.businessName || 'N/A'}
Contact: ${customer?.primaryContactName || 'N/A'}
Phone: ${customer?.primaryContactMobile || 'N/A'}
Email: ${customer?.primaryContactEmail || 'N/A'}
Pro Account: ${customer?.lowesProAccountNumber || 'N/A'}
Trade: ${customer?.primaryTrade || 'N/A'}
    `.trim();
    
    navigator.clipboard.writeText(customerInfo).then(() => {
      toast({
        title: "Copied to Clipboard",
        description: "Customer information copied successfully",
      });
    });
  };

  const handleExportCustomer = () => {
    if (!customer) return;
    
    const exportData = {
      businessName: customer.businessName,
      primaryContactName: customer.primaryContactName,
      primaryContactRole: customer.primaryContactRole,
      primaryContactMobile: customer.primaryContactMobile,
      primaryContactEmail: customer.primaryContactEmail,
      lowesProAccountNumber: customer.lowesProAccountNumber,
      trades: customer.trades,
      typicalProjectType: customer.typicalProjectType,
      currentMajorProjects: customer.currentMajorProjects,
      notes: customer.notes,
      exportedAt: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${customer.businessName?.replace(/[^a-z0-9]/gi, '_') || 'customer'}_export.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Customer data exported successfully",
    });
  };

  const form = useForm<InsertProCustomer>({
    resolver: zodResolver(
      insertProCustomerSchema.extend({
        trades: z.array(z.string()).min(1, "Please select at least one trade"),
      })
    ),
    defaultValues: {
      businessName: customer?.businessName || "",
      businessTypes: customer?.businessTypes || [],
      primaryContactName: customer?.primaryContactName || "",
      primaryContactRole: customer?.primaryContactRole || "",
      primaryContactMobile: customer?.primaryContactMobile || "",
      primaryContactEmail: customer?.primaryContactEmail || "",
      lowesProAccountNumber: customer?.lowesProAccountNumber || "",
      taxExemptNumber: customer?.taxExemptNumber || "",
      preferredContactMethod: customer?.preferredContactMethod || "",
      paymentPreference: customer?.paymentPreference || "",
      mvpRewardsProgram: customer?.mvpRewardsProgram || false,
      trades: customer?.trades || [],
      secondarySpecialties: customer?.secondarySpecialties || [],
      typicalProjectType: customer?.typicalProjectType || "",
      currentMajorProjects: customer?.currentMajorProjects || "",
      powerToolPlatform: customer?.powerToolPlatform || "",
      paintBrand: customer?.paintBrand || "",
      paintSheen: customer?.paintSheen || "",
      goToColors: customer?.goToColors || [],
      lumberGrade: customer?.lumberGrade || "",
      subflooring: customer?.subflooring || "",
      drywall: customer?.drywall || "",
      insulation: customer?.insulation || "",
      screws: customer?.screws || "",
      caulkSealant: customer?.caulkSealant || "",
      adhesive: customer?.adhesive || "",
      sawBlades: customer?.sawBlades || "",
      plumbingPipe: customer?.plumbingPipe || "",
      plumbingFittings: customer?.plumbingFittings || "",
      fixtureBrands: customer?.fixtureBrands || "",
      breakerBoxBrand: customer?.breakerBoxBrand || "",
      deviceBrands: customer?.deviceBrands || "",
      applianceBrands: customer?.applianceBrands || "",
      preferredApplianceModels: customer?.preferredApplianceModels || "",
      goToItems: customer?.goToItems || [],
      typicalOrderMethod: customer?.typicalOrderMethod || "",
      fulfillmentPreference: customer?.fulfillmentPreference || "",
      frequentDeliveryAddresses: customer?.frequentDeliveryAddresses || [],
      purchasingInfluencers: customer?.purchasingInfluencers || "",
      orderFrequency: customer?.orderFrequency || "",
      painPoints: customer?.painPoints || "",
      theUsual: customer?.theUsual || "",
      communicationStyle: customer?.communicationStyle || "",
      lastMajorQuoteIssue: customer?.lastMajorQuoteIssue || "",
      notes: customer?.notes || "",
      phones: [],
      emails: [],
    }
  });

  // Reset form when customer changes and set edit mode
  useEffect(() => {
    if (customer) {
      form.reset({
        businessName: customer.businessName,
        businessTypes: customer.businessTypes || [],
        primaryContactName: customer.primaryContactName || "",
        primaryContactRole: customer.primaryContactRole || "",
        primaryContactMobile: customer.primaryContactMobile || "",
        primaryContactEmail: customer.primaryContactEmail || "",
        lowesProAccountNumber: customer.lowesProAccountNumber || "",
        taxExemptNumber: customer.taxExemptNumber || "",
        preferredContactMethod: customer.preferredContactMethod || "",
        paymentPreference: customer.paymentPreference || "",
        mvpRewardsProgram: customer.mvpRewardsProgram || false,
        trades: customer.trades || [],
        secondarySpecialties: customer.secondarySpecialties || [],
        typicalProjectType: customer.typicalProjectType || "",
        currentMajorProjects: customer.currentMajorProjects || "",
        powerToolPlatform: customer.powerToolPlatform || "",
        paintBrand: customer.paintBrand || "",
        paintSheen: customer.paintSheen || "",
        goToColors: customer.goToColors || [],
        lumberGrade: customer.lumberGrade || "",
        subflooring: customer.subflooring || "",
        drywall: customer.drywall || "",
        insulation: customer.insulation || "",
        screws: customer.screws || "",
        caulkSealant: customer.caulkSealant || "",
        adhesive: customer.adhesive || "",
        sawBlades: customer.sawBlades || "",
        plumbingPipe: customer.plumbingPipe || "",
        plumbingFittings: customer.plumbingFittings || "",
        fixtureBrands: customer.fixtureBrands || "",
        breakerBoxBrand: customer.breakerBoxBrand || "",
        deviceBrands: customer.deviceBrands || "",
        goToItems: customer.goToItems || [],
        typicalOrderMethod: customer.typicalOrderMethod || "",
        fulfillmentPreference: customer.fulfillmentPreference || "",
        frequentDeliveryAddresses: customer.frequentDeliveryAddresses || [],
        purchasingInfluencers: customer.purchasingInfluencers || "",
        orderFrequency: customer.orderFrequency || "",
        painPoints: customer.painPoints || "",
        theUsual: customer.theUsual || "",
        communicationStyle: customer.communicationStyle || "",
        lastMajorQuoteIssue: customer.lastMajorQuoteIssue || "",
        notes: customer.notes || "",
        phones: customer.phones || [],
        emails: customer.emails || [],
      });
    }
    setIsEditing(startInEditMode);
  }, [customer, form, startInEditMode]);

  const updateCustomerMutation = useMutation({
    mutationFn: async (data: InsertProCustomer) => {
      if (!customer) return;
      const response = await apiRequest("PUT", `/api/pro-customers/${customer.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pro-customers"] });
      toast({
        title: "Success",
        description: "Pro customer updated successfully",
      });
      setIsEditing(false);
      // Close the modal after successful update
      setTimeout(() => {
        handleClose();
      }, 500); // Small delay to show success message
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update pro customer",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: InsertProCustomer) => {
    // Handle custom trade creation if needed
    let finalTrades = [...data.trades];
    
    if (showCustomTrade && customTrade.trim()) {
      try {
        // Create the new trade
        const newTrade = await createTradeMutation.mutateAsync({
          name: customTrade.toLowerCase().replace(/\s+/g, '-'),
          displayName: customTrade.trim(),
          isDefault: "false"
        });
        // Replace "other" with the new custom trade
        finalTrades = finalTrades.map(trade => 
          trade === "other" ? newTrade.name : trade
        );
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create custom trade",
          variant: "destructive",
        });
        return;
      }
    }

    // Handle custom business type creation if needed
    let finalBusinessTypes = [...data.businessTypes];
    
    if (showCustomBusinessType && customBusinessType.trim()) {
      try {
        // Create the new business type
        const newBusinessType = await createBusinessTypeMutation.mutateAsync({
          name: customBusinessType.trim(),
          description: null
        });
        // Replace "other" with the new custom business type
        finalBusinessTypes = finalBusinessTypes.map(type => 
          type === "other" ? newBusinessType.name : type
        );
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create custom business type",
          variant: "destructive",
        });
        return;
      }
    }

    // Include final trades and business types
    const finalData = {
      ...data,
      trades: finalTrades,
      businessTypes: finalBusinessTypes,
    };
    updateCustomerMutation.mutate(finalData);
  };

  const handleClose = () => {
    setIsEditing(false);
    form.reset();
    onClose();
  };

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Building className="text-green-600 h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  {customer.businessName}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  {customer.trades?.join(", ") || "Pro Customer"} - Account Details
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center space-x-2"
              >
                {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                <span>{isEditing ? "Cancel" : "Edit"}</span>
              </Button>
            </div>
          </div>
          
          {/* Quick Actions Bar */}
          {!isEditing && (
            <div className="flex flex-wrap gap-2 mt-4 p-3 bg-gray-50 rounded-lg">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCall(customer.primaryContactMobile || '')}
                disabled={!customer.primaryContactMobile}
                className="flex items-center space-x-1"
                data-testid="button-call-customer"
              >
                <Phone className="h-4 w-4" />
                <span>Call</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEmail(customer.primaryContactEmail || '')}
                disabled={!customer.primaryContactEmail}
                className="flex items-center space-x-1"
                data-testid="button-email-customer"
              >
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyInfo}
                className="flex items-center space-x-1"
                data-testid="button-copy-info"
              >
                <Copy className="h-4 w-4" />
                <span>Copy Info</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCustomer}
                className="flex items-center space-x-1"
                data-testid="button-export-customer"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
              
              {customer.lowesProAccountNumber && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Placeholder for Pro account lookup
                    toast({
                      title: "Pro Account",
                      description: `Account: ${customer.lowesProAccountNumber}`,
                    });
                  }}
                  className="flex items-center space-x-1"
                  data-testid="button-pro-account"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Pro Account</span>
                </Button>
              )}
            </div>
          )}
          
          {/* Last Activity Tracker */}
          {lastActivity && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 text-sm text-blue-800">
                <Clock className="h-4 w-4" />
                <span>Last Activity: {lastActivity}</span>
              </div>
            </div>
          )}
        </DialogHeader>

        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Edit form fields - simplified version for space */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter business name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lowesProAccountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pro Account Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Account number" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="primaryContactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Contact name" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lowesProAccountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pro Account Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Account number" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                <FormField
                  control={form.control}
                  name="primaryContactMobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile (Backup)</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Mobile number" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="primaryContactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Backup)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Email" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name="trades"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trades * (Select all that apply)</FormLabel>
                      <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                        {tradesLoading ? (
                          <div className="text-sm text-gray-500">Loading trades...</div>
                        ) : (
                          <>
                            {trades.map((trade) => (
                              <div key={trade.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={trade.id}
                                  checked={field.value?.includes(trade.name) || false}
                                  onChange={(e) => {
                                    const currentTrades = field.value || [];
                                    const updatedTrades = e.target.checked
                                      ? [...currentTrades, trade.name]
                                      : currentTrades.filter(t => t !== trade.name);
                                    field.onChange(updatedTrades);
                                  }}
                                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                />
                                <label 
                                  htmlFor={trade.id}
                                  className="text-sm font-medium text-gray-700 cursor-pointer"
                                >
                                  {trade.displayName}
                                </label>
                              </div>
                            ))}
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="custom-trade"
                                checked={field.value?.includes("other") || false}
                                onChange={(e) => {
                                  const currentTrades = field.value || [];
                                  const updatedTrades = e.target.checked
                                    ? [...currentTrades, "other"]
                                    : currentTrades.filter(t => t !== "other");
                                  field.onChange(updatedTrades);
                                  setShowCustomTrade(e.target.checked);
                                }}
                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                              />
                              <label 
                                htmlFor="custom-trade"
                                className="text-sm font-medium text-gray-700 cursor-pointer"
                              >
                                Other (Enter Custom Trade)
                              </label>
                            </div>
                          </>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {showCustomTrade && (
                  <div>
                    <FormItem>
                      <FormLabel>Custom Trade</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter custom trade (e.g., Tile Installer, Kitchen Remodeler, etc.)"
                          value={customTrade}
                          onChange={(e) => setCustomTrade(e.target.value)}
                        />
                      </FormControl>
                    </FormItem>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="businessTypes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Types (Select all that apply)</FormLabel>
                      <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                        {businessTypesLoading ? (
                          <div className="text-sm text-gray-500">Loading business types...</div>
                        ) : (
                          <>
                            {businessTypes.map((businessType) => (
                              <div key={businessType.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={businessType.id}
                                  checked={field.value?.includes(businessType.name) || false}
                                  onChange={(e) => {
                                    const currentTypes = field.value || [];
                                    const updatedTypes = e.target.checked
                                      ? [...currentTypes, businessType.name]
                                      : currentTypes.filter(t => t !== businessType.name);
                                    field.onChange(updatedTypes);
                                  }}
                                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                />
                                <label 
                                  htmlFor={businessType.id}
                                  className="text-sm font-medium text-gray-700 cursor-pointer"
                                >
                                  {businessType.name}
                                </label>
                              </div>
                            ))}
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="custom-business-type"
                                checked={field.value?.includes("other") || false}
                                onChange={(e) => {
                                  const currentTypes = field.value || [];
                                  const updatedTypes = e.target.checked
                                    ? [...currentTypes, "other"]
                                    : currentTypes.filter(t => t !== "other");
                                  field.onChange(updatedTypes);
                                  setShowCustomBusinessType(e.target.checked);
                                }}
                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                              />
                              <label 
                                htmlFor="custom-business-type"
                                className="text-sm font-medium text-gray-700 cursor-pointer"
                              >
                                Other (Enter Custom Business Type)
                              </label>
                            </div>
                          </>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {showCustomBusinessType && (
                  <div>
                    <FormItem>
                      <FormLabel>Custom Business Type</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter custom business type (e.g., Sub Contractor, Property Manager, etc.)"
                          value={customBusinessType}
                          onChange={(e) => setCustomBusinessType(e.target.value)}
                        />
                      </FormControl>
                    </FormItem>
                  </div>
                )}
              </div>

              {/* Account Preferences */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900">Account Preferences</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="paymentPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Preference</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value || ""} data-testid="select-payment-preference-edit">
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lowes-pro-rewards">Lowe's Pro Rewards Credit Card</SelectItem>
                              <SelectItem value="lowes-commercial-account">Lowe's Commercial Account</SelectItem>
                              <SelectItem value="other-business-credit">Other Business Credit Card</SelectItem>
                              <SelectItem value="non-business-credit">Non-Business Credit</SelectItem>
                              <SelectItem value="cash">Cash</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="mvpRewardsProgram"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-white">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">MVP Rewards Program</FormLabel>
                          <div className="text-sm text-gray-500">
                            Customer enrolled in MVP Rewards
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                            data-testid="switch-mvp-rewards-edit"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="typicalProjectType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Type</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="residential">Residential</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                            <SelectItem value="new-construction">New Construction</SelectItem>
                            <SelectItem value="repair-remodel">Repair/Remodel</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tool & Paint Preferences */}
              <h4 className="text-md font-semibold text-gray-900 mt-6 mb-4">Tool & Paint Preferences</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="powerToolPlatform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Power Tool Platform</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dewalt">DeWalt</SelectItem>
                            <SelectItem value="milwaukee">Milwaukee</SelectItem>
                            <SelectItem value="makita">Makita</SelectItem>
                            <SelectItem value="ryobi">Ryobi</SelectItem>
                            <SelectItem value="bosch">Bosch</SelectItem>
                            <SelectItem value="ridgid">Ridgid</SelectItem>
                            <SelectItem value="craftsman">Craftsman</SelectItem>
                            <SelectItem value="kobalt">Kobalt</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paintBrand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paint Brand</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sherwin-williams">Sherwin-Williams</SelectItem>
                            <SelectItem value="valspar">Valspar</SelectItem>
                            <SelectItem value="hgtv-home">HGTV HOME by Sherwin-Williams</SelectItem>
                            <SelectItem value="olympic">Olympic</SelectItem>
                            <SelectItem value="cabot">Cabot Stain</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paintSheen"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paint Sheen</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sheen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="flat">Flat/Matte</SelectItem>
                            <SelectItem value="eggshell">Eggshell</SelectItem>
                            <SelectItem value="satin">Satin</SelectItem>
                            <SelectItem value="semi-gloss">Semi-Gloss</SelectItem>
                            <SelectItem value="high-gloss">High-Gloss</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Building Materials */}
              <h4 className="text-md font-semibold text-gray-900 mt-6 mb-4">Building Materials</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FormField
                  control={form.control}
                  name="lumberGrade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lumber Grade</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spf-2x4-premium">SPF 2x4 Premium</SelectItem>
                            <SelectItem value="spf-2x4-stud">SPF 2x4 Stud Grade</SelectItem>
                            <SelectItem value="pressure-treated">Pressure Treated</SelectItem>
                            <SelectItem value="cedar">Cedar</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="subflooring"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subflooring</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="advantech">AdvanTech</SelectItem>
                            <SelectItem value="plywood">Standard Plywood</SelectItem>
                            <SelectItem value="osb">OSB</SelectItem>
                            <SelectItem value="zip-system">ZIP System</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="drywall"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Drywall</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="usg-sheetrock">USG Sheetrock</SelectItem>
                            <SelectItem value="gold-bond">Gold Bond</SelectItem>
                            <SelectItem value="certainteed">CertainTeed</SelectItem>
                            <SelectItem value="national-gypsum">National Gypsum</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="insulation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insulation</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owens-corning">Owens Corning Pink</SelectItem>
                            <SelectItem value="knauf">Knauf</SelectItem>
                            <SelectItem value="rockwool">Rockwool</SelectItem>
                            <SelectItem value="johns-manville">Johns Manville</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Fasteners & Consumables */}
              <h4 className="text-md font-semibold text-gray-900 mt-6 mb-4">Fasteners & Consumables</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FormField
                  control={form.control}
                  name="screws"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Screws</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spax">SPAX</SelectItem>
                            <SelectItem value="grk">GRK</SelectItem>
                            <SelectItem value="deckmate">DeckMate</SelectItem>
                            <SelectItem value="starborn">Starborn</SelectItem>
                            <SelectItem value="simpson">Simpson Strong-Tie</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="caulkSealant"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Caulk/Sealant</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dap-alex-plus">DAP Alex Plus</SelectItem>
                            <SelectItem value="dynaflex-230">Dynaflex 230</SelectItem>
                            <SelectItem value="ge-silicone">GE Silicone</SelectItem>
                            <SelectItem value="red-devil">Red Devil</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="adhesive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adhesive</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="loctite-pl-premium">Loctite PL Premium</SelectItem>
                            <SelectItem value="liquid-nails">Liquid Nails</SelectItem>
                            <SelectItem value="gorilla-glue">Gorilla Glue</SelectItem>
                            <SelectItem value="3m-5200">3M 5200</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sawBlades"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Saw Blades</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="diablo">Diablo</SelectItem>
                            <SelectItem value="dewalt">DeWalt</SelectItem>
                            <SelectItem value="lenox">Lenox</SelectItem>
                            <SelectItem value="irwin">Irwin</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Plumbing & Electrical */}
              <h4 className="text-md font-semibold text-gray-900 mt-6 mb-4">Plumbing & Electrical</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="plumbingPipe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plumbing Pipe</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pex-a">PEX-A (Expansion)</SelectItem>
                            <SelectItem value="pex-b">PEX-B (Crimp)</SelectItem>
                            <SelectItem value="copper">Copper</SelectItem>
                            <SelectItem value="cpvc">CPVC</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="plumbingFittings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plumbing Fittings</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sharkbite">SharkBite Push-to-Connect</SelectItem>
                            <SelectItem value="viega-press">Viega Press</SelectItem>
                            <SelectItem value="crimp-solder">Standard Crimp/Solder</SelectItem>
                            <SelectItem value="propress">ProPress</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="fixtureBrands"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fixture Brands</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="moen">Moen</SelectItem>
                            <SelectItem value="delta">Delta</SelectItem>
                            <SelectItem value="kohler">Kohler</SelectItem>
                            <SelectItem value="project-source">Project Source</SelectItem>
                            <SelectItem value="pfister">Pfister</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="breakerBoxBrand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Breaker Box Brand</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="square-d">Square D</SelectItem>
                            <SelectItem value="eaton">Eaton</SelectItem>
                            <SelectItem value="siemens">Siemens</SelectItem>
                            <SelectItem value="ge">General Electric</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="deviceBrands"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device Brands</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="leviton">Leviton</SelectItem>
                            <SelectItem value="legrand">Legrand</SelectItem>
                            <SelectItem value="lutron">Lutron</SelectItem>
                            <SelectItem value="pass-seymour">Pass & Seymour</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Appliance Preferences */}
              <h4 className="text-md font-semibold text-gray-900 mt-6 mb-4">Appliance Preferences</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="applianceBrands"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Appliance Brands</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="whirlpool">Whirlpool</SelectItem>
                            <SelectItem value="ge">GE</SelectItem>
                            <SelectItem value="samsung">Samsung</SelectItem>
                            <SelectItem value="lg">LG</SelectItem>
                            <SelectItem value="frigidaire">Frigidaire</SelectItem>
                            <SelectItem value="maytag">Maytag</SelectItem>
                            <SelectItem value="kitchenaid">KitchenAid</SelectItem>
                            <SelectItem value="bosch">Bosch</SelectItem>
                            <SelectItem value="electrolux">Electrolux</SelectItem>
                            <SelectItem value="kenmore">Kenmore</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="preferredApplianceModels"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Models</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., GE Profile series, Samsung French Door RF23..."
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional notes..."
                        className="min-h-[100px]"
                        {...field} 
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={updateCustomerMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updateCustomerMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="contacts" data-testid="tab-contacts">
                <Users className="h-4 w-4 mr-2" />
                Contacts
              </TabsTrigger>
              {customer.trades?.includes("property-manager") && (
                <TabsTrigger value="properties" data-testid="tab-properties">
                  <Home className="h-4 w-4 mr-2" />
                  Properties
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Hash className="text-gray-600 h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Pro Account Number</p>
                    <p className="text-sm text-gray-600">{customer.lowesProAccountNumber || "Not provided"}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <User className="text-gray-600 h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Primary Contact</p>
                    <p className="text-sm text-gray-600">
                      {customer.primaryContactName || "Not provided"}
                      {customer.primaryContactRole && ` - ${customer.primaryContactRole}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Phone className="text-gray-600 h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Mobile</p>
                      <p className="text-sm text-gray-600">{customer.primaryContactMobile || "Not provided"}</p>
                    </div>
                  </div>
                  {customer.primaryContactMobile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCall(customer.primaryContactMobile!)}
                      className="text-blue-600 hover:text-blue-800"
                      data-testid="button-call-mobile"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Mail className="text-gray-600 h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600">{customer.primaryContactEmail || "Not provided"}</p>
                    </div>
                  </div>
                  {customer.primaryContactEmail && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEmail(customer.primaryContactEmail!)}
                      className="text-blue-600 hover:text-blue-800"
                      data-testid="button-email-contact"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Account Preferences */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Account Preferences</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="text-gray-600 h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Payment Preference</p>
                      <p className="text-sm text-gray-600" data-testid="text-payment-preference">
                        {customer.paymentPreference 
                          ? customer.paymentPreference === "lowes-pro-rewards" ? "Lowe's Pro Rewards Credit Card"
                            : customer.paymentPreference === "lowes-commercial-account" ? "Lowe's Commercial Account"
                            : customer.paymentPreference === "other-business-credit" ? "Other Business Credit Card"
                            : customer.paymentPreference === "non-business-credit" ? "Non-Business Credit"
                            : customer.paymentPreference === "cash" ? "Cash"
                            : customer.paymentPreference
                          : "Not specified"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Star className={`h-4 w-4 ${customer.mvpRewardsProgram ? "text-yellow-600 fill-yellow-600" : "text-gray-600"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">MVP Rewards Program</p>
                      <div className="flex items-center space-x-2">
                        {customer.mvpRewardsProgram ? (
                          <Badge variant="default" className="bg-green-600 text-white" data-testid="badge-mvp-enrolled">
                            <Check className="h-3 w-3 mr-1" />
                            Enrolled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600" data-testid="badge-mvp-not-enrolled">
                            Not Enrolled
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Trade & Project Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trade & Project Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="text-gray-600 h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Trades</p>
                    <div className="mt-1">
                      {customer.trades && customer.trades.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {customer.trades.map((trade, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {trade}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Not specified</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Building className="text-gray-600 h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Business Types</p>
                    <div className="mt-1">
                      {customer.businessTypes && customer.businessTypes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {customer.businessTypes.map((type, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Not specified</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Building className="text-gray-600 h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Project Type</p>
                    <p className="text-sm text-gray-600">{customer.typicalProjectType || "Not specified"}</p>
                  </div>
                </div>
              </div>

              {customer.currentMajorProjects && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Current Major Projects</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {customer.currentMajorProjects}
                  </p>
                </div>
              )}
            </div>

            <Separator />
            
            {/* Brand & Product Preferences */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Brand & Product Preferences</h3>
              
              {/* Power Tools & Paint */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {customer.powerToolPlatform && (
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-orange-900">Power Tool Platform</p>
                    <p className="text-sm text-orange-600">{customer.powerToolPlatform}</p>
                  </div>
                )}
                
                {customer.paintBrand && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Paint Brand</p>
                    <p className="text-sm text-blue-600">{customer.paintBrand}</p>
                  </div>
                )}
                
                {customer.paintSheen && (
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-indigo-900">Paint Sheen</p>
                    <p className="text-sm text-indigo-600">{customer.paintSheen}</p>
                  </div>
                )}
              </div>
              
              {/* Go-To Colors */}
              {customer.goToColors && customer.goToColors.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Go-To Paint Colors</p>
                  <div className="flex flex-wrap gap-2">
                    {customer.goToColors.map((color, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {color}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Building Materials */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {customer.lumberGrade && (
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-amber-900">Lumber Grade</p>
                    <p className="text-sm text-amber-600">{customer.lumberGrade}</p>
                  </div>
                )}
                
                {customer.subflooring && (
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-yellow-900">Subflooring</p>
                    <p className="text-sm text-yellow-600">{customer.subflooring}</p>
                  </div>
                )}
                
                {customer.drywall && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">Drywall</p>
                    <p className="text-sm text-gray-600">{customer.drywall}</p>
                  </div>
                )}
                
                {customer.insulation && (
                  <div className="bg-pink-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-pink-900">Insulation</p>
                    <p className="text-sm text-pink-600">{customer.insulation}</p>
                  </div>
                )}
              </div>
              
              {/* Fasteners & Consumables */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {customer.screws && (
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-slate-900">Screws</p>
                    <p className="text-sm text-slate-600">{customer.screws}</p>
                  </div>
                )}
                
                {customer.caulkSealant && (
                  <div className="bg-cyan-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-cyan-900">Caulk/Sealant</p>
                    <p className="text-sm text-cyan-600">{customer.caulkSealant}</p>
                  </div>
                )}
                
                {customer.adhesive && (
                  <div className="bg-teal-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-teal-900">Adhesive</p>
                    <p className="text-sm text-teal-600">{customer.adhesive}</p>
                  </div>
                )}
                
                {customer.sawBlades && (
                  <div className="bg-emerald-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-emerald-900">Saw Blades</p>
                    <p className="text-sm text-emerald-600">{customer.sawBlades}</p>
                  </div>
                )}
              </div>
              
              {/* Plumbing & Electrical */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {customer.plumbingPipe && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Plumbing Pipe</p>
                    <p className="text-sm text-blue-600">{customer.plumbingPipe}</p>
                  </div>
                )}
                
                {customer.plumbingFittings && (
                  <div className="bg-sky-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-sky-900">Plumbing Fittings</p>
                    <p className="text-sm text-sky-600">{customer.plumbingFittings}</p>
                  </div>
                )}
                
                {customer.fixtureBrands && (
                  <div className="bg-violet-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-violet-900">Fixture Brands</p>
                    <p className="text-sm text-violet-600">{customer.fixtureBrands}</p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {customer.breakerBoxBrand && (
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-red-900">Breaker Box Brand</p>
                    <p className="text-sm text-red-600">{customer.breakerBoxBrand}</p>
                  </div>
                )}
                
                {customer.deviceBrands && (
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-orange-900">Device Brands</p>
                    <p className="text-sm text-orange-600">{customer.deviceBrands}</p>
                  </div>
                )}
              </div>
              
              {/* Appliances */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {customer.applianceBrands && (
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-purple-900">Appliance Brands</p>
                    <p className="text-sm text-purple-600">{customer.applianceBrands}</p>
                  </div>
                )}
                
                {customer.preferredApplianceModels && (
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-indigo-900">Preferred Models</p>
                    <p className="text-sm text-indigo-600">{customer.preferredApplianceModels}</p>
                  </div>
                )}
              </div>
              
              {/* Go-To Items */}
              {customer.goToItems && customer.goToItems.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Go-To Items</p>
                  <div className="flex flex-wrap gap-2">
                    {customer.goToItems.map((item, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator />
            
            {/* Customer Priority & Summary */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Customer Priority & Summary</h3>
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium text-gray-600">High Value Customer</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Order Frequency</p>
                  <p className="text-sm text-blue-600">{customer.orderFrequency || "Not specified"}</p>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-green-900">Typical Order Method</p>
                  <p className="text-sm text-green-600">{customer.typicalOrderMethod || "Not specified"}</p>
                </div>
                
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-purple-900">Communication Style</p>
                  <p className="text-sm text-purple-600">{customer.communicationStyle || "Not specified"}</p>
                </div>
              </div>
              
              {customer.theUsual && (
                <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                  <p className="text-sm font-medium text-yellow-900 mb-2">The Usual Order</p>
                  <p className="text-sm text-yellow-800">{customer.theUsual}</p>
                </div>
              )}
              
              {customer.painPoints && (
                <div className="bg-red-50 p-3 rounded-lg mb-4">
                  <p className="text-sm font-medium text-red-900 mb-2">Pain Points</p>
                  <p className="text-sm text-red-800">{customer.painPoints}</p>
                </div>
              )}
            </div>

            {customer.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h3>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {customer.notes}
                    </p>
                  </div>
                </div>
              </>
            )}
            </TabsContent>

            <TabsContent value="contacts">
              <ContactsTab customerId={customer.id} />
            </TabsContent>

            {customer.trades?.includes("property-manager") && (
              <TabsContent value="properties">
                <PropertiesTab customerId={customer.id} />
              </TabsContent>
            )}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Contacts Tab Component
function ContactsTab({ customerId }: { customerId: string }) {
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const { data: contacts = [], isLoading } = useProContacts(customerId);
  const createContact = useCreateProContact();
  const updateContact = useUpdateProContact();
  const deleteContact = useDeleteProContact();
  const { toast } = useToast();

  const contactForm = useForm({
    defaultValues: {
      name: "",
      title: "",
      phone: "",
      phoneExtension: "",
      email: "",
      notes: "",
    },
  });

  const handleAddContact = (data: any) => {
    createContact.mutate({
      proCustomerId: customerId,
      name: data.name,
      title: data.title,
      phone: data.phone,
      phoneExtension: data.phoneExtension,
      email: data.email,
      notes: data.notes,
    }, {
      onSuccess: () => {
        contactForm.reset();
        setIsAddingContact(false);
      },
    });
  };

  const handleUpdateContact = (data: any) => {
    if (!editingContact) return;
    updateContact.mutate({
      id: editingContact.id,
      data: {
        name: data.name,
        title: data.title,
        phone: data.phone,
        phoneExtension: data.phoneExtension,
        email: data.email,
        notes: data.notes,
      },
    }, {
      onSuccess: () => {
        contactForm.reset();
        setEditingContact(null);
      },
    });
  };

  const handleDeleteContact = (contactId: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      deleteContact.mutate({ id: contactId, proCustomerId: customerId });
    }
  };

  const handleEditContact = (contact: any) => {
    setEditingContact(contact);
    contactForm.reset({
      name: contact.name || "",
      title: contact.title || "",
      phone: contact.phone || "",
      phoneExtension: contact.phoneExtension || "",
      email: contact.email || "",
      notes: contact.notes || "",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Contacts</h3>
        <Button 
          onClick={() => {
            setIsAddingContact(true);
            setEditingContact(null);
            contactForm.reset();
          }} 
          size="sm"
          data-testid="button-add-contact"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading contacts...</div>
      ) : contacts.length === 0 && !isAddingContact ? (
        <div className="text-center py-8 text-gray-500">
          No contacts added yet. Click "Add Contact" to create one.
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div key={contact.id} className="p-4 border rounded-lg bg-white" data-testid={`contact-card-${contact.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <User className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      {contact.title && (
                        <p className="text-sm text-gray-600">{contact.title}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 ml-8">
                    {contact.phone && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{contact.phone}{contact.phoneExtension ? ` ext. ${contact.phoneExtension}` : ""}</span>
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{contact.email}</span>
                      </div>
                    )}
                  </div>
                  {contact.notes && (
                    <p className="text-sm text-gray-600 mt-2 ml-8">{contact.notes}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditContact(contact)}
                    data-testid={`button-edit-contact-${contact.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteContact(contact.id)}
                    className="text-red-600 hover:text-red-800"
                    data-testid={`button-delete-contact-${contact.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(isAddingContact || editingContact) && (
        <div className="p-4 border rounded-lg bg-gray-50">
          <h4 className="font-semibold text-gray-900 mb-4">
            {editingContact ? "Edit Contact" : "Add New Contact"}
          </h4>
          <Form {...contactForm}>
            <form onSubmit={contactForm.handleSubmit(editingContact ? handleUpdateContact : handleAddContact)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={contactForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Contact name" {...field} data-testid="input-contact-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={contactForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Job title" {...field} data-testid="input-contact-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <PhoneInput
                phoneValue={contactForm.watch("phone") || ""}
                extensionValue={contactForm.watch("phoneExtension") || ""}
                onPhoneChange={(value) => contactForm.setValue("phone", value)}
                onExtensionChange={(value) => contactForm.setValue("phoneExtension", value)}
                phoneLabel="Phone Number"
                extensionLabel="Ext"
              />

              <FormField
                control={contactForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} data-testid="input-contact-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={contactForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes..." {...field} data-testid="textarea-contact-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingContact(false);
                    setEditingContact(null);
                    contactForm.reset();
                  }}
                  data-testid="button-cancel-contact"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createContact.isPending || updateContact.isPending}
                  data-testid="button-save-contact"
                >
                  {editingContact ? "Update" : "Add"} Contact
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}

// Properties Tab Component
function PropertiesTab({ customerId }: { customerId: string }) {
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any | null>(null);
  const { data: properties = [], isLoading } = useManagedProperties(customerId);
  const createProperty = useCreateManagedProperty();
  const updateProperty = useUpdateManagedProperty();
  const deleteProperty = useDeleteManagedProperty();
  const { toast } = useToast();

  const propertyForm = useForm({
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      phoneExtension: "",
      unitCount: "",
      notes: "",
    },
  });

  const handleAddProperty = (data: any) => {
    createProperty.mutate({
      proCustomerId: customerId,
      name: data.name,
      address: data.address,
      phone: data.phone,
      phoneExtension: data.phoneExtension,
      unitCount: data.unitCount ? parseInt(data.unitCount) : null,
      notes: data.notes,
    }, {
      onSuccess: () => {
        propertyForm.reset();
        setIsAddingProperty(false);
      },
    });
  };

  const handleUpdateProperty = (data: any) => {
    if (!editingProperty) return;
    updateProperty.mutate({
      id: editingProperty.id,
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        phoneExtension: data.phoneExtension,
        unitCount: data.unitCount ? parseInt(data.unitCount) : null,
        notes: data.notes,
      },
    }, {
      onSuccess: () => {
        propertyForm.reset();
        setEditingProperty(null);
      },
    });
  };

  const handleDeleteProperty = (propertyId: string) => {
    if (confirm("Are you sure you want to delete this property?")) {
      deleteProperty.mutate({ id: propertyId, proCustomerId: customerId });
    }
  };

  const handleEditProperty = (property: any) => {
    setEditingProperty(property);
    propertyForm.reset({
      name: property.name || "",
      address: property.address || "",
      phone: property.phone || "",
      phoneExtension: property.phoneExtension || "",
      unitCount: property.unitCount?.toString() || "",
      notes: property.notes || "",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Managed Properties</h3>
        <Button 
          onClick={() => {
            setIsAddingProperty(true);
            setEditingProperty(null);
            propertyForm.reset();
          }} 
          size="sm"
          data-testid="button-add-property"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading properties...</div>
      ) : properties.length === 0 && !isAddingProperty ? (
        <div className="text-center py-8 text-gray-500">
          No properties added yet. Click "Add Property" to create one.
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map((property) => (
            <div key={property.id} className="p-4 border rounded-lg bg-white" data-testid={`property-card-${property.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Home className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">{property.name}</p>
                      {property.address && (
                        <p className="text-sm text-gray-600">{property.address}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 ml-8">
                    {property.phone && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{property.phone}{property.phoneExtension ? ` ext. ${property.phoneExtension}` : ""}</span>
                      </div>
                    )}
                    {property.unitCount && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span>{property.unitCount} units</span>
                      </div>
                    )}
                  </div>
                  {property.notes && (
                    <p className="text-sm text-gray-600 mt-2 ml-8">{property.notes}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditProperty(property)}
                    data-testid={`button-edit-property-${property.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteProperty(property.id)}
                    className="text-red-600 hover:text-red-800"
                    data-testid={`button-delete-property-${property.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(isAddingProperty || editingProperty) && (
        <div className="p-4 border rounded-lg bg-gray-50">
          <h4 className="font-semibold text-gray-900 mb-4">
            {editingProperty ? "Edit Property" : "Add New Property"}
          </h4>
          <Form {...propertyForm}>
            <form onSubmit={propertyForm.handleSubmit(editingProperty ? handleUpdateProperty : handleAddProperty)} className="space-y-4">
              <FormField
                control={propertyForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Property name" {...field} data-testid="input-property-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={propertyForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Property address" {...field} data-testid="input-property-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <PhoneInput
                phoneValue={propertyForm.watch("phone") || ""}
                extensionValue={propertyForm.watch("phoneExtension") || ""}
                onPhoneChange={(value) => propertyForm.setValue("phone", value)}
                onExtensionChange={(value) => propertyForm.setValue("phoneExtension", value)}
                phoneLabel="Phone Number"
                extensionLabel="Ext"
              />

              <FormField
                control={propertyForm.control}
                name="unitCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Count</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Number of units" {...field} data-testid="input-property-unit-count" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={propertyForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes..." {...field} data-testid="textarea-property-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingProperty(false);
                    setEditingProperty(null);
                    propertyForm.reset();
                  }}
                  data-testid="button-cancel-property"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createProperty.isPending || updateProperty.isPending}
                  data-testid="button-save-property"
                >
                  {editingProperty ? "Update" : "Add"} Property
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}