import type { Candidate } from "@/lib/snack-lookup/lens";
import { readStoredJson, writeStored } from "@/lib/storage/local-store";

export const HISTORY_KEY = "allergy-mate:history";
export const NO_RECORDS: CheckRecord[] = [];

const MAX_RECORDS = 30;

export type CandidateReading =
  | { status: "pending" }
  | { status: "unreadable" }
  | { status: "read"; ingredients: string; allergenLabel: string | null };

export type CandidateOutcome = {
  candidate: Candidate;
  reading: CandidateReading;
};

// 확인 한 건. 사진 대신 작은 미리보기만 남기고, 그때의 알레르기 설정을 함께 담는다.
export type CheckRecord = {
  id: string;
  checkedAt: string;
  photo: string;
  selected: string[];
  outcomes: CandidateOutcome[];
};

export function appendRecord(record: CheckRecord): void {
  const current = readStoredJson<CheckRecord[]>(HISTORY_KEY, NO_RECORDS);
  writeStored(HISTORY_KEY, [record, ...current].slice(0, MAX_RECORDS));
}
