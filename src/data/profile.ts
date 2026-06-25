export const profile = {
  name: "Brandon Rivera",
  role: ".NET Software Engineer",
  location: "Columbus, OH",
  email: "brandoriv.dev@gmail.com",
  phone: "(614) 717-8650",
  links: {
    site: "https://brandoriv.dev",
    linkedin: "https://linkedin.com/in/brandoriv",
    github: "https://github.com/brandoriv",
  },
  // Lives in /public; swap the file to update the downloadable résumé.
  resume: "/Brandon-Rivera-Resume.pdf",
  tagline:
    "I build the C# microservices, REST APIs, and CI/CD that keep daily systems running.",
  summary:
    "I'm a .NET engineer who works across the stack: C# microservices, REST APIs, and the SQL and CI/CD that keep them running.",
  aboutExtra:
    "I own services end to end, untangle production issues under pressure, and coordinate the teams it takes to ship a migration.",

  // Kept for the (new) split-layout hero. Headline = pre + <em>emphasis</em> + post.
  hero: {
    eyebrow: "web · apps · backend · cloud",
    headline: { pre: "Custom software, ", emphasis: "built to last", post: "." },
    subhead:
      "A Columbus .NET engineer who treats every build like a workbench project — measured cuts, clean joints, and code that keeps running long after launch.",
    capabilities: [
      { label: "web", stack: "astro / react" },
      { label: "apps", stack: ".net / maui" },
      { label: "backend", stack: "apis / sql" },
      { label: "cloud", stack: "azure / ci-cd" },
    ],
    ctaLabel: "see selected work",
  },
} as const;
