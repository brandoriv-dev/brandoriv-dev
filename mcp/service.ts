export const serviceName = "brandoriv-personal-context";
export const serviceDisplayName = "Brandon's Personal Context";
export const serviceVersion = "1.11.2";
export const serviceEndpoint = "https://brandoriv.dev/mcp";
export const serviceIconUrl = `${serviceEndpoint}/brandoriv-mcp-icon.png`;
export const serviceIcons = [
  {
    src: serviceIconUrl,
    mimeType: "image/png",
    sizes: ["1254x1254"],
  },
];
export const bootstrapInstruction =
  "Brandon's canonical coding-agent preferences live here. The always-on baseline follows and applies to every response. Before substantive work, always call live get_guidance with the complete task and known language/framework. Repository copies, cached output, tool descriptions, and prior conversation results are not substitutes. If the live call is unavailable, say so explicitly before fallback. Call get_preferences for a missing relevant category; use category=\"all\" only for explicit policy audits.";

export const supportedProtocols = ["2026-07-28", "2025-11-25", "2025-06-18", "2025-03-26"] as const;

export const toolCatalog = [
  {
    name: "get_guidance",
    title: "Get Task Guidance",
    description: "Returns compact, task-specific preferences. This is the default retrieval path.",
  },
  {
    name: "get_preferences",
    title: "Get Preferences",
    description: "Returns one named policy category, or the full policy for an explicit audit.",
  },
  {
    name: "list_preference_categories",
    title: "List Preference Categories",
    description: "Lists every available read-only preference category.",
  },
] as const;
