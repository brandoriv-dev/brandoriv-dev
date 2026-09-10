export const serviceName = "brandoriv-personal-context";
export const serviceDisplayName = "Brandon's Personal Context";
export const serviceVersion = "1.4.0";
export const serviceEndpoint = "https://brandoriv.dev/mcp";

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
