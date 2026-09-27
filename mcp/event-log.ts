export type BstackEventType =
  | "jev.routing.shadow"
  | "bstack.visualize.capture"
  | "bstack.feedback.capture";

export interface EventLogConfig {
  endpoint?: string;
  token?: string;
  source?: string;
}

export interface BstackEvent {
  type: BstackEventType;
  timestamp?: string;
  payload: Record<string, unknown>;
}

export interface EventLogger {
  log(event: BstackEvent): void;
}

export function createEventLogger(
  config: EventLogConfig = {},
  ctx?: Pick<ExecutionContext, "waitUntil">,
  fetcher: typeof fetch = fetch
): EventLogger {
  return {
    log(event) {
      const payload = JSON.stringify({
        schemaVersion: 1,
        source: config.source ?? "brandoriv.dev/mcp",
        type: event.type,
        timestamp: event.timestamp ?? new Date().toISOString(),
        payload: event.payload,
      });

      if (!config.endpoint) {
        console.info("bstack event", safeConsoleEvent(event));
        return;
      }

      const headers = new Headers({ "Content-Type": "application/json" });
      if (config.token) headers.set("Authorization", `Bearer ${config.token}`);

      const send = fetcher(config.endpoint, {
        method: "POST",
        headers,
        body: payload,
      })
        .then(async (response) => {
          if (!response.ok) {
            console.warn("bstack event log failed", { type: event.type, status: response.status });
          }
        })
        .catch((error) => {
          console.warn("bstack event log failed", {
            type: event.type,
            message: error instanceof Error ? error.message : String(error),
          });
        });

      if (ctx) ctx.waitUntil(send);
      else void send;
    },
  };
}

function safeConsoleEvent(event: BstackEvent) {
  return {
    type: event.type,
    timestamp: event.timestamp,
    payloadKeys: Object.keys(event.payload).sort(),
  };
}
