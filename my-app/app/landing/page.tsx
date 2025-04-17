"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

const fadeUp = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
  viewport: { once: true },
}

export default function LandingPage() {
  return (
    <main className="bg-[#0A0A0A] text-white min-h-screen overflow-x-hidden">
      {/* Header */}
      <header className="flex justify-between items-center p-6">
        <div className="flex items-center space-x-2 text-white text-lg font-bold">
          <Image src="/logo1.svg" alt="Aggie Nexus Logo" width={160} height={40} className="object-contain" />
        </div>
        <div className="space-x-4">
        <Link href="/auth/login">
        <Button variant="ghost" className="text-white border border-white hover:bg-white hover:text-black">
            Log In
        </Button>
        </Link>
        <Link href="/auth/signup">
        <Button className="bg-blue-500 hover:bg-blue-600">
            Sign Up
        </Button>
        </Link>

        </div>
      </header>

      {/* Hero Section */}
      <motion.section {...fadeUp} className="text-center px-6 py-32 relative">
        <h1 className="text-[60px] md:text-[80px] font-extrabold leading-[1.1] tracking-tight">
          THE CENTRAL HUB<br />FOR AGGIE INNOVATION.
        </h1>

        <div className="bg-[#2A2A2A] text-white mt-12 p-8 rounded-lg max-w-4xl mx-auto shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-center">THE FUTURE STARTS HERE.</h2>
          <p className="text-base text-center text-gray-100">
          Join a community of builders, funders, and innovators bringing ideas to life at Texas A&M and beyond.
          </p>
        </div>

        {/* Big logo SVG on Bottom Right */}
        {/* Big logo SVG inside Hero */}
        <div className="absolute top-1/2 right-0 transform translate-y-[-50%] translate-x-[30%] z-[-1]">
        <Image
            src="/circles-right.svg"
            alt="decorative"
            width={450}
            height={450}
            className="opacity-80"
        />
        </div>

      </motion.section>

      {/* Industry Section */}
      <motion.section {...fadeUp} className="relative">
        <Image src="/lab1.jpg" alt="lab background" width={1920} height={800} className="w-full object-cover h-[500px]" />
        <div className="absolute inset-0 bg-black/50 flex flex-col justify-center pl-10">
          <h2 className="text-4xl font-bold">FOSTERING GROWTH</h2>
          <p className="text-2xl mt-2">in every industry.</p>
          <p className="max-w-md mt-4 text-gray-300 text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
        </div>
      </motion.section>

      {/* Connect Section */}
      <motion.section {...fadeUp} className="relative">
        <Image src="/garage.jpg" alt="garage" width={1920} height={800} className="w-full object-cover h-[500px]" />
        <div className="absolute inset-0 bg-black/60 flex flex-col justify-center items-end pr-10 text-right">
          <h2 className="text-4xl font-bold">CONNECTING WITH</h2>
          <p className="text-2xl mt-2">innovators across the world.</p>
          <p className="max-w-md mt-4 text-gray-300 text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
        </div>
      </motion.section>

      {/* Network Section */}
      <motion.section {...fadeUp} className="flex flex-col md:flex-row items-center justify-between gap-10 p-12 bg-[#111111]">
        <Image src="/calendar.png" alt="calendar" width={500} height={400} className="rounded-lg shadow-lg" />
        <div className="max-w-md text-left">
          <h2 className="text-4xl font-bold">DIVE INTO<br />THE AGGIE NETWORK</h2>
          <p className="mt-4 text-gray-300 text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...</p>
        </div>
      </motion.section>
    </main>
  )
}
