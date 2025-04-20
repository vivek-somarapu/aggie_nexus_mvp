"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight, Users, Lightbulb, Building, ArrowUpRight, ChevronRight, CheckCircle2, Star, BarChart, Award, MessageCircle } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default function Home() {
  const { user, isLoading } = useAuth()
  const searchParams = useSearchParams()
  const authError = searchParams?.get('auth_error')
  const [showError, setShowError] = useState(false)
  
  // Handle auth errors from callback
  useEffect(() => {
    if (authError) {
      setShowError(true)
      const timeout = setTimeout(() => setShowError(false), 5000)
      return () => clearTimeout(timeout)
    }
  }, [authError])

  // Simple loading state handled by client layout
  if (isLoading) {
    return <Skeleton className="h-[400px] w-full rounded-xl" />
  }

  // Not logged in - show original simple landing page
  if (!user) {
    return (
      <LandingPage />
    )
      
  }

  // Logged in - show enhanced dashboard with the professional content
  return (
    <div>
      <section className="relative">
        {/* Hero Background */}
        <div className="absolute inset-0 bg-background/5 to-transparent -z-10" />

        {/* Hero Section */}
        <section className="container flex-1 flex flex-col items-center justify-center py-16 md:py-24 text-center">
          <div className="space-y-6 max-w-3xl">
            <Badge className="bg-primary text-primary-foreground hover:bg-primary/90 border-none px-4 py-2 text-sm mb-4">
              Connecting Innovators at Texas A&M and Beyond
            </Badge>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Where Ideas Find Their Team
            </h1>
            <p className="mx-auto max-w-[800px] text-muted-foreground md:text-xl">
              Aggie Nexus is the premier platform connecting entrepreneurs, builders, and investors to transform innovative ideas into successful ventures.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Button size="lg" asChild>
              <Link href="/projects">
                Explore Projects
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
            >
              <Link href="/projects/new">
                Start a Project
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 mt-16 w-full max-w-4xl">
            <div className="flex flex-col items-center space-y-1 p-4">
              <div className="text-3xl md:text-4xl font-bold">500+</div>
              <div className="text-sm text-muted-foreground">Active Projects</div>
            </div>
            <div className="flex flex-col items-center space-y-1 p-4">
              <div className="text-3xl md:text-4xl font-bold">2.5K</div>
              <div className="text-sm text-muted-foreground">Community Members</div>
            </div>
            <div className="flex flex-col items-center space-y-1 p-4">
              <div className="text-3xl md:text-4xl font-bold">150+</div>
              <div className="text-sm text-muted-foreground">Successful Ventures</div>
            </div>
            <div className="flex flex-col items-center space-y-1 p-4">
              <div className="text-3xl md:text-4xl font-bold">$2.4M</div>
              <div className="text-sm text-muted-foreground">Investment Secured</div>
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="bg-muted/50 py-20">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How Aggie Nexus Works</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Our platform streamlines the journey from concept to creation, connecting the right people at the right time.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Lightbulb className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Post Your Project</h3>
                <p className="text-muted-foreground">
                  Share your vision, specify what resources you need, and set clear goals to attract the right collaborators.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Build Your Team</h3>
                <p className="text-muted-foreground">
                  Connect with developers, designers, marketers, and investors who align with your project's needs and vision.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <BarChart className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Grow Together</h3>
                <p className="text-muted-foreground">
                  Track progress, share updates, and celebrate milestones as your project develops from concept to reality.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Feature Preview Section */}
        <section className="py-20 container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Platform Features</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Designed to facilitate every stage of your entrepreneurial journey
            </p>
          </div>
          
          <Tabs defaultValue="projects" className="w-full max-w-4xl mx-auto">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="networking">Networking</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>
            
            <TabsContent value="projects" className="border rounded-lg p-6">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-semibold mb-4">Project Management</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Create detailed project listings with specific requirements</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Manage team recruitment and role assignments</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Track project milestones and progress</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Filter projects by industry, skills needed, and stage</span>
                    </li>
                  </ul>
                  <Button className="mt-6" asChild>
                    <Link href="/projects/new">
                      Start a Project
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="bg-muted rounded-lg p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">FinTech Network</h4>
                      <Badge className="bg-muted text-foreground">Idea Phase</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Creating a platform for financial technology professionals to connect, share resources, and collaborate on innovative solutions.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Finance</Badge>
                      <Badge variant="outline">Technology</Badge>
                      <Badge variant="outline">Networking</Badge>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <div className="flex -space-x-2">
                        <Avatar className="h-8 w-8 border-2 border-background">
                          <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                        <Avatar className="h-8 w-8 border-2 border-background">
                          <AvatarFallback>AL</AvatarFallback>
                        </Avatar>
                      </div>
                      <span className="text-xs text-muted-foreground">Recruiting team members</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="networking" className="border rounded-lg p-6">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-semibold mb-4">Connection & Collaboration</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Find partners and team members with complementary skills</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Direct messaging with potential collaborators</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Specialized Texas A&M community connections</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Industry-specific networking opportunities</span>
                    </li>
                  </ul>
                  <Button className="mt-6" asChild>
                    <Link href="/users">
                      Connect Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="bg-muted rounded-lg p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>SR</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">Sarah Rodriguez</h4>
                        <p className="text-xs text-muted-foreground">Full-Stack Developer</p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      "I connected with my co-founder through Aggie Nexus. Our complementary skills in technology and business have been key to our startup's growth."
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">React</Badge>
                      <Badge variant="secondary">Node.js</Badge>
                      <Badge variant="secondary">UX Design</Badge>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4" />
                      <Star className="h-4 w-4" />
                      <Star className="h-4 w-4" />
                      <Star className="h-4 w-4" />
                      <Star className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="resources" className="border rounded-lg p-6">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-semibold mb-4">Startup Resources</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Access to funding opportunities and investor connections</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Mentorship from experienced entrepreneurs</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Legal and business development resources</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Texas A&M entrepreneurship program integration</span>
                    </li>
                  </ul>
                  <Button className="mt-6" asChild>
                    <Link href="/projects">
                      Explore Resources
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="bg-muted rounded-lg p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Award className="h-6 w-6" />
                      <h4 className="font-medium">Funding Success Story</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      AgTech Solutions secured $500K in seed funding after connecting with investors through our platform. Their agricultural technology is now being implemented across Texas.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Time to funding</span>
                        <span className="font-medium">6 months</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Team size</span>
                        <span className="font-medium">5 members</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Industry</span>
                        <span className="font-medium">Agriculture</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Current status</span>
                        <span className="font-medium">Series A</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </section>
        
        {/* Testimonials Section */}
        <section className="bg-muted/50 py-20">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Success Stories</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Hear from entrepreneurs who've achieved their goals through Aggie Nexus
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-background">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">James Donovan</p>
                      <p className="text-sm text-muted-foreground">CEO, TechFlow</p>
                    </div>
                  </div>
                  <div className="flex mb-4">
                    <Star className="h-4 w-4" />
                    <Star className="h-4 w-4" />
                    <Star className="h-4 w-4" />
                    <Star className="h-4 w-4" />
                    <Star className="h-4 w-4" />
                  </div>
                  <p className="text-muted-foreground">
                    "Aggie Nexus connected me with the technical co-founder I needed to turn my idea into reality. Six months later, we closed our first funding round and are now serving clients across three states."
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-background">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>ML</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Maria Liang</p>
                      <p className="text-sm text-muted-foreground">Founder, EcoSolutions</p>
                    </div>
                  </div>
                  <div className="flex mb-4">
                    <Star className="h-4 w-4" />
                    <Star className="h-4 w-4" />
                    <Star className="h-4 w-4" />
                    <Star className="h-4 w-4" />
                    <Star className="h-4 w-4" />
                  </div>
                  <p className="text-muted-foreground">
                    "As a student entrepreneur, I found it challenging to build a team outside my immediate circle. Aggie Nexus helped me find talented partners who shared my vision for sustainable business practices."
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-background">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>KJ</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Kevin Johnson</p>
                      <p className="text-sm text-muted-foreground">Angel Investor</p>
                    </div>
                  </div>
                  <div className="flex mb-4">
                    <Star className="h-4 w-4" />
                    <Star className="h-4 w-4" />
                    <Star className="h-4 w-4" />
                    <Star className="h-4 w-4" />
                    <Star className="opacity-30 h-4 w-4" />
                  </div>
                  <p className="text-muted-foreground">
                    "I've invested in three startups I discovered through Aggie Nexus. The platform's quality filtering saves me time by connecting me with serious founders who have well-thought-out business plans."
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="container py-20">
          <div className="relative rounded-2xl bg-card text-foreground border px-6 py-16">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Ready to bring your idea to life?</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Connect with the talent, resources, and funding you need to succeed.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/projects/new">
                    Start a Project
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/projects">
                    Browse Projects
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="container py-8 text-center dark:text-white/60 text-muted-foreground border-t">
          <div className="flex items-center justify-center gap-4 mb-2">
            <Link href="/about" className="text-sm hover:underline">About</Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/terms" className="text-sm hover:underline">Terms</Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/privacy" className="text-sm hover:underline">Privacy</Link>
          </div>
          <p className="text-sm">© 2025 Aggie Nexus. All rights reserved.</p>
        </div>
      </section>
    </div>
  )
}

