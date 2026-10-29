import { describe, expect, it } from "vitest";

import { parseReading } from "@/lib/snack-lookup/reading";

describe("parseReading", () => {
  it("모델이 돌려준 JSON에서 원재료명과 알레르기 표시란을 꺼낸다", () => {
    const reading = parseReading(
      '{"found": true, "ingredients": "설탕, 물엿", "allergenLabel": "우유, 대두 함유"}'
    );

    expect(reading).toEqual({
      ingredients: "설탕, 물엿",
      allergenLabel: "우유, 대두 함유",
    });
  });

  it("코드 블록으로 감싸져 있어도 읽는다", () => {
    const reading = parseReading(
      '읽은 결과입니다.\n```json\n{"found": true, "ingredients": "쌀, 설탕", "allergenLabel": null}\n```'
    );

    expect(reading).toEqual({ ingredients: "쌀, 설탕", allergenLabel: null });
  });

  it("비어 있는 알레르기 표시란은 표시란이 없는 것으로 본다", () => {
    const reading = parseReading(
      '{"found": true, "ingredients": "쌀", "allergenLabel": "  "}'
    );

    expect(reading?.allergenLabel).toBeNull();
  });

  it("원재료명을 찾지 못했거나 JSON이 아니면 읽지 못한 것으로 본다", () => {
    expect(parseReading('{"found": false, "ingredients": null, "allergenLabel": null}')).toBeNull();
    expect(parseReading('{"found": true, "ingredients": "", "allergenLabel": null}')).toBeNull();
    expect(parseReading("원재료를 찾을 수 없습니다")).toBeNull();
  });
});
