"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Calendar, CheckCircle, Clock, Info, MapPin, UserCircle2, XCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";

// Define Event type for this page
interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  color: string;
  event_type: string;
  created_by: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  organizer_name?: string;
}

// Animation variants
const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 12, stiffness: 100 }
  }
};

export default function ManagerEventsPage() {
  const { user, isLoading: authLoading, isManager } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect non-managers
  useEffect(() => {
    if (!authLoading && !isManager) {
      router.push('/calendar');
    }
  }, [authLoading, isManager, router]);

  // Fetch events based on status
  const fetchEvents = async (status: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const supabase = createClient();
      
      // Fetch events with the specified status
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          profiles:created_by (full_name)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Map the data to include organizer name
      const eventsWithOrganizerName = data.map((event: any) => ({
        ...event,
        organizer_name: event.profiles?.full_name || 'Unknown',
      }));
      
      setEvents(eventsWithOrganizerName);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch events on tab change
  useEffect(() => {
    if (!authLoading && isManager) {
      fetchEvents(activeTab);
    }
  }, [activeTab, authLoading, isManager]);

  // Handle event status update
  const updateEventStatus = async (eventId: string, status: 'approved' | 'rejected') => {
    try {
      setError(null);
      
      const supabase = createClient();
      
      // Call the database function to update the event status
      const { data, error } = await supabase.rpc('update_event_status', {
        event_id: eventId,
        new_status: status,
        manager_id: user?.id
      });
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setEvents(prev => prev.filter(event => event.id !== eventId));
      
      // Show success message
      setSuccess(`Event ${status === 'approved' ? 'approved' : 'rejected'} successfully.`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err) {
      console.error("Error updating event status:", err);
      setError("Failed to update event status. Please try again.");
    }
  };

  // Event type category labels
  const categories: Record<string, string> = {
    workshop: "Workshop",
    info_session: "Info Session",
    networking: "Networking Event",
    hackathon: "Hackathon",
    deadline: "Project Deadline",
    meeting: "Meeting",
    personal: "Personal Event",
    other: "Other Event"
  };

  // Function to get badge variant based on event type
  const getBadgeVariant = (type: string) => {
    switch(type) {
      case "workshop":
        return "blue";
      case "info_session":
        return "green";
      case "networking":
        return "yellow";
      case "hackathon":
        return "purple";
      case "deadline":
        return "red";
      case "meeting":
        return "orange";
      case "personal":
        return "pink";
      default:
        return "default";
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto max-w-7xl p-4 space-y-6">
        <div className="h-8 w-64 bg-muted rounded animate-pulse mb-4"></div>
        <div className="h-6 w-96 bg-muted/60 rounded animate-pulse mb-8"></div>
        <Skeleton className="h-12 w-full mb-6" />
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-60 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!isManager) {
    return null; // Will be redirected by the useEffect
  }

  return (
    <motion.div 
      className="container mx-auto max-w-7xl p-4 space-y-6"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight">
          Event Management
        </h1>
        <p className="text-muted-foreground">
          Review, approve, or reject event submissions
        </p>
      </motion.div>

      {error && (
        <motion.div variants={itemVariants}>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {success && (
        <motion.div variants={itemVariants}>
          <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <Tabs 
          defaultValue="pending" 
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'pending' | 'approved' | 'rejected')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-60 w-full" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending events to review</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {events.map((event) => (
                  <motion.div 
                    key={event.id}
                    variants={itemVariants}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge variant={getBadgeVariant(event.event_type) as any}>
                            {categories[event.event_type] || 'Event'}
                          </Badge>
                          <Badge variant="outline">Pending</Badge>
                        </div>
                        <CardTitle>{event.title}</CardTitle>
                        <CardDescription>
                          <div className="flex items-center gap-1 text-sm">
                            <UserCircle2 className="h-3 w-3" />
                            <span>Submitted by {event.organizer_name}</span>
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm">
                              {format(parseISO(event.start_time), "MMMM d, yyyy")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(event.start_time), "h:mm a")} - {format(parseISO(event.end_time), "h:mm a")}
                            </p>
                          </div>
                        </div>
                        
                        {event.location && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-sm">{event.location}</p>
                          </div>
                        )}
                        
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground">
                            Submitted {format(parseISO(event.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                        
                        {event.description && (
                          <div className="mt-2">
                            <p className="text-sm line-clamp-3">{event.description}</p>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="flex flex-col gap-2">
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => updateEventStatus(event.id, 'rejected')}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                        <Button 
                          className="w-full" 
                          onClick={() => updateEventStatus(event.id, 'approved')}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="approved">
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-60 w-full" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No approved events</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {events.map((event) => (
                  <motion.div 
                    key={event.id}
                    variants={itemVariants}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge variant={getBadgeVariant(event.event_type) as any}>
                            {categories[event.event_type] || 'Event'}
                          </Badge>
                          <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300">Approved</Badge>
                        </div>
                        <CardTitle>{event.title}</CardTitle>
                        <CardDescription>
                          <div className="flex items-center gap-1 text-sm">
                            <UserCircle2 className="h-3 w-3" />
                            <span>Organized by {event.organizer_name}</span>
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm">
                              {format(parseISO(event.start_time), "MMMM d, yyyy")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(event.start_time), "h:mm a")} - {format(parseISO(event.end_time), "h:mm a")}
                            </p>
                          </div>
                        </div>
                        
                        {event.location && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-sm">{event.location}</p>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => router.push(`/calendar/${event.id}`)}
                        >
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="rejected">
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-60 w-full" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No rejected events</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {events.map((event) => (
                  <motion.div 
                    key={event.id}
                    variants={itemVariants}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge variant={getBadgeVariant(event.event_type) as any}>
                            {categories[event.event_type] || 'Event'}
                          </Badge>
                          <Badge variant="destructive">Rejected</Badge>
                        </div>
                        <CardTitle>{event.title}</CardTitle>
                        <CardDescription>
                          <div className="flex items-center gap-1 text-sm">
                            <UserCircle2 className="h-3 w-3" />
                            <span>Submitted by {event.organizer_name}</span>
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm">
                              {format(parseISO(event.start_time), "MMMM d, yyyy")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(event.start_time), "h:mm a")} - {format(parseISO(event.end_time), "h:mm a")}
                            </p>
                          </div>
                        </div>
                        
                        {event.location && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-sm">{event.location}</p>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => updateEventStatus(event.id, 'approved')}
                        >
                          Move to Approved
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
} 