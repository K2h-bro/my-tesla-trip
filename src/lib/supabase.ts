import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uskodoypbforopkvphbi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SmOtlTXyOIoOBdSe6Zg4uA_9XmboZ44";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
