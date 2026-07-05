export const profile = {
  name: "Brandon Rivera",
  role: ".NET Software Engineer",
  location: "Columbus, OH",
  email: "brandoriv.dev@gmail.com",
  links: {
    site: "https://brandoriv.dev",
    linkedin: "https://linkedin.com/in/brandoriv",
    github: "https://github.com/brandoriv",
  },
  // Lives in /public; swap the file to update the downloadable résumé.
  resume: "/Brandon-Rivera-Resume.pdf",
  summary:
    "I'm a .NET engineer who works across the stack: C# microservices, REST APIs, and the SQL and CI/CD that keep them running.",
  aboutExtra:
    "I own services from first commit to production and untangle live issues under pressure. Lately that has meant coordinating the teams it takes to ship a migration.",

  // Split-layout hero. Headline = pre + <em>emphasis</em> + post.
  hero: {
    eyebrow: "web · mobile · apis · cloud · backend · ai",
    headline: { pre: "Custom software that ", emphasis: "just works", post: "" },
    subhead:
      ".NET engineer in Columbus, OH. Most of what I build lands in production and gets used every day.",
    ctaLabel: "See selected work",
    // Proof metrics under the headline. Claims match the project cards below.
    metrics: [
      { value: "~80%", label: "of order entry" },
      { value: "~15", label: "microservices" },
      { value: "200+", label: "people served" },
      { value: "~84", label: "apps on one upgrade path" },
    ],
  },
} as const;
