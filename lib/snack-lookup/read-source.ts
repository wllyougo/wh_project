import { requireEnv } from "@/lib/snack-lookup/config";
import { extractPageContent } from "@/lib/snack-lookup/page";
import { parseReading, READING_INSTRUCTION, type Reading } from "@/lib/snack-lookup/reading";

const BROWSER_HEADERS = { "user-agent": "Mozilla/5.0 (compatible; allergy-mate)" };
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
// 추적용 1픽셀 이미지처럼 너무 작은 파일은 모델이 처리하지 못해 요청 전체가 실패한다.
const MIN_IMAGE_BYTES = 8 * 1024;
const MAX_MODEL_IMAGES = 5;
const DEFAULT_MODEL = "claude-sonnet-5-5";

type ImageBlock = {
  type: "image";
  source: { type: "base64"; media_type: string; data: string };
};

async function downloadImage(url: string, referer: string): Promise<ImageBlock | null> {
  try {
    const response = await fetch(url, {
      headers: { ...BROWSER_HEADERS, referer },
      signal: AbortSignal.timeout(10_000),
    });
    const type = response.headers.get("content-type")?.split(";")[0] ?? "";
    if (!response.ok || !IMAGE_TYPES.includes(type)) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < MIN_IMAGE_BYTES || bytes.length > MAX_IMAGE_BYTES) return null;
    return {
      type: "image",
      source: { type: "base64", media_type: type, data: bytes.toString("base64") },
    };
  } catch {
    return null;
  }
}

// ANTHROPIC_CUSTOM_HEADERS는 "이름: 값" 형태를 줄바꿈으로 이어 쓴다. 사내 게이트웨이가 요구하는 헤더를 그대로 보낸다.
function customHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const line of (process.env.ANTHROPIC_CUSTOM_HEADERS ?? "").split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator > 0) headers[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return headers;
}

async function askModel(text: string, images: ImageBlock[]): Promise<string> {
  const { ANTHROPIC_API_KEY } = requireEnv("ANTHROPIC_API_KEY");
  const base = process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com";

  const response = await fetch(`${base}/v1/messages`, {
    method: "POST",
    headers: {
      ...customHeaders(),
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      authorization: `Bearer ${ANTHROPIC_API_KEY}`,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [...images, { type: "text", text: `${READING_INSTRUCTION}\n\n페이지 글자:\n${text}` }],
        },
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 300);
    throw new Error(`원문 읽기 모델 호출 실패 (${response.status}) ${detail}`);
  }

  const data = (await response.json()) as { content?: { type: string; text?: string }[] };
  return data.content?.find((block) => block.type === "text")?.text ?? "";
}

// 후보의 원문 페이지를 읽어 원재료명과 알레르기 표시란을 돌려준다. 읽지 못하면 null.
export async function readSourcePage(pageUrl: string): Promise<Reading | null> {
  let html: string;
  try {
    const page = await fetch(pageUrl, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(12_000),
    });
    if (!page.ok) return null;
    html = await page.text();
  } catch {
    return null;
  }

  const { text, imageUrls } = extractPageContent(html, pageUrl);
  const downloaded = await Promise.all(imageUrls.map((url) => downloadImage(url, pageUrl)));
  const images = downloaded
    .filter((image): image is ImageBlock => image !== null)
    .slice(0, MAX_MODEL_IMAGES);

  try {
    return parseReading(await askModel(text, images));
  } catch (error) {
    if (images.length === 0) throw error;
    // 이미지 하나가 문제여도 페이지 글자만으로는 읽을 수 있으니 이미지 없이 한 번 더 시도한다.
    console.error("이미지 포함 읽기 실패, 글자만으로 재시도:", error instanceof Error ? error.message : error);
    return parseReading(await askModel(text, []));
  }
}
