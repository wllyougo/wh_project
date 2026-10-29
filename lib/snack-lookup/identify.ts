import { requireEnv } from "@/lib/snack-lookup/config";
import { parseLensCandidates, type Candidate } from "@/lib/snack-lookup/lens";

const IMAGE_HOST_URL = "https://api.imgbb.com/1/upload";
const SERPAPI_URL = "https://serpapi.com";
const HOSTED_SECONDS = 600;

// 이미지 검색은 공개 주소만 받으므로 사진을 잠깐 올려 둘 주소를 만든다. 10분 뒤 사라진다.
async function hostTempImage(image: File): Promise<string> {
  const { IMGBB_API_KEY } = requireEnv("IMGBB_API_KEY");
  const base = process.env.IMGBB_API_URL ?? IMAGE_HOST_URL;
  const body = new FormData();
  body.set("image", Buffer.from(await image.arrayBuffer()).toString("base64"));

  const response = await fetch(
    `${base}?key=${encodeURIComponent(IMGBB_API_KEY)}&expiration=${HOSTED_SECONDS}`,
    { method: "POST", body }
  );
  if (!response.ok) throw new Error(`이미지 호스팅 실패 (${response.status})`);
  const url = ((await response.json()) as { data?: { url?: string } }).data?.url;
  if (!url) throw new Error("이미지 호스팅 응답에 주소가 없습니다");
  return url;
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
  return parseLensCandidates(await searchLens(imageUrl));
}
