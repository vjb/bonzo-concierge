/**
 * POST /api/tts
 *
 * Proxies text to ElevenLabs TTS and returns audio/mpeg.
 * Body: { text: string }
 */
export const dynamic = "force-dynamic";

const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // "Rachel" - clear, professional

export async function POST(req: Request) {
  const { text } = await req.json();

  if (!text || typeof text !== "string") {
    return new Response("Missing text", { status: 400 });
  }

  const apiKey = process.env.ELEVEN_LABS_KEY;
  if (!apiKey) {
    return new Response("ElevenLabs API key not configured", { status: 500 });
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_flash_v2_5",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("[TTS] ElevenLabs error:", err);
    return new Response(`TTS failed: ${err}`, { status: response.status });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-cache",
    },
  });
}
