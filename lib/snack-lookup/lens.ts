export type Candidate = {
  title: string;
  link: string;
  source: string;
  thumbnail: string;
};

const MAX_CANDIDATES = 3;

// 후기와 SNS는 제조사의 포장 표시사항이 아니라서 근거로 쓰지 않는다.
const EXCLUDED_HOSTS = [
  "blog.naver.com",
  "cafe.naver.com",
  "tistory.com",
  "instagram.com",
  "youtube.com",
  "facebook.com",
  "brunch.co.kr",
];

function isExcluded(link: string): boolean {
  try {
    const host = new URL(link).hostname;
    return EXCLUDED_HOSTS.some((excluded) => host === excluded || host.endsWith(`.${excluded}`));
  } catch {
    return true;
  }
}

type RawMatch = {
  title?: unknown;
  link?: unknown;
  source?: unknown;
  thumbnail?: unknown;
};

// 이미지 검색(Google Lens) 응답의 비슷한 이미지 목록에서 후보를 만든다.
export function parseLensCandidates(response: unknown): Candidate[] {
  const matches = (response as { visual_matches?: RawMatch[] } | null)
    ?.visual_matches;
  if (!Array.isArray(matches)) return [];

  const seen = new Set<string>();
  const candidates: Candidate[] = [];

  for (const match of matches) {
    if (typeof match.title !== "string" || typeof match.link !== "string") continue;
    if (seen.has(match.link) || isExcluded(match.link)) continue;
    seen.add(match.link);
    candidates.push({
      title: match.title,
      link: match.link,
      source: typeof match.source === "string" ? match.source : "",
      thumbnail: typeof match.thumbnail === "string" ? match.thumbnail : "",
    });
    if (candidates.length === MAX_CANDIDATES) break;
  }

  return candidates;
}
