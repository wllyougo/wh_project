import { ExternalLinkIcon } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { judgeAllergens } from "@/lib/allergy/judge";
import type { CandidateOutcome } from "@/lib/check-history/record";

function SourceLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-medium underline underline-offset-4"
    >
      원문 페이지 열기
      <ExternalLinkIcon className="size-3.5" />
    </a>
  );
}

function OutcomeBody({ outcome, selected }: { outcome: CandidateOutcome; selected: string[] }) {
  const { candidate, reading } = outcome;

  if (reading.status === "pending") {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-2/3" />
      </div>
    );
  }

  if (reading.status === "unreadable") {
    return (
      <div className="flex flex-col gap-3">
        <Alert>
          <AlertDescription>
            자동으로 읽지 못했습니다. 원문 페이지에서 원재료명과 알레르기 표시를 직접 확인하세요.
          </AlertDescription>
        </Alert>
        <SourceLink href={candidate.link} />
      </div>
    );
  }

  const { findings, labelNotice } = judgeAllergens({
    selected,
    ingredients: reading.ingredients,
    allergenLabel: reading.allergenLabel,
  });

  return (
    <div className="flex flex-col gap-4">
      {findings.length > 0 && (
        <ul className="flex flex-col gap-2">
          {findings.map((finding) => (
            <li key={finding.item} className="flex items-center gap-2">
              <Badge variant={finding.where === "none" ? "secondary" : "destructive"}>
                {finding.item}
              </Badge>
              <span className="font-medium">{finding.message}</span>
            </li>
          ))}
        </ul>
      )}

      <section className="flex flex-col gap-1">
        <h4 className="text-xs font-medium text-muted-foreground">알레르기 표시</h4>
        {reading.allergenLabel ? (
          <p className="rounded-md border-2 border-foreground p-3 font-semibold">
            {reading.allergenLabel}
          </p>
        ) : (
          <Alert>
            <AlertDescription>{labelNotice}</AlertDescription>
          </Alert>
        )}
      </section>

      <section className="flex flex-col gap-1">
        <h4 className="text-xs font-medium text-muted-foreground">원재료명</h4>
        <p>{reading.ingredients}</p>
      </section>

      <SourceLink href={candidate.link} />
    </div>
  );
}

export function CandidateResults({
  outcomes,
  selected,
}: {
  outcomes: CandidateOutcome[];
  selected: string[];
}) {
  return (
    <Accordion multiple defaultValue={outcomes.slice(0, 1).map((o) => o.candidate.link)}>
      {outcomes.map((outcome) => (
        <AccordionItem key={outcome.candidate.link} value={outcome.candidate.link}>
          <AccordionTrigger>
            <span className="flex items-center gap-3">
              {outcome.candidate.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={outcome.candidate.thumbnail}
                  alt=""
                  className="size-12 shrink-0 rounded-md object-cover"
                />
              )}
              <span className="flex flex-col gap-0.5">
                <span>{outcome.candidate.title}</span>
                {outcome.candidate.source && (
                  <span className="text-xs font-normal text-muted-foreground">
                    {outcome.candidate.source}
                  </span>
                )}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <OutcomeBody outcome={outcome} selected={selected} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
