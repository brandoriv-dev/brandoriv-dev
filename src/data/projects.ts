export type Project = {
  title: string;
  blurb: string;
  /** Short metric / impact line surfaced under the title. */
  impact?: string;
  skills: string[];
};

/**
 * Projects from Kimball Midwest, a university capstone, and community programs.
 * The `skills` strings are
 * the single source of truth for the filter chips in the Projects section.
 */
export const projects: Project[] = [
  {
    title: "MSTARS.Client.Api",
    impact: "Backs ~80% of company order entry",
    blurb:
      "Rewrote a ten-year-old .NET Framework service (MSTARSApi) onto modern .NET: token-based auth, logging in Application Insights, and the first unit and functional tests it ever had.",
    skills: [".NET", "C#", "REST API", "Auth", "Application Insights", "Testing"],
  },
  {
    title: "MSTARSApi (Legacy)",
    impact: "Kept ~80% of order entry running",
    blurb:
      "Kept the legacy order-entry service flowing. Traced failures through the SQL logs under pressure and added the tests that steadied its pipeline.",
    skills: [".NET Framework", "C#", "SQL Server", "Debugging", "Testing"],
  },
  {
    title: "ManagersAppClient.api",
    impact: "One BFF over ~15 microservices, used by 200+ people",
    blurb:
      "Built and owned a backend-for-frontend that unifies ~15 microservices (Search, Company, SalesRep, Person…) behind one API for a manager-facing reporting app.",
    skills: [".NET", "C#", "REST API", "Microservices", "BFF"],
  },
  {
    title: "Managers App",
    impact: "Replaced a tangle of Excel, Forms & PowerApps",
    blurb:
      "Inherited a mobile app from a vendor handoff, refactored it to MVVM, and added Field Visit Reports and Business Reviews so data was finally captured cleanly. Shipped and documented the iOS and Android releases.",
    skills: [".NET MAUI", "C#", "MVVM", "Mobile", "CI/CD"],
  },
  {
    title: "Thrive: D365 Environment",
    impact: "Dev + UAT stood up for a CRM migration",
    blurb:
      "Stood up the dev and UAT environment for the D365 migration: provisioned SQL Server, pipelines, hosts, and firewall rules, then coordinated DBAs, DevSecOps, Systems Engineering, and an integration partner to the first cross-system call.",
    skills: ["Azure DevOps", "SQL Server", "CI/CD", "D365"],
  },
  {
    title: ".NET 8 → 10 Upgrade",
    impact: "A path documented for ~84 applications",
    blurb:
      "Kicked off the framework upgrade: moved shared libraries onto stable package references, then documented a repeatable path the team could roll out across the rest.",
    skills: [".NET", "C#", "CI/CD"],
  },
  {
    title: "Managers App CI/CD",
    impact: "Unblocked broken builds",
    blurb:
      "Took over the Managers App pipeline and cleared the Telerik licensing and NuGet auth failures that were breaking builds.",
    skills: ["Azure DevOps", "CI/CD", "PowerShell"],
  },
  {
    title: "Help Desk Automation",
    impact: "Turned recurring tickets into scripts & insight",
    blurb:
      "Worked IT and mobile-app tickets in KACE, automated the repetitive ones with PowerShell, and mined ticket data in SQL to surface recurring problems.",
    skills: ["PowerShell", "SQL"],
  },
  {
    title: "Post Mortem",
    impact: "Computer Science capstone, Franklin University",
    blurb:
      "Franklin University capstone: a platform to share and discuss horror media, built end to end with Blazor and hosted on Azure.",
    skills: ["Blazor", "C#", ".NET", "Azure"],
  },
  {
    title: "Tech Corps Program Analytics",
    impact: "Steered STEM outreach toward girls in CS",
    blurb:
      "Analyzed student survey data in Python to measure interest and confidence, then used the findings to steer programs, including getting more girls into CS.",
    skills: ["Python", "Data Analysis"],
  },
];

/** Distinct skills across all projects, ordered by frequency then name. */
export const projectSkills: string[] = Array.from(
  projects
    .flatMap((p) => p.skills)
    .reduce((counts, skill) => {
      counts.set(skill, (counts.get(skill) ?? 0) + 1);
      return counts;
    }, new Map<string, number>()),
)
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .map(([skill]) => skill);
