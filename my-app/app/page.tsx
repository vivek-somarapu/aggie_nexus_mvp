"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import "keen-slider/keen-slider.min.css";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

import Autoplay from "embla-carousel-autoplay";
import {
  ArrowRight,
  Users,
  CheckCircle2,
  MapPin,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

const projects = [
  {
    id: 1,
    title: "Mobile App for Local Farmers Markets",
    stage: "Project",
    status: "In Progress",
    recruiting: "Actively Recruiting",
    summary:
      "Developing an augmented-reality application that provides interactive information about local vendors and their goods.",
    location: "Hybrid",
    createdAt: new Date("2025-05-25"),
    tags: ["Technology", "Agriculture"],
  },
  {
    id: 2,
    title: "Aerial Drone Launcher Development",
    stage: "Idea",
    status: "Planning",
    recruiting: "Full team, seeking investment",
    summary:
      "Building a full-scale prototype of a military-grade drone launcher for water craft. Looking for students interested in mechanical engineering.",
    location: "In-person",
    createdAt: new Date("2025-06-28"),
    tags: ["Manufacturing", "Technology", "Other"],
  },
  {
    id: 3,
    title: "FinTech App",
    stage: "Project",
    status: "Ongoing",
    recruiting: "Looking for co-founders",
    summary:
      "We’re looking for teammates with Customer Service and Design expertise to join us on this FinTech application.",
    location: "Hybrid",
    createdAt: new Date("2025-04-18"),
    tags: ["Nonprofit", "Customer Service", "Design"],
  },
  {
    id: 4,
    title: "AI App",
    stage: "Project",
    status: "Not Started",
    recruiting: "Looking for co-founders",
    summary:
      "Seeking Marketing and Sales talent to help launch an AI-driven application in the food & beverage space.",
    location: "Remote",
    createdAt: new Date("2025-04-18"),
    tags: ["Food & Beverage", "Marketing", "Sales"],
  },
  {
    id: 5,
    title: "ML App",
    stage: "Idea",
    status: "Not Started",
    recruiting: "Recruiting team members",
    summary:
      "Looking for teammates with strong Problem-Solving and Research skills to build an energy-sector ML solution.",
    location: "Remote",
    createdAt: new Date("2025-04-18"),
    tags: ["Energy", "Problem Solving", "Research"],
  },
];

export default function Home() {
  const { authUser, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const authError = searchParams?.get("auth_error");
  const [showError, setShowError] = useState(false);

  // Handle auth errors from callback
  useEffect(() => {
    if (authError) {
      setShowError(true);
      const timeout = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [authError]);

  // Simple loading state handled by client layout
  if (isLoading) {
    return <Skeleton className="h-[400px] w-full rounded-xl" />;
  }

  return (
    <div className="relative overflow-hidden">
      {/* Decorative circles logo background with animation */}
      <motion.div
        className="
          absolute
          right-[-90px]  top-[0px] scale-60
          md:right-[-80px]  md:top-[40px] 
          lg:right-0       lg:top-[120px] 
          xl:right-0       xl:top-[120px] 
          md:scale-75
          lg:scale-100  
          rotate-[10deg]
          pointer-events-none opacity-60
        "
        initial={{ opacity: 0, rotate: 205 }}
        animate={{
          opacity: 0.6,
          scale: 1,
          rotate: 220,
          transition: { duration: 0.8, ease: "easeOut" },
        }}
        whileInView={{
          x: [0, 10, 0],
          transition: { repeat: Infinity, repeatType: "reverse", duration: 8 },
        }}
      >
        <Image
          src="/images/circles-logo.png"
          alt="Decorative circles"
          width={650}
          height={450}
          className="object-contain"
          priority
        />
      </motion.div>

      <section className="relative">
        {/* Hero Background */}
        <div className="absolute inset-0 bg-background/5 to-transparent -z-10" />

        {/* Auth Error Message */}
        {showError && (
          <div className="container mx-auto mt-24">
            <div className="bg-destructive/15 border border-destructive text-destructive px-4 py-3 rounded-md">
              <p>Authentication error occurred. Please try again.</p>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="container mx-auto flex-1 flex flex-col md:flex-row items-center md:items-start
          justify-center gap-10 py-12 md:py-20 relative"
        >
          {/* ────── LEFT  (text) ────── */}
          <motion.div
            variants={fadeIn}
            className="flex-1 space-y-6 md:max-w-4xl text-left"
          >
            {/* headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.9]">
              THE CENTRAL HUB
              <br />
              OF AGGIE
              <br />
              INNOVATION.
            </h1>

            <div className="px-4 pt-[11rem]">
              {/* sub-heading */}
              <h2
                className="
                  text-xl sm:text-3xl md:text-3xl lg:text-4xl
                  font-semibold tracking-tight mb-1
                "
              >
                The Future Starts Here.
              </h2>

              {/* body copy */}
              <p
                className="
                  max-w-[60ch]
                  leading-[1.35]
                  font-light text-muted-foreground
                  text-sm      sm:text-sm   md:text-lg   lg:text-xl
                "
              >
                Aggie Nexus was created to connect the needs of the industry
                with builders excited to meet those needs. Here you can do more
                than stay up-to-date with industry progress—you now have the
                opportunity to be a part of the growth forward. Post your ideas,
                join a startup, network your product. It all happens right here,
                in the central hub for A&M innovation.
              </p>
            </div>

            {/* CTA */}
            <div className="flex flex-wrap gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="rounded-full text-lg uppercase bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 px-7 py-3 font-semibold tracking-wide transition-colors"
              >
                <Link href={authUser ? "/projects/new" : "/auth/signup"}>
                  {authUser ? "Explore Projects" : "Sign Up"}
                </Link>
              </Button>
            </div>
          </motion.div>
        </motion.section>

        {/* Projects in Progress section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="relative py-16 md:py-20 overflow-hidden"
        >
          {/* ── Hard container (centres & limits width) ── */}
          <div className="container">
            {/* ── Headline ── */}
            <h2
              className="
                ml-auto
                max-w-4xl
                text-right
                pr-0 2xl:pr-[7.5rem] 
                text-3xl md:text-4xl lg:text-5xl
                font-semibold tracking-tight mb-12
              "
            >
              Join a project in progress.
              <br className="hidden sm:block" />
              Post your idea for a new one.
            </h2>

            {/* ── Copy + carousel wrapper ── */}
            <div
              className="
              mx-auto max-w-7xl
              grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12
              items-start
            "
            >
              <div className="lg:col-span-1">
                <p className="text-muted-foreground text-center px-10 lg:px-5 lg:text-left leading-relaxed text-lg">
                  Our Projects Page is where ideas become a reality. Whether
                  you're starting a company or just looking for experience,
                  Aggie Nexus is the place to start.
                </p>
              </div>

              {/* ────── Carousel starts here ────── */}
              <div className="lg:col-span-3">
                <Carousel
                  opts={{ loop: true }}
                  plugins={[
                    Autoplay({ delay: 5000, stopOnInteraction: false }),
                  ]}
                  className="w-full relative"
                >
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {projects.map((p) => (
                      <CarouselItem
                        key={p.id}
                        className="pl-2 md:pl-4  min-w-[350px] basis-full sm:basis-1/2 lg:basis-1/3"
                      >
                        <Card className="h-full transition-shadow hover:shadow-md flex flex-col">
                          <CardContent className="pt-6 flex flex-col h-full">
                            <div className="flex-1 space-y-4">
                              <h3 className="text-xl font-semibold leading-snug">
                                {p.title}
                              </h3>
                              <div className="flex gap-2">
                                <Badge
                                  className={
                                    p.stage === "Idea"
                                      ? "bg-blue-600 text-white"
                                      : "bg-green-600 text-white"
                                  }
                                >
                                  {p.stage}
                                </Badge>
                                <Badge variant="secondary">{p.status}</Badge>
                              </div>
                              <p className="text-muted-foreground">
                                {p.summary}
                              </p>
                            </div>

                            {/* Fixed metadata at bottom */}
                            <div className="mt-auto pt-4 space-y-3 border-t border-border/50">
                              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {p.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {format(p.createdAt, "MMM d, yyyy")}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {p.recruiting}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {p.tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="capitalize"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {/* Chevron arrows */}
                  <CarouselPrevious className="absolute left-1 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 sm:h-10 sm:w-10 bg-background/80 hover:bg-background border shadow-md" />
                  <CarouselNext className="absolute right-1 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 sm:h-10 sm:w-10 bg-background/80 hover:bg-background border shadow-md" />
                </Carousel>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Spacing between sections */}
        <div className="h-6 md:h-8"></div>

        {/* calendar section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="relative py-20 px-5 md:py-28 overflow-hidden"
        >
          <div className="container mx-auto">
            {/* ── Headline ── */}
            <h2
              className="
                max-w-4xl
                text-3xl sm:text-4xl lg:text-5xl
                font-semibold tracking-tight mb-12
              "
            >
              Expand your network. Find new opportunities.
              <br className="hidden lg:block" />
              Stay in the know.
            </h2>

            {/* ── Calendar + copy grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
              {/* ✦ descriptive copy — first on ≤md, second on ≥lg */}
              <p
                className="
                  order-1 lg:order-2
                  lg:col-span-2
                  text-center lg:text-left
                  text-muted-foreground leading-relaxed
                  text-sm sm:text-base md:text-lg
                "
              >
                Our Nexus calendar lets you stay up to date with all of the
                A&amp;M events that you wouldn’t want to miss. Looking to grow
                your network? Find an upcoming networking event in your
                industry. Trying to hone your technical skills? Look for a
                workshop. We have it all right here, convenient and accessible.
              </p>

              {/* ✦ calendar preview — second on ≤md, first on ≥lg */}
              <Card className="order-2 lg:order-1 lg:col-span-3 border rounded-2xl">
                <CardContent className="p-0">
                  <Image
                    src="/images/calendar-view.png"
                    alt="Aggie Nexus calendar month-view"
                    width={1200}
                    height={800}
                    className="w-full h-auto"
                    priority
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.section>

        {/* Connecting with Investors Section with Garage Image */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="relative py-16 md:py-20 w-full overflow-hidden mx-auto my-6 rounded-xl"
        >
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/garage.jpg"
              alt="Innovation garage"
              fill
              className="object-cover opacity-40 rounded-xl"
            />
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] rounded-xl" />
          </div>

          <div className="container relative z-10 px-6 md:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div variants={fadeUp} className="space-y-6 md:order-2">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  CONNECTING WITH
                </h2>
                <p className="text-xl text-muted-foreground">
                  Innovators across the world
                </p>
                <p className="text-muted-foreground">
                  Access a vibrant network of angel investors, venture
                  capitalists, and industry partners looking to fund and
                  accelerate the next big ideas coming out of Texas A&M.
                </p>
                <Button asChild>
                  <Link href="/users">
                    Find Partners
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>

              <motion.div variants={fadeUp} className="md:order-1">
                <Card className="bg-background/90 backdrop-blur-sm shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle>Investment Opportunities</CardTitle>
                    <CardDescription>
                      Connect with funders ready to invest
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-6">
                      <li className="flex items-start gap-4">
                        <CheckCircle2 className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                        <div>
                          <p className="font-medium">Angel Investors</p>
                          <p className="text-sm text-muted-foreground">
                            Early-stage funding for promising startups
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-4">
                        <CheckCircle2 className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                        <div>
                          <p className="font-medium">Venture Capital</p>
                          <p className="text-sm text-muted-foreground">
                            Series funding for growth-stage companies
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-4">
                        <CheckCircle2 className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                        <div>
                          <p className="font-medium">Grant Opportunities</p>
                          <p className="text-sm text-muted-foreground">
                            Non-dilutive funding for research projects
                          </p>
                        </div>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Our mission section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="
    relative w-screen -mx-2 h-[60vh] overflow-hidden
  "
        >
          {/* background image (sits behind, covers whole section) */}
          <Image
            src="/images/design-center.jpg"
            alt="Campus innovation workshop"
            fill
            className="object-cover z-[-1]"
            priority
          />

          {/* dark overlay */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] z-0" />

          {/* ────────────────────────────────
      WRAPPER: takes full height, full width
      flex column on mobile, row on ≥md
  ──────────────────────────────── */}
          <div className="relative z-10 flex h-full flex-col md:flex-row">
            {/* text block */}
            <div className="flex-[2] max-w-lg p-8 md:p-12 text-white">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light mb-6">
                Our Mission
              </h2>
              <p className="leading-relaxed font-light text-base md:text-lg">
                Aggie&nbsp;Nexus exists to create a central hub of innovation by
                connecting entrepreneurs, builders, and investors into a unified
                ecosystem. Our mission is to accelerate technology
                commercialization and foster transformative collaboration—rooted
                in Texas&nbsp;A&amp;M University and its affiliated network.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Footer */}
        <div className="container py-8 text-center dark:text-white/60 text-muted-foreground border-t">
          <div className="flex items-center justify-center gap-4 mb-2">
            <Link href="/about" className="text-sm hover:underline">
              About
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/terms" className="text-sm hover:underline">
              Terms
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/privacy" className="text-sm hover:underline">
              Privacy
            </Link>
          </div>
          <p className="text-sm">© 2025 Aggie Nexus. All rights reserved.</p>
        </div>
      </section>
    </div>
  );
}
