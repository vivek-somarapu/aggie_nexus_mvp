import { headers } from 'next/headers';
import HomeClientPage from './_home-client';
import CanecktLandingPage from './_caneckt-landing';

// Serve the Caneckt accelerator landing on accelerator.aggiex.org,
// and the main AggieX home page everywhere else.
export default async function RootPage() {
  const headersList = await headers();
  const host = headersList.get('host') ?? '';
  const isAcceleratorSubdomain = host.includes('accelerator');

  if (isAcceleratorSubdomain) {
    return <CanecktLandingPage />;
  }

  return <HomeClientPage />;
}
