import { defaultCatalog, type CatalogNode } from "./catalog.ts";

export interface PolicyVersion extends CatalogNode {
  updatedAt: string;
  changeNote: string;
}

export interface PolicyStore {
  readonly durable: boolean;
  list(): Promise<PolicyVersion[]>;
  versions(id: string): Promise<PolicyVersion[]>;
  save(input: Omit<PolicyVersion, "version" | "updatedAt">): Promise<PolicyVersion>;
}

interface KvLike {
  get<T = unknown>(key: string, type: "json"): Promise<T | null>;
  put(key: string, value: string): Promise<void>;
}

export function createPolicyStore(kv?: KvLike): PolicyStore {
  const defaults = defaultCatalog.map((node) => ({
    ...node,
    updatedAt: node.reviewedAt,
    changeNote: "Repository baseline",
  }));

  return {
    durable: Boolean(kv),
    async list() {
      if (!kv) return defaults;
      return Promise.all(
        defaults.map(async (fallback) => {
          const active = await kv.get<PolicyVersion>(`active:${fallback.id}`, "json");
          return active ? withCurrentCatalogMetadata(fallback, active) : fallback;
        })
      );
    },
    async versions(id) {
      const fallback = defaults.find((node) => node.id === id);
      if (!kv) return fallback ? [fallback] : [];
      return (await kv.get<PolicyVersion[]>(`versions:${id}`, "json")) ?? (fallback ? [fallback] : []);
    },
    async save(input) {
      if (!kv) throw new Error("Policy storage is not configured.");
      const history = await this.versions(input.id);
      const now = new Date().toISOString();
      const next: PolicyVersion = {
        ...input,
        version: Math.max(0, ...history.map(({ version }) => version)) + 1,
        updatedAt: now,
        reviewedAt: now,
      };
      const nextHistory = [...history, next];
      await kv.put(`version:${next.id}:${next.version}`, JSON.stringify(next));
      await kv.put(`versions:${next.id}`, JSON.stringify(nextHistory));
      await kv.put(`active:${next.id}`, JSON.stringify(next));
      return next;
    },
  };
}

function withCurrentCatalogMetadata(fallback: PolicyVersion, active: PolicyVersion): PolicyVersion {
  return {
    ...fallback,
    ...active,
    reviewedAt: active.reviewedAt ?? active.updatedAt ?? fallback.reviewedAt,
    relatedSkills: fallback.relatedSkills,
    relatedTools: fallback.relatedTools,
  };
}
