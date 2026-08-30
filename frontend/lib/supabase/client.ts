import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

if (!supabaseUrl || !supabasePublishableKey) {
  if (typeof window !== "undefined") {
    console.warn(
      "Supabase URL or Publishable Key is missing in environment variables. Check frontend/.env.local"
    );
  }
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
