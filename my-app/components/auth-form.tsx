"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"

type FormType = "login" | "signup" | "forgotPassword" | "resetPassword"

interface AuthFormProps {
  type: FormType
  onSubmit: (data: any) => Promise<void>
  loading: boolean
  error: string | null
  onOAuthLogin?: (provider: "google" | "github") => Promise<void>
}

export function AuthForm({ type, onSubmit, loading, error, onOAuthLogin }: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  
  // Define form schema based on form type
  let formSchema: any
  
  if (type === "login") {
    formSchema = z.object({
      email: z.string().email({ message: "Please enter a valid email address" }),
      password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    })
  } else if (type === "signup") {
    formSchema = z.object({
      fullName: z.string().min(2, { message: "Full name must be at least 2 characters" }),
      email: z.string().email({ message: "Please enter a valid email address" }),
      password: z.string().min(6, { message: "Password must be at least 6 characters" }),
      confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
    }).refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    })
  } else if (type === "forgotPassword") {
    formSchema = z.object({
      email: z.string().email({ message: "Please enter a valid email address" }),
    })
  } else {
    formSchema = z.object({
      password: z.string().min(6, { message: "Password must be at least 6 characters" }),
      confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
    }).refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    })
  }
  
  const { register, handleSubmit, formState: { errors } } = useForm<any>({
    resolver: zodResolver(formSchema),
  })

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {type === "login" && "Log in to your account"}
          {type === "signup" && "Create an account"}
          {type === "forgotPassword" && "Reset your password"}
          {type === "resetPassword" && "Set new password"}
        </CardTitle>
        <CardDescription>
          {type === "login" && "Enter your credentials to access your account"}
          {type === "signup" && "Fill in your details to create a new account"}
          {type === "forgotPassword" && "We'll send you a link to reset your password"}
          {type === "resetPassword" && "Enter your new password below"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name Field (Signup only) */}
          {type === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                {...register("fullName")}
                className={errors.fullName ? "border-red-500" : ""}
              />
              {errors.fullName && (
                <p className="text-sm text-red-500">
                  {typeof errors.fullName.message === 'string' 
                    ? errors.fullName.message 
                    : 'Invalid full name'}
                </p>
              )}
            </div>
          )}

          {/* Email Field (Login, Signup, ForgotPassword) */}
          {(type === "login" || type === "signup" || type === "forgotPassword") && (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">
                  {typeof errors.email.message === 'string' 
                    ? errors.email.message 
                    : 'Invalid email'}
                </p>
              )}
            </div>
          )}

          {/* Password Field (Login, Signup, ResetPassword) */}
          {(type === "login" || type === "signup" || type === "resetPassword") && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                {type === "login" && (
                  <a href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </a>
                )}
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-sm text-red-500">
                  {typeof errors.password.message === 'string' 
                    ? errors.password.message 
                    : 'Invalid password'}
                </p>
              )}
            </div>
          )}

          {/* Confirm Password Field (Signup, ResetPassword) */}
          {(type === "signup" || type === "resetPassword") && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("confirmPassword")}
                className={errors.confirmPassword ? "border-red-500" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {typeof errors.confirmPassword.message === 'string' 
                    ? errors.confirmPassword.message 
                    : 'Passwords do not match'}
                </p>
              )}
            </div>
          )}

          {/* Show Password Toggle */}
          {(type === "login" || type === "signup" || type === "resetPassword") && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showPassword"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="showPassword" className="text-sm font-normal">
                Show password
              </Label>
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {type === "login" && "Log in"}
            {type === "signup" && "Sign up"}
            {type === "forgotPassword" && "Send reset link"}
            {type === "resetPassword" && "Reset password"}
          </Button>
        </form>

        {/* OAuth Buttons (Login, Signup) */}
        {(type === "login" || type === "signup") && onOAuthLogin && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button variant="outline" type="button" onClick={() => onOAuthLogin("google")} disabled={loading}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
                Google
              </Button>
              <Button variant="outline" type="button" onClick={() => onOAuthLogin("github")} disabled={loading}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"
                    fill="currentColor"
                  />
                </svg>
                GitHub
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        {type === "login" && (
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <a href="/auth/signup" className="text-primary hover:underline">
              Sign up
            </a>
          </p>
        )}
        {type === "signup" && (
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/auth/login" className="text-primary hover:underline">
              Log in
            </a>
          </p>
        )}
        {type === "forgotPassword" && (
          <p className="text-sm text-muted-foreground">
            Remember your password?{" "}
            <a href="/auth/login" className="text-primary hover:underline">
              Log in
            </a>
          </p>
        )}
      </CardFooter>
    </Card>
  )
}

