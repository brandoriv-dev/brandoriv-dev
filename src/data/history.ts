export type TimelineEntry = {
  period: string;
  title: string;
  org: string;
  detail?: string;
  kind: "work" | "education";
};

export const history: TimelineEntry[] = [
  {
    period: "Feb 2026 – Present",
    title: "Software Engineer",
    org: "Kimball Midwest",
    detail:
      "Leading the legacy-API modernization and our side of the D365 migration.",
    kind: "work",
  },
  {
    period: "Jun 2024 – Feb 2026",
    title: "Associate Software Engineer",
    org: "Kimball Midwest",
    detail:
      "Owned the manager-facing app and its BFF, from vendor handoff to store releases.",
    kind: "work",
  },
  {
    period: "Mar 2023 – Jun 2024",
    title: "Help Desk Agent, Tier 1",
    org: "Kimball Midwest",
    detail:
      "Worked the IT and mobile-app queue; scripted away the worst repeat tickets.",
    kind: "work",
  },
  {
    period: "2023",
    title: "B.S. Computer Science",
    org: "Franklin University",
    kind: "education",
  },
  {
    period: "Sep 2021 – Apr 2022",
    title: "Program Assistant",
    org: "Tech Corps",
    detail:
      "Taught middle- and high-schoolers CS, including as a Techie Camp instructor, and ran the survey analysis behind program changes.",
    kind: "work",
  },
  {
    period: "2020",
    title: "A.S. Software Development",
    org: "Columbus State",
    kind: "education",
  },
];

export const certifications: string[] = [
  "Azure Fundamentals (AZ-900) · 2024",
  "CompTIA IT Fundamentals+ · 2024",
];

export const skillGroups: { label: string; items: string[] }[] = [
  {
    label: "Languages",
    items: ["C#", "SQL", "PowerShell", "Bash", "JavaScript", "Python", "Java", "HTML/CSS"],
  },
  {
    label: "Frameworks & Libraries",
    items: [
      "ASP.NET",
      "MVC",
      "Blazor",
      ".NET MAUI",
      "EF Core",
      "MVVM",
      "Spring Boot",
      "React",
      "Node.js",
      "Tailwind CSS",
      "Bootstrap",
    ],
  },
  {
    label: "Cloud & Tooling",
    items: [
      "Azure DevOps",
      "Azure Key Vault",
      "Application Insights",
      "AWS",
      "IIS",
      "SQL Server",
      "Visual Studio",
      "Postman",
      "Swagger",
    ],
  },
  {
    label: "Practices",
    items: [
      "Microservice & BFF architecture",
      "REST API design",
      "CI/CD pipelines",
      "Token-based auth",
      "Unit & functional testing",
      "Agile/Scrum",
      "Code review",
    ],
  },
];
