import { describe, expect, it } from "vitest";

import { extractPageContent } from "@/lib/snack-lookup/page";

describe("extractPageContent", () => {
  it("스크립트와 스타일을 빼고 보이는 글자만 남긴다", () => {
    const { text } = extractPageContent(
      `<html><head><style>.a{color:red}</style><script>var x=1</script></head>
       <body><h1>까먹는 젤리</h1><p>원재료명 : 설탕,&nbsp;물엿 &amp; 향료</p></body></html>`,
      "https://shop.example/p/1"
    );

    expect(text).toBe("까먹는 젤리 원재료명 : 설탕, 물엿 & 향료");
  });

  it("이미지 주소를 절대 주소로 바꾸고 로고, 아이콘, svg는 뺀다", () => {
    const { imageUrls } = extractPageContent(
      `<img src="/detail/ingredients.jpg">
       <img data-src="https://cdn.example/detail2.png">
       <img src="/img/logo.png">
       <img src="/img/icon-cart.png">
       <img src="/img/banner.svg">
       <img src="/detail/ingredients.jpg">`,
      "https://shop.example/p/1"
    );

    expect(imageUrls).toEqual([
      "https://shop.example/detail/ingredients.jpg",
      "https://cdn.example/detail2.png",
    ]);
  });

  it("이미지는 8개까지만 담는다", () => {
    const html = Array.from({ length: 12 }, (_, i) => `<img src="/d/${i}.jpg">`).join("");

    expect(extractPageContent(html, "https://shop.example/").imageUrls).toHaveLength(8);
  });
});
