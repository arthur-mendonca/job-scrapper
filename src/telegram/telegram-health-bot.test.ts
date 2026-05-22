import { describe, expect, it } from "vitest";
import {
  formatHealthError,
  formatHealthOk,
  isAllowedChat,
  isHealthCommand,
  parseAllowedChatIds,
} from "./telegram-health-bot.js";

describe("telegram health bot helpers", () => {
  it("parses allowlist chat ids", () => {
    const allowed = parseAllowedChatIds("123, 456", "");
    expect([...allowed]).toEqual(["123", "456"]);
  });

  it("falls back to TELEGRAM_CHAT_ID when allowlist is empty", () => {
    const allowed = parseAllowedChatIds("", "999");
    expect(isAllowedChat(999, allowed)).toBe(true);
  });

  it("detects /health command", () => {
    expect(isHealthCommand("/health")).toBe(true);
    expect(isHealthCommand("/health now")).toBe(true);
    expect(isHealthCommand("/start")).toBe(false);
  });

  it("formats safe ok response", () => {
    const message = formatHealthOk({
      status: "ok",
      database: "ok",
      uptimeSeconds: 12,
      timestamp: "2026-01-01T00:00:00.000Z",
    });
    expect(message).toContain("Health: ok");
    expect(message).not.toMatch(/https?:\/\//i);
    expect(message).not.toMatch(/x-internal-api-secret/i);
  });

  it("formats safe error response", () => {
    const message = formatHealthError();
    expect(message).toContain("Health: error");
    expect(message).not.toMatch(/https?:\/\//i);
    expect(message).not.toMatch(/x-internal-api-secret/i);
  });
});
