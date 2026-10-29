"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CameraIcon, ClipboardPasteIcon, ImageUpIcon } from "lucide-react";

import { CandidateResults } from "@/components/candidate-results/candidate-results";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useStoredValue } from "@/hooks/use-stored-value";
import { ALLERGY_SETTINGS_KEY, NO_ALLERGENS } from "@/lib/allergy/settings";
import {
  appendRecord,
  type CandidateOutcome,
  type CandidateReading,
} from "@/lib/check-history/record";
import type { Candidate } from "@/lib/snack-lookup/lens";
import { blobToDataUrl, resizeImage } from "@/lib/snack-lookup/resize-image";

type Phase =
  | { name: "idle" }
  | { name: "identifying" }
  | { name: "none" }
  | { name: "error"; message: string; file?: File }
  | { name: "done"; outcomes: CandidateOutcome[] };

async function readCandidate(url: string): Promise<CandidateReading> {
  try {
    const response = await fetch("/api/read", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await response.json();
    if (response.ok && data.status === "read") {
      return { status: "read", ingredients: data.ingredients, allergenLabel: data.allergenLabel };
    }
  } catch {
    // 읽지 못한 것으로 처리한다.
  }
  return { status: "unreadable" };
}

export function SnackChecker() {
  const [selected, , hydrated] = useStoredValue(ALLERGY_SETTINGS_KEY, NO_ALLERGENS);
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const runCount = useRef(0);
  const selectedRef = useRef(selected);
  const runRef = useRef<(file: File) => void>(() => {});
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  async function run(file: File) {
    if (!file.type.startsWith("image/")) {
      setPhase({ name: "error", message: "이미지 파일만 올릴 수 있습니다." });
      return;
    }

    const runId = ++runCount.current;
    const isCurrent = () => runCount.current === runId;
    setPhase({ name: "identifying" });

    let upload: Blob;
    let photo: string;
    try {
      upload = await resizeImage(file, 1500);
      photo = await blobToDataUrl(await resizeImage(file, 240, 0.7));
    } catch {
      setPhase({ name: "error", message: "이 사진은 열 수 없습니다. JPG나 PNG 사진으로 올려 주세요." });
      return;
    }

    let candidates: Candidate[];
    try {
      const body = new FormData();
      body.set("image", upload, "snack.jpg");
      const response = await fetch("/api/identify", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      candidates = data.candidates;
    } catch (error) {
      if (isCurrent()) {
        setPhase({
          name: "error",
          message: error instanceof Error && error.message ? error.message : "후보를 찾는 중 오류가 났습니다.",
          file,
        });
      }
      return;
    }
    if (!isCurrent()) return;

    const save = (outcomes: CandidateOutcome[]) =>
      appendRecord({
        id: crypto.randomUUID(),
        checkedAt: new Date().toISOString(),
        photo,
        selected: selectedRef.current,
        outcomes,
      });

    if (candidates.length === 0) {
      save([]);
      setPhase({ name: "none" });
      return;
    }

    const outcomes: CandidateOutcome[] = candidates.map((candidate) => ({
      candidate,
      reading: { status: "pending" },
    }));
    setPhase({ name: "done", outcomes: [...outcomes] });

    await Promise.all(
      candidates.map(async (candidate, index) => {
        outcomes[index] = { candidate, reading: await readCandidate(candidate.link) };
        if (isCurrent()) setPhase({ name: "done", outcomes: [...outcomes] });
      })
    );
    save(outcomes);
  }

  useEffect(() => {
    runRef.current = run;
  });

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const image = Array.from(event.clipboardData?.files ?? []).find((f) =>
        f.type.startsWith("image/")
      );
      if (image) runRef.current(image);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  function pick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) run(file);
  }

  return (
    <div className="flex flex-col gap-6">
      {hydrated && selected.length === 0 && (
        <Alert>
          <AlertTitle className="font-bold text-chart-4">설정하신 알레르기 항목이 아직 없습니다</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col">
            <span>
              <Link href="/settings" className="font-bold text-primary underline underline-offset-4">
                알레르기 설정
              </Link>
              에서 항목을 고르면 결과에 설정하신 항목이 있는지 바로 알려 드립니다.
            </span>
            <span>설정하지 않아도 원재료명과 알레르기 표시는 볼 수 있습니다.</span>
          </AlertDescription>
        </Alert>
      )}

      <Card
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files[0];
          if (file) run(file);
        }}
      >
        <CardHeader>
          <CardTitle>간식 사진 올리기</CardTitle>
          <CardDescription className="flex flex-col text-xs">
            <span>포장 글씨가 보이게 찍어 주세요.</span>
            <span>사진은 후보를 찾기 위해 외부 이미지 검색 서비스에 잠시 전달됩니다.</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col items-center gap-1 rounded-lg border-2 border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            <ClipboardPasteIcon className="size-5" />
            <span>여기에 사진을 붙여넣거나(Ctrl+V) 끌어다 놓으세요</span>
          </div>
          <div className="flex flex-wrap gap-3">
          <Button onClick={() => fileInput.current?.click()} disabled={phase.name === "identifying"}>
            <ImageUpIcon data-icon="inline-start" />
            파일 선택
          </Button>
          <Button
            variant="outline"
            onClick={() => cameraInput.current?.click()}
            disabled={phase.name === "identifying"}
          >
            <CameraIcon data-icon="inline-start" />
            사진 찍기
          </Button>
          <input ref={fileInput} type="file" accept="image/*" hidden onChange={pick} aria-label="사진 파일 선택" />
          <input
            ref={cameraInput}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={pick}
            aria-label="사진 찍기"
          />
          </div>
        </CardContent>
      </Card>

      {phase.name === "identifying" && (
        <div className="flex flex-col gap-3" role="status">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> 후보를 찾는 중입니다…
          </p>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {phase.name === "none" && (
        <Alert>
          <AlertTitle>확인 불가</AlertTitle>
          <AlertDescription>
            이 사진으로는 제품 후보를 찾지 못했습니다. 포장 글씨가 잘 보이는 다른 사진으로 다시 올려 보세요.
          </AlertDescription>
        </Alert>
      )}

      {phase.name === "error" && (
        <Alert variant="destructive">
          <AlertTitle>확인하지 못했습니다</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            <span>{phase.message}</span>
            {phase.file && (
              <Button variant="outline" size="sm" onClick={() => run(phase.file as File)}>
                다시 시도
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {phase.name === "done" && (
        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-semibold">제품 후보</h2>
          <p className="text-sm text-muted-foreground">
            사진과 같은 제품이 맞는지 이미지와 제조사를 확인하세요. 앱은 먹어도 되는지 판단하지 않고, 제품 정보에 적힌 내용만 보여 줍니다.
          </p>
          <CandidateResults outcomes={phase.outcomes} selected={selected} />
        </section>
      )}
    </div>
  );
}
