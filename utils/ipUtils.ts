import { supabase } from './supabaseClient';

interface SupabaseIpResponse {
  ip: string;
}

interface IpifyResponse {
  ip: string;
}

/**
 * Fetches the user's IP address with a fallback mechanism.
 * 
 * @returns A promise that resolves to the IP address as a string, or null if fetching fails.
 */
export const fetchIpWithFallback = async (): Promise<string | null> => {
  try {
    // First, try Supabase function
    const { data, error } = await supabase.functions.invoke('get-my-ip');

    if (error) {
      console.error('Error fetching IP from Supabase:', error);
      throw new Error('Supabase IP fetch failed'); // Trigger fallback
    }

    if (data && typeof (data as SupabaseIpResponse).ip === 'string') {
      return (data as SupabaseIpResponse).ip;
    }
    console.warn('Invalid IP data from Supabase:', data);
    throw new Error('Supabase IP data invalid'); // Trigger fallback

  } catch (supabaseError) {
    console.warn('Supabase IP fetch failed, trying ipify.org:', supabaseError);

    // Fallback to ipify.org
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      if (!response.ok) {
        console.error('Error fetching IP from ipify.org, status:', response.status);
        return null;
      }
      const ipifyData = await response.json() as IpifyResponse;
      if (ipifyData && typeof ipifyData.ip === 'string') {
        return ipifyData.ip;
      }
      console.error('Invalid IP data from ipify.org:', ipifyData);
      return null;
    } catch (ipifyError) {
      console.error('Error fetching IP from ipify.org:', ipifyError);
      return null;
    }
  }
};
