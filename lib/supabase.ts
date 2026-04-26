import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://smpsemgclgioahzwqspd.supabase.co";

const supabaseKey =
  "sb_publishable_lcrhEBoBFUnHizkcWceMPQ_oa_H94I0";

export const supabase = createClient(supabaseUrl, supabaseKey);