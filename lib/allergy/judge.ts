import { ALLERGEN_CATALOG } from "@/lib/allergy/catalog";

export type FindingPlace = "label" | "ingredients" | "none";

export type AllergenFinding = {
  item: string;
  where: FindingPlace;
  message: string;
};

export type AllergenJudgement = {
  findings: AllergenFinding[];
  labelNotice: string | null;
};

type JudgeInput = {
  selected: string[];
  ingredients: string;
  allergenLabel: string | null;
};

const NO_LABEL_NOTICE =
  "이 제품 정보에는 알레르기 표시란이 없습니다. 원재료명만 확인하세요";

function squash(text: string): string {
  return text.replace(/\s+/g, "");
}

function mentions(text: string, item: string): boolean {
  const target = squash(text);
  const names = ALLERGEN_CATALOG[item] ?? [item];
  return names.some((name) => target.includes(squash(name)));
}

// 받침이 있으면 "이", 없으면 "가"를 붙인다.
function withSubject(word: string): string {
  const last = word.charCodeAt(word.length - 1);
  const hasFinal = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0;
  return `${word}${hasFinal ? "이" : "가"}`;
}

function describe(item: string, where: FindingPlace): string {
  const subject = withSubject(item);
  if (where === "label") return `알레르기 표시에 ${subject} 있습니다`;
  if (where === "ingredients") return `원재료명에 ${subject} 있습니다`;
  return `알레르기 표시와 원재료명에 ${subject} 없습니다`;
}

export function judgeAllergens({
  selected,
  ingredients,
  allergenLabel,
}: JudgeInput): AllergenJudgement {
  const hasLabel = allergenLabel !== null && allergenLabel.trim() !== "";

  const findings = selected.map((item): AllergenFinding => {
    let where: FindingPlace = "none";
    if (hasLabel && mentions(allergenLabel, item)) where = "label";
    else if (mentions(ingredients, item)) where = "ingredients";
    return { item, where, message: describe(item, where) };
  });

  return { findings, labelNotice: hasLabel ? null : NO_LABEL_NOTICE };
}
