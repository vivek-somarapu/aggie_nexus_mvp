'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Space_Grotesk } from 'next/font/google';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { checkAccelAccess } from './actions/check-accel-access';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-space-grotesk',
});

const signInSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type SignInFormValues = z.infer<typeof signInSchema>;

const ACCESS_DENIED_MESSAGES: Record<string, string> = {
  not_found:
    "You don't have access to Caneckt. Contact the AggieX program team to request an invite.",
  not_active:
    'Your Caneckt account is currently inactive. Contact the AggieX program team.',
  unauthenticated: 'Authentication failed. Please try again.',
};

// ─────────────────────────────────────────────
// Three orbital rings matching AggieX brand colors.
// Each ring has a satellite node that rides along
// as the parent rotates — giving a "live orbit" feel.
// ─────────────────────────────────────────────
function OrbitalRings() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Soft radial glow behind all rings */}
      <div
        className="absolute"
        style={{
          width: 700,
          height: 700,
          top: '50%',
          left: '35%',
          transform: 'translate(-50%, -50%)',
          background:
            'radial-gradient(circle, rgba(45,41,221,0.10) 0%, rgba(96,0,0,0.08) 45%, transparent 72%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Blue ring — top of logo triangle */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 500,
          height: 500,
          top: '50%',
          left: '35%',
          marginTop: -340,
          marginLeft: -250,
          border: '1.5px solid rgba(45, 41, 221, 0.45)',
          boxShadow: '0 0 30px rgba(45,41,221,0.20), 0 0 80px rgba(45,41,221,0.08)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        <div
          className="absolute rounded-full"
          style={{
            width: 8,
            height: 8,
            top: -4,
            left: '50%',
            marginLeft: -4,
            background: '#4f4bff',
            boxShadow: '0 0 6px rgba(79,75,255,0.9), 0 0 18px rgba(79,75,255,0.5)',
          }}
        />
      </motion.div>

      {/* Maroon ring — bottom-left of logo triangle */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 450,
          height: 450,
          top: '50%',
          left: '35%',
          marginTop: -145,
          marginLeft: -370,
          border: '1.5px solid rgba(140, 0, 0, 0.50)',
          boxShadow: '0 0 30px rgba(140,0,0,0.22), 0 0 80px rgba(96,0,0,0.08)',
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
      >
        <div
          className="absolute rounded-full"
          style={{
            width: 7,
            height: 7,
            top: -3.5,
            left: '50%',
            marginLeft: -3.5,
            background: '#cc1111',
            boxShadow: '0 0 6px rgba(204,17,17,0.9), 0 0 18px rgba(204,17,17,0.5)',
          }}
        />
      </motion.div>

      {/* Green ring — bottom-right of logo triangle */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 420,
          height: 420,
          top: '50%',
          left: '35%',
          marginTop: -115,
          marginLeft: -80,
          border: '1px solid rgba(41, 221, 108, 0.32)',
          boxShadow: '0 0 25px rgba(41,221,108,0.15), 0 0 70px rgba(41,221,108,0.06)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <div
          className="absolute rounded-full"
          style={{
            width: 7,
            height: 7,
            top: -3.5,
            left: '50%',
            marginLeft: -3.5,
            background: '#29dd6c',
            boxShadow: '0 0 6px rgba(41,221,108,0.9), 0 0 18px rgba(41,221,108,0.5)',
          }}
        />
      </motion.div>
    </div>
  );
}

export default function CanecktLandingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<'google' | 'github' | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
  });

  const handleOAuthSignIn = (provider: 'google' | 'github') => {
    setIsOAuthLoading(provider);
    setAccessError(null);
    // Navigate to the server-side OAuth route. The server initiates the OAuth
    // flow and stores the PKCE verifier in server-controlled cookies (scoped to
    // .aggiex.org), eliminating the cross-domain verifier mismatch that occurs
    // when the browser stores it client-side on a different subdomain.
    window.location.href = `/auth/oauth?provider=${provider}`;
  };

  const handleSignIn = async ({ email, password }: SignInFormValues) => {
    setIsSubmitting(true);
    setAccessError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setAccessError('Invalid email or password. Please try again.');
      setIsSubmitting(false);
      return;
    }

    const result = await checkAccelAccess();

    if (!result.hasAccess) {
      await supabase.auth.signOut();
      setAccessError(ACCESS_DENIED_MESSAGES[result.reason]);
      setIsSubmitting(false);
      return;
    }

    router.push('/accelerator/dashboard');
  };

  return (
    <div
      className={`${spaceGrotesk.variable} relative min-h-screen flex flex-col overflow-x-hidden`}
      style={{
        background: '#030308',
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)',
        backgroundSize: '36px 36px',
      }}
    >
      <OrbitalRings />

      {/* ── Top bar ── */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center justify-between px-8 md:px-14 py-6"
      >
        <div className="relative w-24 sm:w-28 md:w-32 h-6 sm:h-7 md:h-8">
          <Image
            src="/images/AggieX_LogoLight.png"
            alt="AggieX"
            fill
            priority
            sizes="(max-width: 640px) 96px, (max-width: 768px) 112px, 128px"
            className="object-contain"
          />
        </div>
        <span className="hidden sm:inline text-[10px] tracking-[0.35em] font-mono uppercase text-neutral-700">
          Invite only · Summer 2026
        </span>
      </motion.header>

      {/* ── Two-column layout ── */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row">

        {/* Left: wordmark + descriptor */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-14 lg:px-20 xl:px-28 pt-8 pb-10 lg:py-0">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-[10px] font-mono tracking-[0.4em] uppercase text-neutral-600 mb-5"
          >
            AggieX Accelerator Platform
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.25 }}
            className="font-extrabold leading-none tracking-tighter mb-6"
            style={{
              fontFamily: 'var(--font-space-grotesk, sans-serif)',
              fontSize: 'clamp(2.5rem, 13vw, 10rem)',
              background: 'linear-gradient(145deg, #ffffff 0%, #c8c8d8 55%, #5a5a7a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Caneckt
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.4 }}
            className="text-neutral-400 text-base md:text-lg max-w-[38ch] leading-relaxed mb-10"
          >
            Accelerator operations software. Deliverables, traction, mentors,
            and program management — unified for the Summer 2026 cohort.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-wrap gap-8"
          >
            {[
              { label: 'Cohort', value: 'Summer 2026' },
              { label: 'Host', value: 'AggieX @ Texas A&M' },
              { label: 'Status', value: 'Pilot' },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="text-[9px] font-mono uppercase tracking-[0.35em] text-neutral-700">
                  {label}
                </span>
                <span className="text-sm text-neutral-300 font-medium">{value}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: sign-in panel */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-full lg:w-[440px] xl:w-[480px] flex items-center justify-center
            px-8 py-10 lg:py-0 lg:border-l lg:border-white/[0.05]"
          style={{
            background:
              'linear-gradient(160deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.01) 100%)',
          }}
        >
          <div className="w-full max-w-[340px]">
            <p className="text-[10px] font-mono tracking-[0.35em] uppercase text-neutral-600 mb-2">
              Sign in
            </p>
            <h2
              className="text-2xl font-bold text-white mb-1"
              style={{ fontFamily: 'var(--font-space-grotesk, sans-serif)' }}
            >
              Access your dashboard
            </h2>
            <p className="text-sm text-neutral-600 mb-8">
              Use your AggieX account credentials.
            </p>

            {accessError && (
              <Alert className="mb-6 bg-red-950/30 border border-red-900/40 rounded-xl">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <AlertDescription className="text-red-300 text-sm leading-snug">
                  {accessError}
                </AlertDescription>
              </Alert>
            )}

            {/* OAuth buttons */}
            <div className="space-y-2.5 mb-5">
              <Button
                type="button"
                onClick={() => handleOAuthSignIn('google')}
                disabled={isSubmitting || !!isOAuthLoading}
                className="w-full h-11 rounded-xl bg-white/[0.04] border border-white/[0.10]
                  text-neutral-200 hover:bg-white/[0.08] hover:border-white/[0.18]
                  font-medium tracking-wide transition-all active:scale-[0.98]
                  flex items-center justify-center gap-3"
              >
                {isOAuthLoading === 'google' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                Continue with Google
              </Button>

              <Button
                type="button"
                onClick={() => handleOAuthSignIn('github')}
                disabled={isSubmitting || !!isOAuthLoading}
                className="w-full h-11 rounded-xl bg-white/[0.04] border border-white/[0.10]
                  text-neutral-200 hover:bg-white/[0.08] hover:border-white/[0.18]
                  font-medium tracking-wide transition-all active:scale-[0.98]
                  flex items-center justify-center gap-3"
              >
                {isOAuthLoading === 'github' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-white" aria-hidden="true">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                )}
                Continue with GitHub
              </Button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-neutral-700">
                or sign in with email
              </span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            <form onSubmit={handleSubmit(handleSignIn)} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-[10px] font-mono uppercase tracking-[0.3em] text-neutral-600"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@tamu.edu"
                  autoComplete="email"
                  {...register('email')}
                  className={`h-11 rounded-xl bg-white/[0.04] border-white/[0.08]
                    text-white placeholder:text-neutral-700
                    focus-visible:ring-0 focus-visible:border-white/25
                    hover:border-white/15 transition-colors
                    ${errors.email ? 'border-red-900/60' : ''}`}
                />
                {errors.email && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-[10px] font-mono uppercase tracking-[0.3em] text-neutral-600"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password')}
                  className={`h-11 rounded-xl bg-white/[0.04] border-white/[0.08]
                    text-white placeholder:text-neutral-700
                    focus-visible:ring-0 focus-visible:border-white/25
                    hover:border-white/15 transition-colors
                    ${errors.password ? 'border-red-900/60' : ''}`}
                />
                {errors.password && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.password.message}</p>
                )}
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  disabled={isSubmitting || !!isOAuthLoading}
                  className="w-full h-11 rounded-xl bg-white text-black
                    hover:bg-neutral-100 font-semibold tracking-wide
                    transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    'Sign in to Caneckt'
                  )}
                </Button>
              </div>
            </form>

            <p className="mt-6 text-center text-xs text-neutral-700">
              Forgot password?{' '}
              <a
                href="/auth/forgot-password"
                className="text-neutral-500 hover:text-neutral-300 transition-colors underline underline-offset-2"
              >
                Reset it here
              </a>
            </p>

            <div className="mt-10 flex items-center gap-4">
              <div className="flex-1 h-px bg-white/[0.05]" />
              <Image
                src="/images/circles-logo.png"
                alt=""
                width={20}
                height={20}
                className="opacity-15 object-contain"
              />
              <div className="flex-1 h-px bg-white/[0.05]" />
            </div>
          </div>
        </motion.div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-5 px-8 md:px-14 flex items-center justify-between border-t border-white/[0.03]">
        <span className="text-[10px] font-mono text-neutral-400 tracking-widest uppercase">
          Caneckt · AggieX 2026
        </span>
        <span className="text-[10px] text-white tracking-neutral-400">
          A Zachary Nowroozi Production
        </span>
      </footer>
    </div>
  );
}
