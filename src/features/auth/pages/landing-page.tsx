import { zodResolver } from '@hookform/resolvers/zod'
import { Coffee, Gift, ShieldCheck, LogOut } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'
import { authSchema, type AuthFormValues } from '@/types/forms'

const defaultValues: AuthFormValues = {
  fullName: '',
  email: '',
  password: '',
  role: 'customer',
}

export function LandingPage() {
  const { signIn, signUp, signOut } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const signInForm = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      ...defaultValues,
      email: 'ava@cafecliche.co',
    },
  })

  const signUpForm = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues,
  })

  return (
    <div className="relative min-h-screen px-4 py-8 md:px-8 lg:px-12 bg-surface">
      {/* Emergency Logout for stuck sessions */}
      <div className="absolute top-4 right-8 z-50">
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-full bg-white text-on-surface-variant hover:text-error hover:border-error"
          onClick={async () => {
            try {
              setError(null)
              await signOut()
              window.location.reload()
            } catch (err) {
              console.error('Logout failed:', err)
            }
          }}
        >
          <LogOut className="size-4 mr-2" />
          Troubleshoot: Force Logout
        </Button>
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-7xl gap-12 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="relative overflow-hidden rounded-[3rem] bg-primary px-8 py-16 md:px-16 md:py-24 text-white shadow-card flex flex-col justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)] opacity-50" />

          <div className="relative z-10 space-y-12">
            <Badge variant="accent" className="bg-white/10 text-white border-white/20 px-6 py-2">
              Rewards Program
            </Badge>
            <div className="max-w-3xl space-y-8">
              <h1 className="font-serif text-6xl tracking-tight leading-[0.95] md:text-8xl">
                Cafe Cliche.<br/>
                Every visit<br/>
                counts.
              </h1>
              <p className="max-w-xl text-xl font-medium leading-relaxed text-white/85">
                Earn points on every purchase. Redeem them for drinks, pastries, merch, and more.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              {[
                {
                  icon: Coffee,
                  title: 'Track',
                  body: 'See your points, tier, and activity at a glance.',
                },
                {
                  icon: Gift,
                  title: 'Earn',
                  body: 'Get rewarded every time you visit.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Manage',
                  body: 'Staff tools for rewards and members.',
                },
              ].map((item) => (
                <div key={item.title} className="group space-y-4">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-white/5 text-secondary-container transition-all group-hover:bg-white/10">
                    <item.icon className="size-6" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl text-white">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-white/80">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error ? <p className="relative z-10 mt-8 text-sm font-bold text-red-300">{error}</p> : null}
        </section>

        <section className="flex flex-col justify-center py-12">
          <Tabs defaultValue="signin" className="w-full space-y-10">
            <div className="flex justify-center">
              <TabsList className="w-full max-w-md">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Register</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="signin" className="outline-none">
              <div className="space-y-10">
                <div className="space-y-2 text-center">
                  <h2 className="font-serif text-4xl tracking-tight text-primary">
                    Welcome Back
                  </h2>
                  <p className="text-sm font-medium text-on-surface-variant/80">
                    Sign in to check your balance and redeem rewards.
                  </p>
                </div>

                <div className="mx-auto max-w-md rounded-[2.5rem] bg-surface-low p-10 border border-outline-variant/10">
                  <form
                    className="space-y-8"
                    onSubmit={signInForm.handleSubmit(async (values) => {
                      try {
                        setError(null)
                        await signIn(values)
                      } catch (submissionError) {
                        setError(
                          submissionError instanceof Error
                            ? submissionError.message
                            : 'Unable to sign in.',
                        )
                      }
                    })}
                  >
                    <div className="grid gap-3">
                      <Label htmlFor="signin-email">Email Address</Label>
                      <Input id="signin-email" placeholder="ava@cafecliche.co" {...signInForm.register('email')} />
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input id="signin-password" type="password" placeholder="••••••••" {...signInForm.register('password')} />
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="signin-role">Access Role</Label>
                      <Controller
                        control={signInForm.control}
                        name="role"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="signin-role" className="rounded-xl h-12">
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="customer">Customer</SelectItem>
                              <SelectItem value="business-owner">Business Owner</SelectItem>
                              <SelectItem value="platform-admin">Platform Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    {error ? <p className="text-sm font-bold text-red-500 text-center">{error}</p> : null}

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full rounded-full h-14 font-bold tracking-wide"
                      disabled={signInForm.formState.isSubmitting}
                    >
                      {signInForm.formState.isSubmitting ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="signup" className="outline-none">
              <div className="space-y-10">
                <div className="space-y-2 text-center">
                  <h2 className="font-serif text-4xl tracking-tight text-primary">
                    Create Account
                  </h2>
                  <p className="text-sm font-medium text-on-surface-variant/80">
                    Join the rewards program and start earning.
                  </p>
                </div>

                <div className="mx-auto max-w-md rounded-[2.5rem] bg-surface-low p-10 border border-outline-variant/10">
                  <form
                    className="space-y-8"
                    onSubmit={signUpForm.handleSubmit(async (values) => {
                      try {
                        setError(null)
                        await signUp(values)
                      } catch (submissionError) {
                        setError(
                          submissionError instanceof Error
                            ? submissionError.message
                            : 'Unable to create the account.',
                        )
                      }
                    })}
                  >
                    <div className="grid gap-3">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input id="signup-name" placeholder="Your name" {...signUpForm.register('fullName')} />
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="signup-email">Email Address</Label>
                      <Input id="signup-email" placeholder="you@example.com" {...signUpForm.register('email')} />
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input id="signup-password" type="password" placeholder="••••••••" {...signUpForm.register('password')} />
                    </div>

                    <div className="grid gap-3">
                      <Label htmlFor="signup-role">Access Role</Label>
                      <Input id="signup-role" value="Customer" disabled />
                      <p className="text-xs text-on-surface-variant/75">
                        Self-registration creates customer accounts only. Staff roles must be assigned in Supabase.
                      </p>
                    </div>

                    {error ? <p className="text-sm font-bold text-red-500 text-center">{error}</p> : null}

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full rounded-full h-14 font-bold tracking-wide"
                      disabled={signUpForm.formState.isSubmitting}
                    >
                      {signUpForm.formState.isSubmitting ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  )
}
