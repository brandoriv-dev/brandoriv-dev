export const serviceName = "brandoriv.mcp";
export const serviceDisplayName = "brandoriv.mcp";
export const serviceVersion = "1.14.0";
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
  "Brandon's canonical cross-project agent preferences live here. The compact baseline below applies to every response. Before substantive work, inspect enough context to identify the task mode, language, framework, and artifacts, then call get_guidance once with what is known. Explicit categories add to inferred guidance. Use get_preferences only for a named policy audit and category=\"all\" only for a full audit.";

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
