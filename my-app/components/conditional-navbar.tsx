'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from './navbar';

// The accelerator platform has its own sidebar layout and must not
// render the main site Navbar — it triggers inquiry queries that
// have nothing to do with the accelerator and clutter the DB logs.
// The Caneckt landing page (accelerator subdomain root) also omits
// the navbar — it has its own full-screen design.
export default function ConditionalNavbar() {
  const pathname = usePathname();
  const [isAcceleratorSubdomain, setIsAcceleratorSubdomain] = useState(false);

  useEffect(() => {
    setIsAcceleratorSubdomain(window.location.hostname.includes('accelerator'));
  }, []);

  if (pathname.startsWith('/accelerator')) return null;
  if (isAcceleratorSubdomain) return null;

  return <Navbar />;
}
