import { MissingConfigError } from "@/lib/snack-lookup/config";
import { readSourcePage } from "@/lib/snack-lookup/read-source";

export async function POST(request: Request) {
  const { url } = (await request.json().catch(() => ({}))) as { url?: unknown };

  if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
    return Response.json({ error: "invalid-url", message: "원문 페이지 주소가 올바르지 않습니다." }, { status: 400 });
  }

  try {
    const reading = await readSourcePage(url);
    return Response.json(reading ? { status: "read", ...reading } : { status: "unreadable" });
  } catch (error) {
    if (error instanceof MissingConfigError) {
      return Response.json({ error: "config", message: error.message }, { status: 503 });
    }
    console.error("원문 읽기 실패:", error instanceof Error ? error.message : error);
    return Response.json({ status: "unreadable" });
  }
}
