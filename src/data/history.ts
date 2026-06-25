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
      "Leading legacy-API modernization and the Dynamics 365 migration: rewrote the service behind ~80% of order entry and drove my part of the .NET 8→10 upgrade.",
    kind: "work",
  },
  {
    period: "Jun 2024 – Feb 2026",
    title: "Associate Software Engineer",
    org: "Kimball Midwest",
    detail:
      "Built and owned a BFF over ~15 microservices, refactored a manager-facing mobile app to MVVM, and shipped its iOS and Android releases.",
    kind: "work",
  },
  {
    period: "Mar 2023 – Jun 2024",
    title: "Help Desk Agent, Tier 1",
    org: "Kimball Midwest",
    detail:
      "Resolved IT and mobile-app tickets, automated the repetitive ones with PowerShell, and mined ticket data in SQL to surface recurring problems.",
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
      "Taught and mentored middle- and high-school students in computer science (including as a Techie Camp instructor) and analyzed student survey data in Python to measure interest and self-efficacy, shaping program improvements.",
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
  "Microsoft Certified: Azure Fundamentals (AZ-900), 2024",
  "CompTIA IT Fundamentals+, 2024",
];

export const skillGroups: { label: string; items: string[] }[] = [
  {
    label: "Languages",
    items: ["C#", "SQL", "PowerShell", "Bash", "JavaScript", "Python", "Java", "HTML/CSS", "YAML"],
  },
  {
    label: "Frameworks & Libraries",
    items: [
      "ASP.NET",
      "MVC",
      "Blazor",
      ".NET MAUI",
      "EF",
      "MVVM",
      "Spring Boot",
      "React.js",
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
