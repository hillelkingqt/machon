import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants'; // Adjust path as necessary

// Ensure that SUPABASE_URL and SUPABASE_ANON_KEY are not undefined
if (!SUPABASE_URL) {
  throw new Error("Supabase URL is not defined. Please check your constants.tsx file.");
}

if (!SUPABASE_ANON_KEY) {
  throw new Error("Supabase anonymous key is not defined. Please check your constants.tsx file.");
}

const customFetch: typeof fetch = (input, init) => {
  const headers = new Headers(init?.headers);
  headers.set('Accept', 'application/json');
  return fetch(input, { ...init, headers });
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { fetch: customFetch },
});
