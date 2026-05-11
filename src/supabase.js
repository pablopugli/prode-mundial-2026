import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nrtptneuxuegwmvjmsbh.supabase.co'
const SUPABASE_KEY = 'sb_publishable_FoA1G1WIeMcZrJPuto-odw_4Gxdv0Gp'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
