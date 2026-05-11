import { redirect } from 'next/navigation';

// /accelerator redirects straight to the dashboard.
// The dashboard renders role-appropriate content.
export default function AcceleratorRoot() {
  redirect('/accelerator/dashboard');
}
