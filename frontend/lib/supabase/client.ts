import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://eplovmcsgbisjihmdfba.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_FIUdSnIt2SHIOVCaDIUxeA_dz33sicj";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabasePublishableKey);

