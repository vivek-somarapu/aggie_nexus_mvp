// ---------- Animation Variants ----------

// Page-level fade with staggered children
export const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

// For container components (e.g., list wrappers)
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
};

// Standard card appearance
export const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 100,
    },
  },
};

// For list items sliding in from the side
export const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4 },
  },
};

// For onboarding or step transitions
export const stepVariants = {
  initial: { opacity: 0, x: 50, y: 20 },
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    x: 0,
    y: 20,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

// For calendar pop-in UI elements
export const calendarVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", damping: 20, stiffness: 150, delay: 0.2 },
  },
};

// Dialog/modal transitions
export const dialogVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.2 },
  },
};

// Event card with hover/tap interaction
export const eventCardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 15, stiffness: 120 },
  },
  hover: {
    y: -5,
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    transition: { duration: 0.2 },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

// ---------- Select Options ----------

export const industryOptions = [
  "Technology",
  "Healthcare",
  "Education",
  "Finance",
  "Entertainment",
  "Retail",
  "Manufacturing",
  "Agriculture",
  "Energy",
  "Transportation",
  "Real Estate",
  "Nonprofit",
  "Sports",
  "Food & Beverage",
  "Other",
];

export const skillOptions = [
  "Programming",
  "Design",
  "Marketing",
  "Sales",
  "Finance",
  "Management",
  "Writing",
  "Research",
  "Customer Service",
  "Data Analysis",
  "Project Management",
  "Leadership",
  "Communication",
  "Problem Solving",
  "Creativity",
];

// ---------- Calendar event options ----------

export type EventType =
  | "workshop"
  | "info_session"
  | "networking"
  | "hackathon"
  | "deadline"
  | "meeting"
  | "other"
  | "personal";

// Maps event types to readable category names
export const categories: Record<EventType, string> = {
  workshop: "Workshops",
  info_session: "Info Sessions",
  networking: "Networking Events",
  hackathon: "Hackathons",
  deadline: "Project Deadlines",
  meeting: "Meetings",
  other: "Other Events",
  personal: "Personal Events",
};

// Tailwind-safe color palette used in event variants or tags
export const colorPalette = [
  "blue",
  "green",
  "yellow",
  "pink",
  "purple",
  "red",
  "orange",
  "indigo",
  "teal",
  "cyan",
  "emerald",
  "rose",
  "amber",
  "lime",
  "sky",
] as const;

// Scrollbar styles for custom scrollbars
export const customScrollStyles = `
  .scrollbar-thin {
    scrollbar-width: thin;
  }
  .scrollbar-thumb-muted {
    scrollbar-color: hsl(var(--muted-foreground)) transparent;
  }
  .scrollbar-track-transparent {
    scrollbar-track-color: transparent;
  }
  
  /* Webkit scrollbar styles */
  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: hsl(var(--muted-foreground));
    border-radius: 3px;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background-color: hsl(var(--foreground));
  }
`;
