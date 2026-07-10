// Validation utilities for WHISPRR
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) return { valid: false, error: 'Email is required' };
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return { valid: false, error: 'Enter a valid email address' };
  return { valid: true };
}

export function validatePassword(password: string): ValidationResult {
  if (!password) return { valid: false, error: 'Password is required' };
  if (password.length < 8) return { valid: false, error: 'Password must be at least 8 characters' };
  return { valid: true };
}

export function validatePasswordConfirm(password: string, confirm: string): ValidationResult {
  if (!confirm) return { valid: false, error: 'Please confirm your password' };
  if (password !== confirm) return { valid: false, error: 'Passwords do not match' };
  return { valid: true };
}

export function validateUsername(username: string): ValidationResult {
  if (!username.trim()) return { valid: false, error: 'Username is required' };
  if (username.length < 3) return { valid: false, error: 'Username must be at least 3 characters' };
  if (username.length > 20) return { valid: false, error: 'Username cannot exceed 20 characters' };
  if (!/^[a-zA-Z0-9_]+$/.test(username))
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  return { valid: true };
}

export function validateDisplayName(name: string): ValidationResult {
  if (!name.trim()) return { valid: false, error: 'Display name is required' };
  if (name.trim().length < 2) return { valid: false, error: 'Display name must be at least 2 characters' };
  if (name.trim().length > 50) return { valid: false, error: 'Display name cannot exceed 50 characters' };
  return { valid: true };
}

export function validateRequired(value: string, fieldName: string): ValidationResult {
  if (!value.trim()) return { valid: false, error: `${fieldName} is required` };
  return { valid: true };
}

export function getPasswordStrength(password: string): {
  score: number; // 0-4
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: 'Very weak', color: 'bg-red-500' },
    { label: 'Weak', color: 'bg-orange-500' },
    { label: 'Fair', color: 'bg-yellow-500' },
    { label: 'Good', color: 'bg-blue-500' },
    { label: 'Strong', color: 'bg-green-500' },
  ];
  const clamped = Math.min(score, 4);
  return { score: clamped, ...levels[clamped] };
}
