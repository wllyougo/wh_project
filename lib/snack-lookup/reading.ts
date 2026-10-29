export type Reading = {
  ingredients: string;
  allergenLabel: string | null;
};

export const READING_INSTRUCTION = `아래는 식품 판매 페이지의 글자와 상세 이미지입니다. 포장 표시사항에서 두 가지를 있는 그대로 옮겨 적으세요.
1. 원재료명 (원재료명 및 함량 전체)
2. 알레르기 표시란 (원재료명 옆에 따로 적힌 "우유, 대두 함유" 같은 알레르기 유발물질 표시. 없으면 null)
보이지 않는 내용을 추측해서 채우지 마세요. 원재료명을 찾을 수 없으면 found를 false로 하세요.
다른 설명 없이 다음 JSON 하나만 답하세요.
{"found": true, "ingredients": "...", "allergenLabel": "..." 또는 null}`;

// 모델 응답에서 JSON을 꺼내 원재료명과 알레르기 표시란을 돌려준다. 읽지 못했으면 null.
export function parseReading(modelText: string): Reading | null {
  const json = /\{[\s\S]*\}/.exec(modelText)?.[0];
  if (!json) return null;

  let parsed: { found?: unknown; ingredients?: unknown; allergenLabel?: unknown };
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }

  if (parsed.found !== true) return null;
  if (typeof parsed.ingredients !== "string" || parsed.ingredients.trim() === "") return null;

  const label =
    typeof parsed.allergenLabel === "string" && parsed.allergenLabel.trim() !== ""
      ? parsed.allergenLabel.trim()
      : null;

  return { ingredients: parsed.ingredients.trim(), allergenLabel: label };
}
