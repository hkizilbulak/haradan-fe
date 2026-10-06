import { resolveApiBaseUrl, HttpClient } from '@/services/http';

export interface BankAccount {
  id: number;
  bank_name: string;
  account_holder: string;
  iban: string;
  branch_name?: string;
  account_number?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const getActiveBankAccounts = async (): Promise<BankAccount[]> => {
  const baseUrl = resolveApiBaseUrl() || '';
  const http = new HttpClient(baseUrl);
  const data = await http.request<BankAccount[]>('/v1/bank-accounts/active');
  return data || [];
};
