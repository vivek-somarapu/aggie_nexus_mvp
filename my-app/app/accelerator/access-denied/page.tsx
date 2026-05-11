import Link from 'next/link';

// Shown when an authenticated user has no accel_profiles record
// or has been deactivated. Not a generic 404 — it is specific to
// the invite-only access model of the accelerator platform.
export default function AcceleratorAccessDenied() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-6 text-center">
      <div className="max-w-md">
        <p className="mb-2 text-xs font-mono uppercase tracking-widest text-neutral-500">
          AggieX Accelerator
        </p>

        <h1 className="mb-4 text-2xl font-semibold text-neutral-100">
          Access not granted
        </h1>

        <p className="mb-8 text-sm text-neutral-400 leading-relaxed">
          This platform is invitation-only. If you believe you should have access,
          contact the AggieX program team to request an invite.
        </p>

        <Link
          href="/"
          className="inline-block rounded-md bg-neutral-800 px-5 py-2.5 text-sm text-neutral-200 transition-colors hover:bg-neutral-700"
        >
          Return to aggiex.org
        </Link>
      </div>
    </div>
  );
}
