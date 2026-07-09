import { PostgrestError } from '@supabase/supabase-js';

export function parseSupabaseError(error: unknown): string {
  if (!error) return 'An unexpected error occurred.';

  // If it's a Supabase PostgrestError
  if (typeof error === 'object' && 'code' in error) {
    const pgError = error as PostgrestError;

    // RLS (Row Level Security) violation or permission error
    if (pgError.code === 'PGRST116' || pgError.code === '42501') {
      return 'You do not have permission to perform this action.';
    }

    // Unique constraint violation (e.g., duplicate username)
    if (pgError.code === '23505') {
      if (pgError.message.includes('profiles_username_key')) {
        return 'This username is already taken. Please choose another.';
      }
      return 'This record already exists.';
    }

    // Foreign key violation
    if (pgError.code === '23503') {
      return 'This action cannot be completed because it references a missing record.';
    }

    return pgError.message || 'A database error occurred.';
  }

  if (error instanceof Error) {
    // Handle standard auth errors like "User already registered"
    if (error.message.toLowerCase().includes('already registered')) {
      return 'An account with this email already exists.';
    }
    return error.message;
  }

  return 'An unexpected error occurred.';
}
