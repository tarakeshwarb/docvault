import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "../env";

let cachedClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!cachedClient) {
    cachedClient = createClient(
      requireEnv("SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          persistSession: false,
        },
      }
    );
  }
  return cachedClient;
}
