export type Project = {
  title: string;
  blurb: string;
  /** Short metric / impact line surfaced under the title. */
  impact?: string;
  skills: string[];
};

/**
 * Projects pulled from real work at Kimball Midwest. The `skills` strings are
 * the single source of truth for the filter chips in the Projects section.
 */
export const projects: Project[] = [
  {
    title: "MSTARS.Client.Api",
    impact: "Backs ~80% of company order entry",
    blurb:
      "Rewrote a ten-year-old .NET Framework service (MSTARSApi) onto modern .NET. Added token-based auth, moved logging into Application Insights, and introduced unit and functional tests where there had been none.",
    skills: [".NET", "C#", "REST API", "Auth", "Application Insights", "Testing"],
  },
  {
    title: "MSTARSApi (Legacy)",
    impact: "Kept ~80% of order entry running",
    blurb:
      "Production support and deep troubleshooting on the legacy order-entry service, tracing failures through the SQL error logs to keep orders flowing, and adding the tests that steadied its pipeline.",
    skills: [".NET Framework", "C#", "SQL Server", "Debugging", "Testing"],
  },
  {
    title: "ManagersAppClient.api",
    impact: "One BFF over ~15 microservices, used by 200+ people",
    blurb:
      "Built and owned a backend-for-frontend that pulls together around 15 downstream microservices (Search, Company, SalesRep, Person, and others) behind a single API for a manager-facing reporting app.",
    skills: [".NET", "C#", "REST API", "Microservices", "BFF"],
  },
  {
    title: "Managers App",
    impact: "Replaced a tangle of Excel, Forms & PowerApps",
    blurb:
      "Inherited a mobile app after a vendor handoff, refactored it to MVVM, and added the Field Visit Reports and Business Reviews modules so data was finally captured cleanly. Ran and documented the iOS and Android releases.",
    skills: [".NET MAUI", "C#", "MVVM", "Mobile", "CI/CD"],
  },
  {
    title: "Thrive: Dynamics 365 Environment",
    impact: "Dev + UAT stood up for a CRM migration",
    blurb:
      "Stood up the dev and UAT environment for the Dynamics 365 migration: provisioning SQL Server, pipelines, hosts, and firewall rules, then coordinating DBAs, DevSecOps, Systems Engineering, and an integration partner to the first successful cross-system call.",
    skills: ["Azure DevOps", "SQL Server", "CI/CD", "Dynamics 365"],
  },
  {
    title: ".NET 8 → 10 Upgrade",
    impact: "A path documented for ~84 applications",
    blurb:
      "Kicked off my part of the framework upgrade by getting shared libraries onto stable package references, then wrote up the process so the rest of the team had a repeatable path across the remaining applications.",
    skills: [".NET", "C#", "CI/CD"],
  },
  {
    title: "Managers App CI/CD",
    impact: "Unblocked broken builds",
    blurb:
      "Took over the pipeline and release process for the Managers App and cleared the Telerik licensing and NuGet authentication failures that were breaking builds.",
    skills: ["Azure DevOps", "CI/CD", "PowerShell"],
  },
  {
    title: "Help Desk Automation",
    impact: "Turned recurring tickets into scripts & insight",
    blurb:
      "Worked IT and mobile-app tickets through KACE and wrote PowerShell scripts to automate the repetitive ones. Pulled ticket data in SQL to spot recurring problems and bridge communication between business units and IT.",
    skills: ["PowerShell", "SQL"],
  },
  {
    title: "Post Mortem",
    impact: "Computer Science capstone, Franklin University",
    blurb:
      "My Franklin University capstone: a web platform where people can share and discuss horror media. Built end to end with Blazor and hosted on Azure.",
    skills: ["Blazor", "C#", ".NET", "Azure"],
  },
  {
    title: "Tech Corps Program Analytics",
    impact: "Steered STEM outreach toward girls in CS",
    blurb:
      "Compiled and analyzed SurveyMonkey responses in Python to measure student interest and confidence. The findings shaped where the programs went next, including a push to get more young girls into computer science.",
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
