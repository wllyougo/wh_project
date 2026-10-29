import { del, put } from "@vercel/blob";

import { MissingConfigError, requireEnv } from "@/lib/snack-lookup/config";
import { parseLensCandidates, type Candidate } from "@/lib/snack-lookup/lens";

const SERPAPI_URL = "https://serpapi.com";

// 이미지 검색은 공개 주소만 받으므로 사진을 잠깐 올려 둘 주소를 만든다. 검색이 끝나면 지운다.
async function hostTempImage(image: File): Promise<string> {
  // 배포 환경은 스토어 ID와 Vercel 인증으로, 로컬은 읽기·쓰기 토큰으로 접근한다.
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    throw new MissingConfigError(["BLOB_STORE_ID"]);
  }
  const blob = await put(`snack-${crypto.randomUUID()}.jpg`, image, {
    access: "public",
    contentType: image.type || "image/jpeg",
  });
  return blob.url;
}

async function searchLens(imageUrl: string): Promise<unknown> {
  const { SERPAPI_KEY } = requireEnv("SERPAPI_KEY");
  const base = process.env.SERPAPI_BASE_URL ?? SERPAPI_URL;
  const query = new URLSearchParams({
    engine: "google_lens",
    url: imageUrl,
    hl: "ko",
    country: "kr",
    api_key: SERPAPI_KEY,
  });

  const response = await fetch(`${base}/search.json?${query}`);
  if (!response.ok) throw new Error(`이미지 검색 실패 (${response.status})`);
  return response.json();
}

export async function identifyCandidates(image: File): Promise<Candidate[]> {
  const imageUrl = await hostTempImage(image);
  try {
    return parseLensCandidates(await searchLens(imageUrl));
  } finally {
    await del(imageUrl).catch(() => {});
  }
}
