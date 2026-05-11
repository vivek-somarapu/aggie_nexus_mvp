import { headers } from 'next/headers';
import HomeClientPage from './_home-client';
import CanecktLandingPage from './_caneckt-landing';

// Serve the Caneckt accelerator landing on accelerator.aggiex.org,
// and the main AggieX home page everywhere else.
//
// Detection order:
//  1. NEXT_PUBLIC_IS_ACCELERATOR env var (set to "true" on Render)
//  2. Host header fallback (works when accessed directly, may be
//     stripped by some reverse-proxy configurations)
export default async function RootPage() {
  const isAcceleratorEnv = process.env.NEXT_PUBLIC_IS_ACCELERATOR === 'true';

  const headersList = await headers();
  const host = headersList.get('host') ?? '';
  const isAcceleratorHost = host.includes('accelerator');

  if (isAcceleratorEnv || isAcceleratorHost) {
    return <CanecktLandingPage />;
  }

  return <HomeClientPage />;
}
