import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AiAdvisorChat from './components/ai-advisor-chat';

export default async function AiAdvisorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/accelerator/access-denied');

  return <AiAdvisorChat role={profile.role} userName={profile.full_name} />;
}
