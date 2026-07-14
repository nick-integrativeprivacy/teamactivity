import { createClient } from "@supabase/supabase-js";
import { appConfig, isSupabaseConfigured } from "../config";

export const supabase = isSupabaseConfigured()
  ? createClient(appConfig.supabaseUrl, appConfig.supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
