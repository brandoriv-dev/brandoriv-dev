import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";

const url = process.env.MCP_URL ?? "http://127.0.0.1:8791/mcp";
const token = process.env.MCP_BEARER_TOKEN;
const endpoint = new URL(url);
const loopbackHostnames = new Set(["localhost", "127.0.0.1", "[::1]"]);
const modernProtocol = "2026-07-28";
const expectedTools = ["list_preference_categories", "get_preferences", "get_guidance"];

if (!token) throw new Error("Set MCP_BEARER_TOKEN before running the MCP smoke test.");
if (endpoint.protocol !== "https:" && !loopbackHostnames.has(endpoint.hostname)) {
  throw new Error("Refusing to send MCP_BEARER_TOKEN over cleartext to a non-loopback host.");
}

const modern = await exerciseClient({
  name: "brandoriv-mcp-smoke",
  versionNegotiation: { mode: { pin: modernProtocol } },
  expectedProtocol: modernProtocol,
});

const legacy = await exerciseClient({
  name: "brandoriv-mcp-legacy-smoke",
  versionNegotiation: { mode: "legacy" },
});

const report = {
  ok: true,
  url,
  modern,
  legacy,
};
console.log(JSON.stringify(report, null, 2));

async function exerciseClient({ name, versionNegotiation, expectedProtocol }) {
  const client = new Client({ name, version: "1.0.0" }, { versionNegotiation });
  const transport = new StreamableHTTPClientTransport(endpoint, {
    authProvider: { token: async () => token },
  });

  try {
    await client.connect(transport);

    const instructions = client.getInstructions() ?? "";
    assert(instructions.slice(0, 512).includes("get_guidance"), `${name}: initialization instructions name get_guidance`);

    const { tools } = await client.listTools();
    const toolNames = tools.map(({ name }) => name);
    assertEqual(toolNames, expectedTools, `${name} tool list`);
    assert(
      tools.every(
        ({ annotations }) =>
          annotations?.readOnlyHint === true &&
          annotations.destructiveHint === false &&
          annotations.idempotentHint === true &&
          annotations.openWorldHint === false
      ),
      `${name}: every tool is annotated as read-only, non-destructive, idempotent, and closed-world`
    );

    const guidance = await client.callTool({
      name: "get_guidance",
      arguments: { task: "Debug this SQL exception", language: "C#", framework: ".NET" },
    });
    const guidanceText = guidance.content.find((item) => item.type === "text")?.text ?? "";
    assert(!guidance.isError, `${name}: get_guidance succeeds`);
    assert(guidanceText.includes("TL;DR:"), `${name}: guidance includes the TL;DR rule`);
    assert(guidanceText.includes("official documentation"), `${name}: guidance includes the official-documentation rule`);

    const communication = await client.callTool({
      name: "get_preferences",
      arguments: { category: "communication" },
    });
    assert(!communication.isError, `${name}: get_preferences retrieves one category`);
    assertEqual(communication.structuredContent?.categories, ["communication"], `${name} single preference category`);

    const fullPolicy = await client.callTool({ name: "get_preferences", arguments: { category: "all" } });
    assert(!fullPolicy.isError, `${name}: get_preferences retrieves an explicitly requested policy audit`);
    assert(fullPolicy.structuredContent?.categories?.length === 8, `${name}: full policy contains every category`);

    const missingScope = await client.callTool({ name: "get_preferences", arguments: {} });
    assert(missingScope.isError === true, `${name}: get_preferences rejects an implicit full-policy dump`);

    const protocol = client.getNegotiatedProtocolVersion();
    if (expectedProtocol) {
      assert(protocol === expectedProtocol, `${name}: modern protocol version is pinned`);
    } else {
      assert(protocol !== modernProtocol, `${name}: legacy client stays on a 2025 protocol`);
    }

    return {
      server: client.getServerVersion(),
      protocol: protocol,
      tools: toolNames,
      guidanceCategories: guidance.structuredContent?.categories,
    };
  } finally {
    await client.close().catch(() => {});
  }
}

function assertEqual(actual, expected, label) {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`
  );
}

function assert(condition, message) {
  if (!condition) throw new Error(`MCP smoke test failed: ${message}`);
}
