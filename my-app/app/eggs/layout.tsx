/**
 * AggieX Easter Egg Hunt 2026
 * Eggs section layout: renders a full-screen overlay so the global Navbar
 * and site chrome are hidden behind the immersive egg experience.
 *
 * Egg tiers: Common (225) · Epic (20) · Legendary (4)
 * Token-gated: each QR code contains a unique single-use token
 */

export default function EggsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        overflowY: 'auto',
      }}
    >
      {children}
    </div>
  );
}
