"use client";

import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "@/components/logo";
import BrandPalette from "@/components/brand-palette";
import BrandTypography from "@/components/brand-typography";

export default function BrandPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Aggie Nexus Brand Guidelines</h1>
        <p className="text-muted-foreground mt-2">
          Core brand elements and usage guidelines for the Aggie Nexus platform
        </p>
      </div>

      <Separator />

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
            <CardDescription>Primary Aggie Nexus logo</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-8">
            <div className="p-8 border rounded-lg flex justify-center items-center w-full">
              <Logo size="lg" />
            </div>
            <div className="p-8 border rounded-lg bg-[#0f1819] flex justify-center items-center w-full">
              <Logo size="lg" className="[&>span]:text-white" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logo Variations</CardTitle>
            <CardDescription>Different sizes and applications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="p-4 border rounded-lg flex items-center justify-center">
              <Logo size="sm" />
            </div>
            <div className="p-4 border rounded-lg flex items-center justify-center">
              <Logo size="md" />
            </div>
            <div className="p-4 border rounded-lg flex items-center justify-center">
              <div className="h-12 w-12">
                <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Blue Ring */}
                  <circle cx="60" cy="60" r="25" stroke="#2d29dd" strokeWidth="10" fill="none" />
                  {/* Red Ring */}
                  <circle cx="40" cy="80" r="25" stroke="#600000" strokeWidth="10" fill="none" />
                  {/* Green Ring */}
                  <circle cx="80" cy="80" r="25" stroke="#29dd6c" strokeWidth="10" fill="none" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <BrandPalette />
        <BrandTypography />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage Guidelines</CardTitle>
          <CardDescription>How to use the Aggie Nexus brand elements properly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Logo Usage</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Always maintain clear space around the logo</li>
              <li>Don't distort, rotate, or change the colors of the logo</li>
              <li>Use the dark version on light backgrounds and vice versa</li>
              <li>The minimum size for the logo is 24px in height</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Color Usage</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use the primary maroon color for buttons and important UI elements</li>
              <li>The green, blue, and red accent colors should be used sparingly</li>
              <li>The dark color is for text and primary borders</li>
              <li>The light blue background can be used for cards and subtle backgrounds</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Typography</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Montserrat is used for the logo and main display text</li>
              <li>Playfair Display is used for headings and subheadings</li>
              <li>Inter is used for body text and UI elements</li>
              <li>Keep font sizes consistent across similar elements</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 