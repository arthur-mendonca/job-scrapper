import { env } from "../config/env.js";
import { logger } from "../logger/logger.js";
import { fetchJson } from "../utils/http.js";
import { sleep } from "../utils/sleep.js";
import {
  formatHealthError,
  formatHealthOk,
  isAllowedChat,
  isHealthCommand,
  parseAllowedChatIds,
  type HealthResponse,
} from "../telegram/telegram-health-bot.js";

interface TelegramChat {
  id: number;
}

interface TelegramMessage {
  message_id: number;
  chat: TelegramChat;
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

interface TelegramGetUpdatesResponse {
  ok: boolean;
  result: TelegramUpdate[];
}

interface TelegramSendMessageResponse {
  ok: boolean;
}

async function main(): Promise<void> {
  if (!env.TELEGRAM_BOT_TOKEN) {
    logger.error("TELEGRAM_BOT_TOKEN is required for telegram health bot");
    process.exitCode = 1;
    return;
  }

  const allowedChats = parseAllowedChatIds(
    env.TELEGRAM_COMMAND_ALLOWED_CHAT_IDS,
    env.TELEGRAM_CHAT_ID,
  );
  if (allowedChats.size === 0) {
    logger.error(
      "No authorized Telegram chat IDs configured for telegram health bot",
    );
    process.exitCode = 1;
    return;
  }

  logger.info(
    { allowedChats: [...allowedChats] },
    "Telegram health bot started",
  );

  let offset = 0;
  while (true) {
    try {
      const updates = await getUpdates(offset);
      for (const update of updates) {
        offset = Math.max(offset, update.update_id + 1);
        await handleUpdate(update, allowedChats);
      }
    } catch (error) {
      logger.error({ err: error }, "Telegram polling failed");
      await sleep(env.TELEGRAM_POLL_INTERVAL_MS);
    }
  }
}

async function getUpdates(offset: number): Promise<TelegramUpdate[]> {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getUpdates?timeout=30&offset=${offset}`;
  const response = await fetchJson<TelegramGetUpdatesResponse>(url, {
    timeoutMs: 35000,
  });
  if (!response.ok) {
    throw new Error("Telegram getUpdates failed");
  }
  return response.result ?? [];
}

async function handleUpdate(
  update: TelegramUpdate,
  allowedChats: Set<string>,
): Promise<void> {
  const message = update.message;
  const chatId = message?.chat?.id;
  if (!message || chatId === undefined) return;
  if (!isAllowedChat(chatId, allowedChats)) return;

  const text = (message.text ?? "").trim();
  if (!text) return;

  if (isHealthCommand(text)) {
    const reply = await handleHealthCommand();
    await sendMessage(chatId, reply);
  }
}

async function handleHealthCommand(): Promise<string> {
  const url = `${env.INTERNAL_API_BASE_URL.replace(/\/$/, "")}/health`;

  try {
    const health = await fetchJson<HealthResponse>(url, {
      timeoutMs: 10000,
    });
    return formatHealthOk(health);
  } catch (error) {
    logger.error({ err: error }, "Internal health check failed");
    return formatHealthError();
  }
}

async function sendMessage(chatId: number, text: string): Promise<void> {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  const body = (await response
    .json()
    .catch(() => null)) as TelegramSendMessageResponse | null;
  if (!response.ok || !body?.ok) {
    throw new Error(`Telegram sendMessage failed: ${response.status}`);
  }
}

main().catch((error) => {
  logger.error({ err: error }, "Telegram health bot crashed");
  process.exitCode = 1;
});
