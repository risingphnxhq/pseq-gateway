import { createClient } from '@supabase/supabase-js';
// Publishable key only. Customer authorization is enforced by PostgREST JWT + database guards.
window.PBSAccountClient=createClient('https://oyjmpbuxvfxusmbouldi.supabase.co','sb_publishable_rwTE4QRlQkzr0R0f5t5ylA_a9zuj0eE',{auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:false}});
