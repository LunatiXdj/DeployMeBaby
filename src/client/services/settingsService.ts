
import { CompanySettings } from '@/shared/types';

export async function getCompanySettings(): Promise<CompanySettings> {
  // This function runs on the client, so it fetches from the API route
  const response = await fetch('/api/company-settings');
  if (!response.ok) {
    throw new Error('Failed to fetch company settings');
  }
  const data = await response.json();
  return data;
}
