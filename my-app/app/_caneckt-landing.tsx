'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { checkAccelAccess } from './actions/check-accel-access';

const signInSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type SignInFormValues = z.infer<typeof signInSchema>;

const ACCESS_DENIED_MESSAGES: Record<string, string> = {
  not_found:
    "You don't have access to Caneckt. If you believe this is an error, contact the AggieX program team.",
  not_active:
    "Your Caneckt account is currently inactive. Contact the AggieX program team for assistance.",
  unauthenticated:
    'Authentication failed. Please try again.',
};

export default function CanecktLandingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
  });

  const handleSignIn = async ({ email, password }: SignInFormValues) => {
    setIsSubmitting(true);
    setAccessError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        {/* AggieX Logo */}
        <div className="mb-8">
          <Image
            src="/images/AggieX_LogoLight.png"
            alt="AggieX"
            width={160}
            height={52}
            className="object-contain"
            priority
          />
        </div>

        {/* Product name */}
        <h1
          className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white mb-3"
          style={{ fontFamily: 'var(--font-montserrat, Inter, sans-serif)' }}
        >
          Caneckt
        </h1>

        <p className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-10">
          AggieX Accelerator Platform
        </p>

        {/* Intro copy */}
        <div className="max-w-lg text-center mb-12 space-y-3">
          <p className="text-neutral-300 leading-relaxed">
            Caneckt is the accelerator operations platform built for the{' '}
            <span className="text-white font-medium">AggieX Summer 2026 Accelerator</span>.
            Manage deliverables, track traction, and communicate across founders, mentors,
            and program staff — all in one place.
          </p>
          <p className="text-neutral-500 text-sm leading-relaxed">
            This is a pilot of AggieX&apos;s accelerator software capabilities.
            Access is by invitation only.
          </p>
        </div>

        {/* Sign-in card */}
        <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-xl p-8">
          <h2 className="text-lg font-semibold text-white mb-1">Sign in</h2>
          <p className="text-sm text-neutral-400 mb-6">
            Use your AggieX account credentials.
          </p>

          {accessError && (
            <Alert variant="destructive" className="mb-5 bg-red-950/50 border-red-800 text-red-300">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">{accessError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(handleSignIn)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-neutral-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@tamu.edu"
                autoComplete="email"
                {...register('email')}
                className={`bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-neutral-500 ${
                  errors.email ? 'border-red-600' : ''
                }`}
              />
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-neutral-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
                className={`bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-neutral-500 ${
                  errors.password ? 'border-red-600' : ''
                }`}
              />
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white text-black hover:bg-neutral-100 font-semibold mt-2"
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
          </form>

          <p className="mt-5 text-center text-xs text-neutral-600">
            Forgot your password?{' '}
            <a
              href="/auth/forgot-password"
              className="text-neutral-400 hover:text-neutral-200 underline underline-offset-2"
            >
              Reset it here
            </a>
          </p>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="py-6 text-center border-t border-neutral-900">
        <p className="text-xs text-neutral-700">A Zachary Nowroozi Production</p>
      </footer>
    </div>
  );
}
