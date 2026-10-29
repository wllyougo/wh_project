import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Home from "@/app/page";

test("홈 화면은 간식 사진을 올리는 입력을 보여준다", () => {
  render(<Home />);

  expect(screen.getByRole("heading", { level: 1, name: "낱개 간식 확인" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "파일 선택" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "사진 찍기" })).toBeInTheDocument();
});
