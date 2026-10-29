import Link from "next/link";
import { CameraIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { HistoryList } from "@/components/check-history/history-list";

export default function HistoryPage() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">확인 기록</h1>
        <Link href="/" className={buttonVariants({ size: "sm" })}>
          <CameraIcon data-icon="inline-start" />
          간식 사진 올리기
        </Link>
      </div>
      <HistoryList />
    </>
  );
}
