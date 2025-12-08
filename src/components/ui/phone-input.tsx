import React, { useState, useEffect } from 'react';
import { Input } from './input';
import { Label } from './label';
import { formatPhoneNumber } from '@/lib/phone-utils';

interface PhoneInputProps {
  phoneValue: string;
  extensionValue?: string;
  onPhoneChange: (value: string) => void;
  onExtensionChange?: (value: string) => void;
  phoneLabel?: string;
  extensionLabel?: string;
  phonePlaceholder?: string;
  extensionPlaceholder?: string;
  required?: boolean;
  showExtension?: boolean;
  className?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  phoneValue,
  extensionValue = '',
  onPhoneChange,
  onExtensionChange,
  phoneLabel = 'Phone Number',
  extensionLabel = 'Extension',
  phonePlaceholder = '(555) 123-4567',
  extensionPlaceholder = 'ext',
  required = false,
  showExtension = true,
  className = '',
}) => {
  const [formattedPhone, setFormattedPhone] = useState(phoneValue);

  useEffect(() => {
    setFormattedPhone(formatPhoneNumber(phoneValue));
  }, [phoneValue]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatPhoneNumber(rawValue);
    setFormattedPhone(formatted);
    
    // Extract just the digits for storage
    const digitsOnly = rawValue.replace(/\D/g, '');
    onPhoneChange(digitsOnly);
  };

  const handleExtensionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, ''); // Only allow digits
    if (onExtensionChange) {
      onExtensionChange(value);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex space-x-2">
        <div className="flex-1">
          <Label htmlFor="phone">{phoneLabel} {required && <span className="text-red-500">*</span>}</Label>
          <Input
            id="phone"
            type="tel"
            placeholder={phonePlaceholder}
            value={formattedPhone}
            onChange={handlePhoneChange}
            maxLength={14} // (xxx) xxx-xxxx = 14 characters
          />
        </div>
        {showExtension && (
          <div className="w-20">
            <Label htmlFor="extension">{extensionLabel}</Label>
            <Input
              id="extension"
              type="text"
              placeholder={extensionPlaceholder}
              value={extensionValue}
              onChange={handleExtensionChange}
              maxLength={6}
            />
          </div>
        )}
      </div>
    </div>
  );
};