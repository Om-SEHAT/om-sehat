// Form validation utilities
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateField = (value: string, rules: ValidationRule): ValidationResult => {
  // Required validation
  if (rules.required && (!value || value.trim().length === 0)) {
    return { isValid: false, error: 'Field ini wajib diisi' };
  }

  // Skip other validations if field is empty and not required
  if (!value || value.trim().length === 0) {
    return { isValid: true };
  }

  // Min length validation
  if (rules.minLength && value.length < rules.minLength) {
    return { 
      isValid: false, 
      error: `Minimal ${rules.minLength} karakter` 
    };
  }

  // Max length validation
  if (rules.maxLength && value.length > rules.maxLength) {
    return { 
      isValid: false, 
      error: `Maksimal ${rules.maxLength} karakter` 
    };
  }

  // Email validation
  if (rules.email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      return { isValid: false, error: 'Format email tidak valid' };
    }
  }

  // Phone validation (Indonesian format)
  if (rules.phone) {
    const phonePattern = /^(\+62|62|0)[0-9]{8,13}$/;
    if (!phonePattern.test(value.replace(/[\s-]/g, ''))) {
      return { isValid: false, error: 'Format nomor telepon tidak valid' };
    }
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(value)) {
    return { isValid: false, error: 'Format tidak valid' };
  }

  return { isValid: true };
};

export const validateForm = (
  formData: Record<string, string>, 
  rules: Record<string, ValidationRule>
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  let isValid = true;

  Object.keys(rules).forEach(field => {
    const result = validateField(formData[field] || '', rules[field]);
    if (!result.isValid) {
      errors[field] = result.error || '';
      isValid = false;
    }
  });

  return { isValid, errors };
};

// Utility function to format phone number
export const formatPhoneNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,2})$/);
  
  if (match) {
    const formatted = [match[1], match[2], match[3], match[4]]
      .filter(Boolean)
      .join('-');
    return formatted;
  }
  
  return value;
};

// Utility function to debounce search input
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
