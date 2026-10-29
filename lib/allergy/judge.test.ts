import { describe, expect, it } from "vitest";

import { judgeAllergens } from "@/lib/allergy/judge";

describe("judgeAllergens", () => {
  it("알레르기 표시란에 설정 항목이 있으면 표시에 있다고 알린다", () => {
    const result = judgeAllergens({
      selected: ["우유", "계란"],
      ingredients: "옥수수, 식물성유지, 쌀, 설탕",
      allergenLabel: "우유, 대두, 밀, 계란, 닭고기, 쇠고기 함유",
    });

    expect(result.findings).toEqual([
      { item: "우유", where: "label", message: "알레르기 표시에 우유가 있습니다" },
      { item: "계란", where: "label", message: "알레르기 표시에 계란이 있습니다" },
    ]);
    expect(result.labelNotice).toBeNull();
  });

  it("표시란에는 없지만 원재료명에서 발견되면 원재료명에 있다고 알린다", () => {
    const result = judgeAllergens({
      selected: ["우유"],
      ingredients: "밀가루, 설탕, 탈지분유, 정제소금",
      allergenLabel: "대두 함유",
    });

    expect(result.findings).toEqual([
      { item: "우유", where: "ingredients", message: "원재료명에 우유가 있습니다" },
    ]);
  });

  it("표시란과 원재료명 어디에도 없으면 둘 다에 없다고 알린다", () => {
    const result = judgeAllergens({
      selected: ["우유", "계란"],
      ingredients: "맥아당시럽, 설탕, 리치주스, 카라기난, 펙틴",
      allergenLabel: "대두 함유",
    });

    expect(result.findings).toEqual([
      { item: "우유", where: "none", message: "알레르기 표시와 원재료명에 우유가 없습니다" },
      { item: "계란", where: "none", message: "알레르기 표시와 원재료명에 계란이 없습니다" },
    ]);
  });

  it("알레르기 표시란이 없으면 안내 문구를 함께 돌려주고 원재료명은 계속 검사한다", () => {
    const result = judgeAllergens({
      selected: ["우유", "계란"],
      ingredients: "맥아당시럽, 설탕, 리치주스, 카라기난, 펙틴",
      allergenLabel: null,
    });

    expect(result.labelNotice).toBe(
      "이 제품 정보에는 알레르기 표시란이 없습니다. 원재료명만 확인하세요"
    );
    expect(result.findings.map((f) => f.where)).toEqual(["none", "none"]);
  });

  it("같은 뜻의 다른 표기를 같은 항목으로 본다", () => {
    const result = judgeAllergens({
      selected: ["계란"],
      ingredients: "밀가루, 달걀흰자분말, 설탕",
      allergenLabel: null,
    });

    expect(result.findings[0]).toMatchObject({ item: "계란", where: "ingredients" });
  });

  it("띄어쓰기가 달라도 찾는다", () => {
    const result = judgeAllergens({
      selected: ["우유"],
      ingredients: "설탕, 탈지 분유",
      allergenLabel: null,
    });

    expect(result.findings[0]).toMatchObject({ item: "우유", where: "ingredients" });
  });

  it("설정 항목이 없으면 항목별 결과 없이 표시란 안내만 돌려준다", () => {
    const result = judgeAllergens({
      selected: [],
      ingredients: "설탕",
      allergenLabel: null,
    });

    expect(result.findings).toEqual([]);
    expect(result.labelNotice).not.toBeNull();
  });
});
