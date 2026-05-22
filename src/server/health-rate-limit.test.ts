import { describe, expect, it, vi } from "vitest";

async function build() {
  vi.resetModules();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? "test";
  const { buildServer } = await import("./server.js");
  return buildServer();
}

describe("/health rate limit", () => {
  it("rate-limits repeated requests", async () => {
    const app = await build();

    let saw429 = false;
    for (let i = 0; i < 40; i += 1) {
      const res = await app.inject({
        method: "GET",
        url: "/health",
        remoteAddress: "203.0.113.10",
      });
      if (res.statusCode === 429) {
        saw429 = true;
        break;
      }
    }

    expect(saw429).toBe(true);
    await app.close();
  });
});
