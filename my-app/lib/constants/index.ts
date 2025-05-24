// Animation variants
export const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
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
      staggerChildren: 0.1,
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

export const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4 },
  },
};
export const stepVariants = {
  initial: { opacity: 0, x: 50, y: 20 }, // start slightly below
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
    y: 20, // exit slightly below again
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

// Get industry options from the project page
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

// Get skill options from the project page
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
