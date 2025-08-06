// ---------- Animation Variants ----------

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

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
};

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

export const buttonVariants = {
  tap: { scale: 0.98 },
};

export const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4 },
  },
};

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

export const calendarVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", damping: 20, stiffness: 150, delay: 0.2 },
  },
};

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

// ---------- Industry & Skills ----------

export const industryOptions = [
  "Agriculture, Food & Natural Resources",
  "Architecture & Construction",
  "Arts, A/V Technology & Communications",
  "Business Management & Administration",
  "Education & Training",
  "Finance",
  "Government & Public Administration",
  "Health Science",
  "Human Services",
  "Hospitality & Tourism",
  "Information Technology",
  "Law, Public Safety, Corrections & Security",
  "Manufacturing",
  "Marketing",
  "Science, Technology, Engineering & Mathematics",
  "Transportation, Distribution & Logistics",
];

export const industrySkillsMap: Record<string, string[]> = {
  "Agriculture, Food & Natural Resources": [
    "Crop Management",
    "Animal Science",
    "Sustainable Farming",
    "Agribusiness",
    "Soil Analysis",
    "Food Safety",
    "Irrigation Systems",
    "Livestock Management",
    "Greenhouse Management",
    "Organic Farming",
    "Environmental Science",
  ],
  "Architecture & Construction": [
    "Blueprint Reading",
    "AutoCAD",
    "Structural Analysis",
    "Construction Management",
    "Building Codes",
    "Surveying",
    "Revit",
    "Construction Safety",
    "OSHA Regulations",
    "HVAC Systems",
    "Electrical Systems",
  ],
  "Arts, A/V Technology & Communications": [
    "Graphic Design",
    "Video Editing",
    "Photography",
    "Animation",
    "Public Speaking",
    "Content Creation",
    "3D Modeling",
    "UX/UI Design",
    "Sound Engineering",
    "Typography",
    "Web Design",
  ],
  "Business Management & Administration": [
    "Project Management",
    "Strategic Planning",
    "Business Analysis",
    "Operations Management",
    "Microsoft Excel",
    "Budgeting",
    "Human Resources",
    "Negotiation",
    "Customer Relationship Management (CRM)",
    "Data Analytics",
    "Business Communication",
  ],
  "Education & Training": [
    "Curriculum Design",
    "Classroom Management",
    "Lesson Planning",
    "Instructional Design",
    "Student Assessment",
    "Educational Technology",
    "Learning Management Systems (LMS)",
    "Special Education",
    "Behavior Management",
    "STEM Education",
    "E-learning Tools",
  ],
  Finance: [
    "Financial Modeling",
    "Excel",
    "Accounting",
    "Investment Analysis",
    "Budget Forecasting",
    "Risk Management",
    "Corporate Finance",
    "Tax Preparation",
    "Audit",
    "Valuation",
    "Portfolio Management",
  ],
  "Government & Public Administration": [
    "Policy Analysis",
    "Public Speaking",
    "Regulatory Compliance",
    "Budget Planning",
    "Civic Engagement",
    "Research",
    "Public Policy",
    "Legislative Analysis",
    "Urban Planning",
    "Crisis Management",
    "Intergovernmental Relations",
  ],
  "Health Science": [
    "EMR Systems",
    "HIPAA Compliance",
    "Clinical Skills",
    "Medical Terminology",
    "Patient Care",
    "Pharmacology",
    "Anatomy & Physiology",
    "Health Informatics",
    "Medical Coding",
    "Patient Education",
    "Nutrition",
  ],
  "Human Services": [
    "Counseling",
    "Case Management",
    "Crisis Intervention",
    "Empathy",
    "Social Work",
    "Community Outreach",
    "Addiction Counseling",
    "Family Support Services",
    "Therapeutic Techniques",
    "Youth Services",
    "Cultural Competence",
  ],
  "Hospitality & Tourism": [
    "Customer Service",
    "Event Planning",
    "Food & Beverage Service",
    "Hotel Management",
    "Travel Coordination",
    "Conflict Resolution",
    "Tourism Marketing",
    "Hospitality Law",
    "Event Budgeting",
    "Culinary Arts",
    "Guest Services",
  ],
  "Information Technology": [
    "Programming",
    "Data Analysis",
    "Cybersecurity",
    "Cloud Computing",
    "Networking",
    "IT Support",
    "Fullstack Developer",
    "Backend Developer",
    "DevOps",
    "Agile Methodologies",
    "Machine Learning",
    "Mobile App Development",
    "Database Administration",
    "System Architecture",
    "Version Control (e.g. Git)",
  ],
  "Law, Public Safety, Corrections & Security": [
    "Legal Research",
    "Criminal Justice",
    "Emergency Response",
    "Security Operations",
    "Report Writing",
    "Surveillance",
    "Court Procedures",
    "Forensic Science",
    "Law Enforcement Tactics",
    "Correctional Management",
    "Criminal Psychology",
  ],
  Manufacturing: [
    "Machine Operation",
    "Quality Control",
    "Lean Manufacturing",
    "CAD/CAM",
    "Industrial Safety",
    "Inventory Management",
    "Robotics",
    "Welding",
    "Production Planning",
    "CNC Programming",
    "Assembly Line Operations",
  ],
  Marketing: [
    "Digital Marketing",
    "SEO",
    "Market Research",
    "Brand Management",
    "Copywriting",
    "Social Media",
    "Email Marketing",
    "Content Strategy",
    "Influencer Marketing",
    "CRM Tools",
    "Marketing Automation",
  ],
  "Science, Technology, Engineering & Mathematics": [
    "Lab Skills",
    "Data Analysis",
    "Mathematical Modeling",
    "Scientific Research",
    "Engineering Design",
    "Critical Thinking",
    "Python Programming",
    "Control Systems",
    "Circuit Design",
    "Systems Engineering",
    "Simulation Modeling",
  ],
  "Transportation, Distribution & Logistics": [
    "Logistics Management",
    "Supply Chain Operations",
    "Fleet Management",
    "Route Optimization",
    "Inventory Tracking",
    "Warehousing",
    "Freight Handling",
    "DOT Compliance",
    "GPS Navigation Systems",
    "Customs Regulations",
    "Logistics Software",
  ],
};

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

export const projectStatusOptions = [
  "Idea",
  "Active",
  "Closed"
];

export const recruitmentStatusOptions = [
  "Seeking Investment",
  "Actively Recruiting",
  "Team Complete",
];

export const projectStatusColors: Record<string, string> = {
  "Idea":
    "bg-yellow-100 text-yellow-700 hover:shadow-[0_0_6px_2px_rgba(140,10,4,0.30)]", 
  "Active":
    "bg-blue-100 text-blue-700 hover:shadow-[0_0_6px_2px_rgba(37,115,250,0.30)]", 
  "Closed":
    "bg-green-100 text-green-700 hover:shadow-[0_0_6px_2px_rgba(31,160,78,0.30)]",
};

export const recruitmentStatusColors: Record<string, string> = {
  "Seeking Investment":
    "bg-red-100 text-red-700 hover:shadow-[0_0_6px_2px_rgba(220,38,38,0.3)]", 
  "Actively Recruiting":
    "bg-green-100 text-green-700 hover:shadow-[0_0_6px_2px_rgba(31,160,78,0.30)]",
  "Team Complete":
   "bg-blue-100 text-blue-700 hover:shadow-[0_0_6px_2px_rgba(37,115,250,0.30)]", 
};

export const locationTypeOptions = ["Remote", "On-site", "Hybrid", "Flexible"];

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

export const categories: Record<EventType, string> = {
  workshop: "Workshops",
  info_session: "Info Sessions",
  networking: "Networking",
  hackathon: "Hackathons",
  deadline: "Project Deadlines",
  meeting: "Meetings",
  other: "Other Events",
  personal: "Personal Events",
};

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

export const badgeShadowVariants = [
  "hover:shadow-[0_0_6px_2px_rgba(31,160,78,0.30)]", // green
  "hover:shadow-[0_0_6px_2px_rgba(140,10,4,0.30)]", // red
  "hover:shadow-[0_0_6px_2px_rgba(37,115,250,0.30)]", // blue
];
