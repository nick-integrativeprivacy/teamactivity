const clean = (value: string | undefined) => value?.trim() ?? "";

const env = import.meta.env;

export const appConfig = {
  supabaseUrl: clean(env.VITE_SUPABASE_URL),
  supabasePublishableKey: clean(env.VITE_SUPABASE_PUBLISHABLE_KEY),
};

export const isSupabaseConfigured = () =>
  Boolean(appConfig.supabaseUrl && appConfig.supabasePublishableKey);
