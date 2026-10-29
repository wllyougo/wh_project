const MAX_IMAGES = 8;
const MAX_TEXT = 8000;
const SKIPPED_IMAGE = /logo|icon|sprite|blank|pixel|\.svg(\?|$)/i;

function toAbsolute(src: string, baseUrl: string): string | null {
  try {
    return new URL(src, baseUrl).toString();
  } catch {
    return null;
  }
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// 원문 페이지 HTML에서 보이는 글자와 상세 이미지 주소를 뽑는다.
export function extractPageContent(
  html: string,
  baseUrl: string
): { text: string; imageUrls: string[] } {
  const imageUrls: string[] = [];
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const src = /\b(?:data-src|data-original|src)=["']([^"']+)["']/i.exec(match[0])?.[1];
    if (!src || SKIPPED_IMAGE.test(src)) continue;
    const absolute = toAbsolute(src, baseUrl);
    if (absolute && !imageUrls.includes(absolute)) imageUrls.push(absolute);
    if (imageUrls.length === MAX_IMAGES) break;
  }

  const text = decodeEntities(
    html
      .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT);

  return { text, imageUrls };
}
