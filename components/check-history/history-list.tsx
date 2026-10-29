"use client";

import { HistoryIcon } from "lucide-react";

import { CandidateResults } from "@/components/candidate-results/candidate-results";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useStoredValue } from "@/hooks/use-stored-value";
import { HISTORY_KEY, NO_RECORDS } from "@/lib/check-history/record";

const dateFormat = new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" });

export function HistoryList() {
  const [records, , hydrated] = useStoredValue(HISTORY_KEY, NO_RECORDS);

  if (!hydrated) return <Skeleton className="h-24 w-full" />;

  if (records.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HistoryIcon />
          </EmptyMedia>
          <EmptyTitle>확인한 간식이 아직 없습니다</EmptyTitle>
          <EmptyDescription>간식 사진을 확인하면 이곳에 기록이 남습니다.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Accordion>
      {records.map((record) => (
        <AccordionItem key={record.id} value={record.id}>
          <AccordionTrigger>
            <span className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={record.photo} alt="" className="size-12 shrink-0 rounded-md object-cover" />
              <span className="flex flex-col gap-0.5">
                <span>{dateFormat.format(new Date(record.checkedAt))}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {record.outcomes.length === 0
                    ? "확인 불가"
                    : `후보 ${record.outcomes.length}개 · ${record.outcomes[0].candidate.title}`}
                </span>
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {record.outcomes.length === 0 ? (
              <Alert>
                <AlertTitle>확인 불가</AlertTitle>
                <AlertDescription>이 사진으로는 제품 후보를 찾지 못했습니다.</AlertDescription>
              </Alert>
            ) : (
              <CandidateResults
                outcomes={record.outcomes.map((o) =>
                  o.reading.status === "pending" ? { ...o, reading: { status: "unreadable" } } : o
                )}
                selected={record.selected}
              />
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
