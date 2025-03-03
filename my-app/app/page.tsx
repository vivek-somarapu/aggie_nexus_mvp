import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight, Users, Lightbulb, Building, ArrowUpRight } from "lucide-react"

export default function Home() {
  return (
    <div>
      <section className="relative">
        {/* Hero Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent -z-10" />

        {/* Hero Content */}
        <div className="container flex flex-col items-center justify-center space-y-8 py-24 text-center">
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Connect, Build & Innovate Together
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Join a community of builders, funders, and innovators bringing ideas to life. Find your next project or
              the perfect team to make it happen.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/projects">
                Explore Projects
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/projects/new">
                Start a Project
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-12">
            <div className="flex flex-col items-center space-y-2 border rounded-lg px-4 py-8 bg-background/60">
              <div className="text-4xl font-bold">500+</div>
              <div className="text-sm text-muted-foreground">Active Projects</div>
            </div>
            <div className="flex flex-col items-center space-y-2 border rounded-lg px-4 py-8 bg-background/60">
              <div className="text-4xl font-bold">2.5K</div>
              <div className="text-sm text-muted-foreground">Community Members</div>
            </div>
            <div className="flex flex-col items-center space-y-2 border rounded-lg px-4 py-8 bg-background/60">
              <div className="text-4xl font-bold">150+</div>
              <div className="text-sm text-muted-foreground">Success Stories</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="relative group overflow-hidden">
            <CardHeader>
              <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 mb-4">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="group-hover:text-primary transition-colors">Ideas & Projects</CardTitle>
              <CardDescription>
                Browse through ideas and active projects looking for collaborators or funding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Find projects that match your skills
                </li>
                <li className="flex items-center">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Connect with project owners
                </li>
                <li className="flex items-center">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Track project progress
                </li>
              </ul>
              <Button
                variant="ghost"
                className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground"
                asChild
              >
                <Link href="/projects">
                  View Projects
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="relative group overflow-hidden">
            <CardHeader>
              <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="group-hover:text-primary transition-colors">Connect with Talent</CardTitle>
              <CardDescription>Find builders, designers, and other professionals to join your team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Search by skills and experience
                </li>
                <li className="flex items-center">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  View detailed profiles
                </li>
                <li className="flex items-center">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Direct messaging
                </li>
              </ul>
              <Button
                variant="ghost"
                className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground"
                asChild
              >
                <Link href="/users">
                  Browse Users
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="relative group overflow-hidden">
            <CardHeader>
              <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 mb-4">
                <Building className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="group-hover:text-primary transition-colors">Texas A&M Community</CardTitle>
              <CardDescription>
                Connect with the Texas A&M community for exclusive collaboration opportunities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  TAMU-exclusive projects
                </li>
                <li className="flex items-center">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Connect with alumni
                </li>
                <li className="flex items-center">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Campus resources
                </li>
              </ul>
              <Button
                variant="ghost"
                className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground"
                asChild
              >
                <Link href="/projects?tamu=true">
                  TAMU Projects
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <div className="relative rounded-3xl bg-gradient-to-b from-primary/10 to-primary/5 px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Ready to bring your ideas to life?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join our community of innovators and start building something amazing today.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/projects/new">
                  Start a Project
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/projects">
                  Browse Projects
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

