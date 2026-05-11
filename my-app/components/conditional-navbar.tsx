'use client';

import { usePathname } from 'next/navigation';
import Navbar from './navbar';

// The accelerator platform has its own sidebar layout and must not
// render the main site Navbar — it triggers inquiry queries that
// have nothing to do with the accelerator and clutter the DB logs.
export default function ConditionalNavbar() {
  const pathname = usePathname();

  if (pathname.startsWith('/accelerator')) return null;

  return <Navbar />;
}
