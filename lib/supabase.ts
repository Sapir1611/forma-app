import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://smpsemgclgioahzwqspd.supabase.co";

const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtcHNlbWdjbGdpb2Foendxc3BkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODU2NDAsImV4cCI6MjA5MTY2MTY0MH0.8tdc2SCjva7neNc6FnMb-3UZoSvxAgmPLsU4uQtzhAw";

export const supabase = createClient(supabaseUrl, supabaseKey);