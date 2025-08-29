const organizations = [
    "Aggies Create",
    "AggieX", 
    "Aggie Entrepreneurs",
    "Aggies Create Incubator",
    "AggieX Accelerator",
    "Meloy Engineering Innovation and Entrepreneurship Program (MEIEP)",
    "McFerrin Experience Team (MET)",
    "Aggie Venture Fund (AVF)",
    "Student Government Association",
    "Greek Life",
    "Honors Program",
    "Research Lab"
  ];
  
  const { data, error } = await supabase
    .from('organizations')
    .insert(organizations.map(name => ({ name })));