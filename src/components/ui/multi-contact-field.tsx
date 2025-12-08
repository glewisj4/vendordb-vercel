import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import type { PhoneContact, EmailContact } from "@shared/schema";

interface MultiPhoneFieldProps {
  value: PhoneContact[];
  onChange: (value: PhoneContact[]) => void;
  label?: string;
}

export function MultiPhoneField({ value, onChange, label = "Phone Numbers" }: MultiPhoneFieldProps) {
  const [phones, setPhones] = useState<PhoneContact[]>(value.length > 0 ? value : [{ label: "Primary", number: "", extension: "" }]);

  // Sync internal state with form value changes (for edit mode and form resets)
  useEffect(() => {
    if (value && value.length > 0) {
      setPhones(value);
    } else {
      setPhones([{ label: "Primary", number: "", extension: "" }]);
    }
  }, [value]);

  const handleAdd = () => {
    const newPhones = [...phones, { label: "", number: "", extension: "" }];
    setPhones(newPhones);
    onChange(newPhones);
  };

  const handleRemove = (index: number) => {
    const newPhones = phones.filter((_, i) => i !== index);
    setPhones(newPhones.length > 0 ? newPhones : [{ label: "Primary", number: "", extension: "" }]);
    onChange(newPhones.length > 0 ? newPhones : [{ label: "Primary", number: "", extension: "" }]);
  };

  const handleChange = (index: number, field: keyof PhoneContact, fieldValue: string) => {
    const newPhones = [...phones];
    newPhones[index] = { ...newPhones[index], [field]: fieldValue };
    setPhones(newPhones);
    onChange(newPhones);
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="h-8 px-2"
          data-testid="button-add-phone"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
      {phones.map((phone, index) => (
        <div key={index} className="flex items-end gap-2 p-3 border rounded-md bg-muted/30">
          <div className="flex-1 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Label</Label>
                <Input
                  placeholder="e.g., Office, Mobile, Home"
                  value={phone.label}
                  onChange={(e) => handleChange(index, "label", e.target.value)}
                  className="h-9"
                  data-testid={`input-phone-label-${index}`}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Phone Number</Label>
                <Input
                  placeholder="(555) 555-5555"
                  value={phone.number}
                  onChange={(e) => handleChange(index, "number", formatPhoneNumber(e.target.value))}
                  className="h-9"
                  data-testid={`input-phone-number-${index}`}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Extension (Optional)</Label>
                <Input
                  placeholder="Ext."
                  value={phone.extension || ""}
                  onChange={(e) => handleChange(index, "extension", e.target.value)}
                  className="h-9"
                  data-testid={`input-phone-extension-${index}`}
                />
              </div>
            </div>
          </div>
          {phones.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemove(index)}
              className="h-9 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              data-testid={`button-remove-phone-${index}`}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

interface MultiEmailFieldProps {
  value: EmailContact[];
  onChange: (value: EmailContact[]) => void;
  label?: string;
}

export function MultiEmailField({ value, onChange, label = "Email Addresses" }: MultiEmailFieldProps) {
  const [emails, setEmails] = useState<EmailContact[]>(value.length > 0 ? value : [{ label: "Primary", address: "" }]);

  // Sync internal state with form value changes (for edit mode and form resets)
  useEffect(() => {
    if (value && value.length > 0) {
      setEmails(value);
    } else {
      setEmails([{ label: "Primary", address: "" }]);
    }
  }, [value]);

  const handleAdd = () => {
    const newEmails = [...emails, { label: "", address: "" }];
    setEmails(newEmails);
    onChange(newEmails);
  };

  const handleRemove = (index: number) => {
    const newEmails = emails.filter((_, i) => i !== index);
    setEmails(newEmails.length > 0 ? newEmails : [{ label: "Primary", address: "" }]);
    onChange(newEmails.length > 0 ? newEmails : [{ label: "Primary", address: "" }]);
  };

  const handleChange = (index: number, field: keyof EmailContact, fieldValue: string) => {
    const newEmails = [...emails];
    newEmails[index] = { ...newEmails[index], [field]: fieldValue };
    setEmails(newEmails);
    onChange(newEmails);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="h-8 px-2"
          data-testid="button-add-email"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
      {emails.map((email, index) => (
        <div key={index} className="flex items-end gap-2 p-3 border rounded-md bg-muted/30">
          <div className="flex-1 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Label</Label>
                <Input
                  placeholder="e.g., Work, Personal, Billing"
                  value={email.label}
                  onChange={(e) => handleChange(index, "label", e.target.value)}
                  className="h-9"
                  data-testid={`input-email-label-${index}`}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email Address</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={email.address}
                  onChange={(e) => handleChange(index, "address", e.target.value)}
                  className="h-9"
                  data-testid={`input-email-address-${index}`}
                />
              </div>
            </div>
          </div>
          {emails.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemove(index)}
              className="h-9 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              data-testid={`button-remove-email-${index}`}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
