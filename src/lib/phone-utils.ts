// Phone number formatting utilities

export const formatPhoneNumber = (value: string): string => {
  // Remove all non-digit characters
  const cleaned = value.replace(/\D/g, '');
  
  // Don't format if empty
  if (cleaned.length === 0) return '';
  
  // Format as (xxx) xxx-xxxx
  if (cleaned.length >= 10) {
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
  }
  
  // Partial formatting for incomplete numbers
  if (cleaned.length >= 6) {
    const match = cleaned.match(/^(\d{3})(\d{3})(\d*)/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
  }
  
  if (cleaned.length >= 3) {
    const match = cleaned.match(/^(\d{3})(\d*)/);
    if (match) {
      return `(${match[1]}) ${match[2]}`;
    }
  }
  
  return cleaned;
};

export const stripPhoneFormatting = (value: string): string => {
  return value.replace(/\D/g, '');
};

export const isValidPhoneNumber = (value: string): boolean => {
  const cleaned = stripPhoneFormatting(value);
  return cleaned.length === 10;
};