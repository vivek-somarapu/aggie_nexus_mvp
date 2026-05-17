import { redirect } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/accel-admin';
import AiAdvisorChat from './components/ai-advisor-chat';

const fetchAdvisorProfile = unstable_cache(
  async (userId: string) => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('accel_profiles')
      .select('role, full_name')
      .eq('id', userId)
      .single();
    return data;
  },
  ['accel-advisor-profile'],
  { revalidate: 60, tags: ['accel-profile'] }
);

export default async function AiAdvisorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const profile = await fetchAdvisorProfile(user.id);
  if (!profile) redirect('/accelerator/access-denied');

  return <AiAdvisorChat role={profile.role} userName={profile.full_name} />;
}
