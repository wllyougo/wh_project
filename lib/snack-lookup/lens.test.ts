import { describe, expect, it } from "vitest";

import { parseLensCandidates } from "@/lib/snack-lookup/lens";

const match = (title: string, link: string, extra: object = {}) => ({
  title,
  link,
  source: "shop.example",
  thumbnail: `${link}/thumb.jpg`,
  ...extra,
});

describe("parseLensCandidates", () => {
  it("이미지 검색의 비슷한 이미지 결과에서 후보를 최대 3개까지 순서대로 만든다", () => {
    const candidates = parseLensCandidates({
      visual_matches: [
        match("까먹는 젤리 복숭아맛 A사", "https://a.example/1"),
        match("까먹는 젤리 리치맛 B사", "https://b.example/2"),
        match("까먹는 젤리 C사", "https://c.example/3"),
        match("까먹는 젤리 D사", "https://d.example/4"),
      ],
    });

    expect(candidates.map((c) => c.title)).toEqual([
      "까먹는 젤리 복숭아맛 A사",
      "까먹는 젤리 리치맛 B사",
      "까먹는 젤리 C사",
    ]);
    expect(candidates[0]).toEqual({
      title: "까먹는 젤리 복숭아맛 A사",
      link: "https://a.example/1",
      source: "shop.example",
      thumbnail: "https://a.example/1/thumb.jpg",
    });
  });

  it("같은 링크는 한 번만 담고 제목이나 링크가 없는 항목은 건너뛴다", () => {
    const candidates = parseLensCandidates({
      visual_matches: [
        match("제품 A", "https://a.example/1"),
        match("제품 A 중복", "https://a.example/1"),
        { title: "링크 없음" },
        { link: "https://x.example/9" },
        match("제품 B", "https://b.example/2"),
      ],
    });

    expect(candidates.map((c) => c.title)).toEqual(["제품 A", "제품 B"]);
  });

  it("블로그, 카페, SNS, 영상 후기는 제조사 표시사항이 아니므로 후보에서 뺀다", () => {
    const candidates = parseLensCandidates({
      visual_matches: [
        match("후기 블로그", "https://blog.naver.com/abc/1"),
        match("후기 카페", "https://cafe.naver.com/xyz/2"),
        match("티스토리 후기", "https://snack.tistory.com/3"),
        match("인스타", "https://www.instagram.com/p/4"),
        match("영상", "https://www.youtube.com/watch?v=5"),
        match("다이소몰 제품", "https://www.daisomall.co.kr/pd/6"),
      ],
    });

    expect(candidates.map((c) => c.title)).toEqual(["다이소몰 제품"]);
  });

  it("비슷한 이미지 결과가 없으면 빈 목록을 돌려준다", () => {
    expect(parseLensCandidates({})).toEqual([]);
    expect(parseLensCandidates(null)).toEqual([]);
  });
});
