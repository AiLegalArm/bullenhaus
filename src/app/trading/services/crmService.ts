import { supabase } from '../lib/supabase';

const proxyFetch = async (action: string, payload: any, explicitToken?: string) => {
  try {
    let token = explicitToken;
    if (!token) {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token;
    }

    if (!token) {
      console.warn(`[Client] No active session for CRM sync (${action})`);
      return null;
    }

    const response = await fetch('/api/crm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action, payload })
    });
    if (!response.ok) {
      // Do not crash the app, just log a generic warning
      console.warn(`[Client] CRM Sync warning for ${action}`);
      return null;
    }
    return await response.json();
  } catch (err) {
    console.warn(`[Client] Network error during CRM sync for ${action}`);
    return null;
  }
};

export interface RegisterClientPayload {
  external_trader_id: string;
  full_name: string;
  email: string;
  phone?: string;
  country?: string;
  account?: Record<string, unknown>;
  attribution?: {
    ref?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  };
}

export const crmService = {
  async registerClient(data: RegisterClientPayload, token?: string) {
    return proxyFetch('registerClient', data, token);
  },

  async transaction(data: any, token?: string) {
    const normalizedData = {
      ...data,
      // method/instructions are passed through unchanged so Aura sees the same values
      // the admin/client see in Trade-V2.
      method: data.method || 'Other',
      instructions: data.instructions || '',
      status: data.status.toLowerCase(),
      processed_at: data.processed_at || new Date().toISOString()
    };
    return proxyFetch('transaction', normalizedData, token);
  },

  async activity(data: any, token?: string) {
    const normalizedData = {
      ...data,
      side: data.side ? data.side.toLowerCase() : undefined,
      opened_at: data.opened_at || new Date().toISOString(),
      volume: Number(data.volume) || 0.01
    };
    return proxyFetch('activity', normalizedData, token);
  },

  async kycUpdate(data: any, token?: string) {
    const normalizedData = {
      ...data,
      status: data.status.toLowerCase(),
      reviewed_at: data.reviewed_at || new Date().toISOString()
    };
    return proxyFetch('kycUpdate', normalizedData, token);
  }
};
