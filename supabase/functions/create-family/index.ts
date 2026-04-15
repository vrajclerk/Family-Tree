import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"

// serve is provided by Supabase Edge Function runtime
declare const serve: (handler: (req: Request) => Promise<Response>) => void

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, description, password, userId } = await req.json()

    // Validate input
    if (!name || !description || !password || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Hash password server-side
    const hashedPassword = await bcrypt.hash(password, 10)

    // Use Supabase Admin SDK to create family with RLS bypass
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration')
    }

    // Create family
    const familyRes = await fetch(`${supabaseUrl}/rest/v1/families`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        name,
        description,
        owner_user_id: userId,
        owner_password_hash: hashedPassword,
      }),
    })

    if (!familyRes.ok) {
      throw new Error(`Failed to create family: ${familyRes.statusText}`)
    }

    const familyData = await familyRes.json()
    const family = Array.isArray(familyData) ? familyData[0] : familyData

    // Create owner membership
    const membershipRes = await fetch(`${supabaseUrl}/rest/v1/family_memberships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        family_id: family.id,
        user_id: userId,
        role: 'owner',
        accepted: true,
      }),
    })

    if (!membershipRes.ok) {
      throw new Error(`Failed to create membership: ${membershipRes.statusText}`)
    }

    return new Response(
      JSON.stringify({ family_id: family.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
