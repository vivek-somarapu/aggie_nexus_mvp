"use client"

import { useState } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bookmark, GraduationCap } from "lucide-react"
import { mockUsers } from "@/lib/utils"

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [industryFilter, setIndustryFilter] = useState("all")
  const [skillFilter, setSkillFilter] = useState("all")
  const [tamuFilter, setTamuFilter] = useState("all")

  // Get all unique industries and skills from users
  const industries = Array.from(new Set(mockUsers.flatMap((user) => user.industry)))

  const skills = Array.from(new Set(mockUsers.flatMap((user) => user.skills)))

  // Filter users based on search query and filters
  const filteredUsers = mockUsers.filter((user) => {
    // Filter by search query
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.bio.toLowerCase().includes(searchQuery.toLowerCase())

    // Filter by industry
    const matchesIndustry = industryFilter === "all" || user.industry.includes(industryFilter)

    // Filter by skill
    const matchesSkill = skillFilter === "all" || user.skills.includes(skillFilter)

    // Filter by TAMU affiliation
    const matchesTamu =
      tamuFilter === "all" ||
      (tamuFilter === "tamu" && user.is_texas_am_affiliate) ||
      (tamuFilter === "non-tamu" && !user.is_texas_am_affiliate)

    return matchesSearch && matchesIndustry && matchesSkill && matchesTamu
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Find collaborators, builders, and funders for your projects</p>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <TabsList className="mb-4 md:mb-0">
            <TabsTrigger value="all">All Users</TabsTrigger>
            <TabsTrigger value="builders">Builders</TabsTrigger>
            <TabsTrigger value="funders">Funders</TabsTrigger>
          </TabsList>

          <div className="flex flex-col md:flex-row gap-4">
            <TabsList>
              <TabsTrigger
                value="all"
                onClick={() => setTamuFilter("all")}
                className={tamuFilter === "all" ? "bg-primary text-primary-foreground" : ""}
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="tamu"
                onClick={() => setTamuFilter("tamu")}
                className={tamuFilter === "tamu" ? "bg-primary text-primary-foreground" : ""}
              >
                TAMU
              </TabsTrigger>
              <TabsTrigger
                value="non-tamu"
                onClick={() => setTamuFilter("non-tamu")}
                className={tamuFilter === "non-tamu" ? "bg-primary text-primary-foreground" : ""}
              >
                Non-TAMU
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {industries.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={skillFilter} onValueChange={setSkillFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Skill" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Skills</SelectItem>
              {skills.map((skill) => (
                <SelectItem key={skill} value={skill}>
                  {skill}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="all" className="mt-0">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((user) => (
              <Link href={`/users/${user.id}`} key={user.id}>
                <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar} alt={user.full_name} />
                        <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Bookmark className="h-4 w-4" />
                        <span className="sr-only">Bookmark user</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="mb-2">
                      <h3 className="font-semibold text-lg">{user.full_name}</h3>
                      {user.is_texas_am_affiliate && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <GraduationCap className="h-3 w-3" />
                          <span>Texas A&M Affiliate</span>
                        </div>
                      )}
                    </div>
                    <p className="text-muted-foreground line-clamp-3 mb-4">{user.bio}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {user.industry.map((ind) => (
                        <Badge key={ind} variant="secondary" className="text-xs">
                          {ind}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4 flex flex-wrap gap-2">
                    {user.skills.slice(0, 4).map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {user.skills.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{user.skills.length - 4}
                      </Badge>
                    )}
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No users found matching your criteria.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("")
                  setIndustryFilter("all")
                  setSkillFilter("all")
                  setTamuFilter("all")
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="builders" className="mt-0">
          {/* Same content as "all" tab but filtered for builders */}
        </TabsContent>

        <TabsContent value="funders" className="mt-0">
          {/* Same content as "all" tab but filtered for funders */}
        </TabsContent>
      </Tabs>
    </div>
  )
}

