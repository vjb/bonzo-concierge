/**
 * Phase 4 Test: API Route Integration
 * Starts the Next.js dev server, sends a mock chat request,
 * and verifies the streaming response.
 */
import * as dotenv from "dotenv";
dotenv.config();

const API_URL = "http://localhost:3000/api/chat";

async function waitForServer(
  url: string,
  timeoutMs = 30000
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: "HEAD" }).catch(() => null);
      // 405 = Method Not Allowed (means server is up, just doesn't support HEAD)
      if (res && (res.ok || res.status === 405)) return;
    } catch {
      /* server not ready yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server not ready after ${timeoutMs}ms`);
}

async function main() {
  console.log("[INFO] Sending POST to /api/chat...");
  console.log('[INFO] Prompt: "What can you help me with?"');

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: "What can you help me with?",
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API returned ${res.status}: ${body}`);
  }

  console.log(`[SUCCESS] Response status: ${res.status}`);
  console.log(`[SUCCESS] Content-Type: ${res.headers.get("content-type")}`);

  // Read the streaming response
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    fullText += decoder.decode(value, { stream: true });
  }

  console.log(`[SUCCESS] Stream length: ${fullText.length} bytes`);
  console.log("[STREAM PREVIEW] First 500 chars:");
  console.log(fullText.slice(0, 500));

  if (fullText.length === 0) {
    throw new Error("Empty response — streaming failed.");
  }

  console.log("\n[DONE] API route test passed.");
}

main().catch((err) => {
  console.error("[FAIL]", err);
  process.exit(1);
});
