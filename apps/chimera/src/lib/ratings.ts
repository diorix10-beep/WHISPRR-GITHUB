/** Public label for a stored rating. A missing rating means SFW, shown as General. */
export function ratingLabel(rating: string | null): string {
  const value = (rating || 'SFW').toUpperCase();
  if (value === 'SFW') return 'GENERAL';
  return value;
}
