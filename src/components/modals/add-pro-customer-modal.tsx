import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { insertProCustomerSchema, type InsertProCustomer, type PhoneContact, type EmailContact } from "@shared/schema";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTrades, useCreateTrade } from "@/hooks/use-trades";
import { useBusinessTypes, useCreateBusinessType } from "@/hooks/use-business-types";
import { PhoneInput } from "@/components/ui/phone-input";
import { MultiPhoneField, MultiEmailField } from "@/components/ui/multi-contact-field";

interface AddProCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddProCustomerModal({ isOpen, onClose }: AddProCustomerModalProps) {
  const { toast } = useToast();
  const { data: trades = [], isLoading: tradesLoading } = useTrades();
  const createTradeMutation = useCreateTrade();
  const { data: businessTypes = [], isLoading: businessTypesLoading } = useBusinessTypes();
  const createBusinessTypeMutation = useCreateBusinessType();
  const [currentGoToColors, setCurrentGoToColors] = useState<string[]>([]);
  const [currentGoToItems, setCurrentGoToItems] = useState<string[]>([]);
  const [currentSpecialties, setCurrentSpecialties] = useState<string[]>([]);
  const [currentDeliveryAddresses, setCurrentDeliveryAddresses] = useState<string[]>([]);
  const [showCustomTrade, setShowCustomTrade] = useState(false);
  const [customTrade, setCustomTrade] = useState("");
  const [showCustomBusinessType, setShowCustomBusinessType] = useState(false);
  const [customBusinessType, setCustomBusinessType] = useState("");
  
  const form = useForm<InsertProCustomer>({
    resolver: zodResolver(
      insertProCustomerSchema.extend({
        trades: z.array(z.string()).min(1, "Please select at least one trade"),
      })
    ),
    defaultValues: {
      businessName: "",
      businessTypes: [],
      primaryContactName: "",
      primaryContactRole: "",
      primaryContactMobile: "",
      primaryContactMobileExtension: "",
      primaryContactEmail: "",
      lowesProAccountNumber: "",
      taxExemptNumber: "",
      preferredContactMethod: "",
      paymentPreference: "",
      mvpRewardsProgram: false,
      trades: [],
      secondarySpecialties: [],
      typicalProjectType: "",
      currentMajorProjects: "",
      powerToolPlatform: "",
      paintBrand: "",
      paintSheen: "",
      goToColors: [],
      lumberGrade: "",
      subflooring: "",
      drywall: "",
      insulation: "",
      screws: "",
      caulkSealant: "",
      adhesive: "",
      sawBlades: "",
      plumbingPipe: "",
      plumbingFittings: "",
      fixtureBrands: "",
      breakerBoxBrand: "",
      deviceBrands: "",
      applianceBrands: "",
      preferredApplianceModels: "",
      goToItems: [],
      typicalOrderMethod: "",
      fulfillmentPreference: "",
      frequentDeliveryAddresses: [],
      purchasingInfluencers: "",
      orderFrequency: "",
      painPoints: "",
      theUsual: "",
      communicationStyle: "",
      lastMajorQuoteIssue: "",
      notes: "",
      phones: [],
      emails: [],
    }
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: InsertProCustomer) => {
      const response = await apiRequest("POST", "/api/pro-customers", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pro-customers"] });
      toast({
        title: "Success",
        description: "Pro customer created successfully",
      });
      form.reset();
      setCurrentGoToColors([]);
      setCurrentGoToItems([]);
      setCurrentSpecialties([]);
      setCurrentDeliveryAddresses([]);
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create pro customer",
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

    // Include the array values and final trades/business types
    const submissionData = {
      ...data,
      trades: finalTrades,
      businessTypes: finalBusinessTypes,
      secondarySpecialties: currentSpecialties,
      goToColors: currentGoToColors,
      goToItems: currentGoToItems,
      frequentDeliveryAddresses: currentDeliveryAddresses,
    };
    createCustomerMutation.mutate(submissionData);
  };

  const addArrayItem = (type: 'colors' | 'items' | 'specialties' | 'addresses', value: string) => {
    if (!value.trim()) return;
    
    switch (type) {
      case 'colors':
        if (!currentGoToColors.includes(value.trim())) {
          setCurrentGoToColors([...currentGoToColors, value.trim()]);
        }
        break;
      case 'items':
        if (!currentGoToItems.includes(value.trim())) {
          setCurrentGoToItems([...currentGoToItems, value.trim()]);
        }
        break;
      case 'specialties':
        if (!currentSpecialties.includes(value.trim())) {
          setCurrentSpecialties([...currentSpecialties, value.trim()]);
        }
        break;
      case 'addresses':
        if (!currentDeliveryAddresses.includes(value.trim())) {
          setCurrentDeliveryAddresses([...currentDeliveryAddresses, value.trim()]);
        }
        break;
    }
  };

  const removeArrayItem = (type: 'colors' | 'items' | 'specialties' | 'addresses', value: string) => {
    switch (type) {
      case 'colors':
        setCurrentGoToColors(currentGoToColors.filter(item => item !== value));
        break;
      case 'items':
        setCurrentGoToItems(currentGoToItems.filter(item => item !== value));
        break;
      case 'specialties':
        setCurrentSpecialties(currentSpecialties.filter(item => item !== value));
        break;
      case 'addresses':
        setCurrentDeliveryAddresses(currentDeliveryAddresses.filter(item => item !== value));
        break;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">Add New Pro Customer</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Core Business & Contact Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Core Business & Contact Information</h3>
              
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
                      <FormLabel>Lowe's Pro Account Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Pro account number" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="primaryContactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Contact name" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="primaryContactRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Role</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">Owner</SelectItem>
                            <SelectItem value="foreman">Foreman</SelectItem>
                            <SelectItem value="office-manager">Office Manager</SelectItem>
                            <SelectItem value="project-manager">Project Manager</SelectItem>
                            <SelectItem value="estimator">Estimator</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="preferredContactMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Contact Method</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="call">Call</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                          </SelectContent>
                        </Select>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PhoneInput
                  phoneValue={form.watch("primaryContactMobile") || ""}
                  extensionValue={form.watch("primaryContactMobileExtension") || ""}
                  onPhoneChange={(value) => form.setValue("primaryContactMobile", value)}
                  onExtensionChange={(value) => form.setValue("primaryContactMobileExtension", value)}
                  phoneLabel="Mobile Number (Backup)"
                  extensionLabel="Ext"
                />
                
                <FormField
                  control={form.control}
                  name="primaryContactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Backup)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Email address" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="taxExemptNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Exempt Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Tax exempt #" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                          <Select onValueChange={field.onChange} value={field.value || ""} data-testid="select-payment-preference">
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
                            data-testid="switch-mvp-rewards"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Trade & Project Profile */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Trade & Project Profile</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                  checked={field.value.includes(trade.name)}
                                  onChange={(e) => {
                                    const updatedTrades = e.target.checked
                                      ? [...field.value, trade.name]
                                      : field.value.filter(t => t !== trade.name);
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
                                checked={field.value.includes("other")}
                                onChange={(e) => {
                                  const updatedTrades = e.target.checked
                                    ? [...field.value, "other"]
                                    : field.value.filter(t => t !== "other");
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
                  <div className="md:col-span-2">
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
                                  checked={field.value.includes(businessType.name)}
                                  onChange={(e) => {
                                    const updatedTypes = e.target.checked
                                      ? [...field.value, businessType.name]
                                      : field.value.filter(t => t !== businessType.name);
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
                                checked={field.value.includes("other")}
                                onChange={(e) => {
                                  const updatedTypes = e.target.checked
                                    ? [...field.value, "other"]
                                    : field.value.filter(t => t !== "other");
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
                  <div className="md:col-span-2">
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
                
                <FormField
                  control={form.control}
                  name="typicalProjectType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Typical Project Type</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="residential">Residential</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                            <SelectItem value="new-construction">New Construction</SelectItem>
                            <SelectItem value="repair-remodel">Repair/Remodel</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="currentMajorProjects"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Major Projects</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., Working on the Elm Street subdivision until October"
                        {...field} 
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Brand & Product Preferences */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Brand & Product Preferences</h3>
              
              {/* Power Tools & Paint */}
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
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dewalt-20v-max">DeWalt 20V MAX</SelectItem>
                            <SelectItem value="milwaukee-m18">Milwaukee M18</SelectItem>
                            <SelectItem value="makita-18v-lxt">Makita 18V LXT</SelectItem>
                            <SelectItem value="flex">FLEX</SelectItem>
                            <SelectItem value="bosch">Bosch</SelectItem>
                            <SelectItem value="ridgid">RIDGID</SelectItem>
                            <SelectItem value="ryobi">RYOBI</SelectItem>
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
                            <SelectItem value="valspar">Valspar</SelectItem>
                            <SelectItem value="hgtv-sherwin-williams">HGTV Home by Sherwin-Williams</SelectItem>
                            <SelectItem value="sherwin-williams">Sherwin-Williams</SelectItem>
                            <SelectItem value="benjamin-moore">Benjamin Moore</SelectItem>
                            <SelectItem value="behr">Behr</SelectItem>
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
                            <SelectItem value="flat">Flat</SelectItem>
                            <SelectItem value="eggshell">Eggshell</SelectItem>
                            <SelectItem value="satin">Satin</SelectItem>
                            <SelectItem value="semi-gloss">Semi-Gloss</SelectItem>
                            <SelectItem value="gloss">Gloss</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Building Materials */}
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
                            <SelectItem value="prime-2">#2 Prime</SelectItem>
                            <SelectItem value="stud-grade">Stud Grade</SelectItem>
                            <SelectItem value="construction-grade">Construction Grade</SelectItem>
                            <SelectItem value="standard-grade">Standard Grade</SelectItem>
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
              
              {/* Appliances */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="applianceBrands"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Appliance Brands</FormLabel>
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
                      <FormLabel>Preferred Appliance Models</FormLabel>
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
            </div>
            
            {/* Ordering & Logistics */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Ordering & Logistics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="typicalOrderMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Typical Order Method</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="call-in">Call-in</SelectItem>
                            <SelectItem value="email">Email List</SelectItem>
                            <SelectItem value="text">Text Message</SelectItem>
                            <SelectItem value="walk-in">Walk-in</SelectItem>
                            <SelectItem value="online">Online</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="fulfillmentPreference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fulfillment Preference</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select preference" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="will-call">Will Call (Pickup)</SelectItem>
                            <SelectItem value="jobsite-delivery">Jobsite Delivery</SelectItem>
                            <SelectItem value="business-delivery">Business Delivery</SelectItem>
                            <SelectItem value="mixed">Mixed (Depends on Order)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="orderFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Frequency</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                            <SelectItem value="per-project">Per Project</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
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
                  name="purchasingInfluencers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchasing Influencers</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Owner approves over $500, Foreman has buying authority"
                          {...field} 
                          value={field.value || ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="communicationStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Communication Style</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="business-focused">All Business - In & Out</SelectItem>
                            <SelectItem value="friendly-chat">Enjoys Quick Chat</SelectItem>
                            <SelectItem value="detailed-oriented">Detailed & Thorough</SelectItem>
                            <SelectItem value="direct">Direct & Concise</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Relationship & Service Notes */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Relationship & Service Notes</h3>
              
              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name="painPoints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pain Points</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="e.g., Hates waiting for pipe to be cut, Always needs specific item that's out of stock"
                          {...field} 
                          value={field.value || ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="theUsual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>The Usual</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="e.g., Always gets two bags of concrete with lumber order, Loves the free popcorn"
                          {...field} 
                          value={field.value || ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastMajorQuoteIssue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Major Quote/Issue</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Quoted kitchen cabinets 8/25, Helped resolve damaged vanity issue"
                          {...field} 
                          value={field.value || ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Additional Notes</h3>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>General Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional notes about this customer..."
                        className="min-h-[100px]"
                        {...field} 
                        value={field.value || ""} 
                      />
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
                disabled={createCustomerMutation.isPending}
              >
                {createCustomerMutation.isPending ? "Adding..." : "Add Pro Customer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}