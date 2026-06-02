import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ApiKeyPanel from './components/api-key-panel';

export default async function DeveloperPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'founder') redirect('/accelerator/dashboard');

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-neutral-500">My Team</p>
        <h1 className="mt-1 text-xl font-semibold text-neutral-100">Developer API</h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          Use API keys to connect Claude Code, Cursor, or other coding agents to AggieX.
        </p>
      </div>

      <section className="mb-10">
        <h2 className="mb-1 text-sm font-medium text-neutral-200">MCP Server Setup</h2>
        <p className="mb-3 text-xs text-neutral-500">
          Add the AggieX MCP server to your coding agent so it can submit deliverables and log
          traction automatically while you work.
        </p>
        <div className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-4 font-mono text-xs text-neutral-300">
          <p className="mb-2 text-neutral-600">{'// .claude/settings.json'}</p>
          <pre className="whitespace-pre-wrap">{`{
  "mcpServers": {
    "aggiex": {
      "command": "npx",
      "args": ["-y", "aggiex-mcp"],
      "env": {
        "AGGIEX_API_KEY": "ak_your_key_here",
        "AGGIEX_BASE_URL": "https://caneckt.aggiex.org"
      }
    }
  }
}`}</pre>
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-medium text-neutral-200">API Keys</h2>
        <p className="mb-4 text-xs text-neutral-500">
          Keys are shown once when generated. Store them securely — they cannot be retrieved again.
        </p>
        <ApiKeyPanel />
      </section>
    </div>
  );
}
