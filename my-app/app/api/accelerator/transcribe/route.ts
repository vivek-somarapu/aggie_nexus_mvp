import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile) return NextResponse.json({ error: 'No accelerator profile' }, { status: 403 });

  const formData = await request.formData();
  const audioFile = formData.get('audio') as File | null;
  if (!audioFile) {
    return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
  }

  const groqForm = new FormData();
  groqForm.append('file', audioFile, 'audio.webm');
  groqForm.append('model', 'whisper-large-v3');
  groqForm.append('response_format', 'json');

  const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: groqForm,
  });

  if (!groqResponse.ok) {
    const errorData = await groqResponse.json().catch(() => ({}));
    return NextResponse.json(
      { error: (errorData as { error?: { message?: string } }).error?.message ?? 'Transcription failed' },
      { status: 500 }
    );
  }

  const { text } = await groqResponse.json() as { text: string };
  return NextResponse.json({ transcript: text });
}
