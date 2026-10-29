import { SnackChecker } from "@/components/snack-check/snack-checker";

export default function Home() {
  return (
    <>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">낱개 간식 확인</h1>
      <SnackChecker />
    </>
  );
}
