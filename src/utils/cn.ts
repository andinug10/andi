/**
 * AI Health Copilot Pro — Class Name Concatenator
 */
export function cn(...inputs: (string | boolean | undefined | null)[]): string {
  return inputs.filter(Boolean).join(' ');
}
