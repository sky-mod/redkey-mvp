import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

export async function POST(req: NextRequest) {
  const { role } = await req.json();
  // Zapisz w DB: user role → unlock tools
  await supabase.from('users').insert({ role, verified: true, expires: new Date(Date.now() + 30*24*60*60*1000).toISOString() });
  return new Response('Unlocked');
}
