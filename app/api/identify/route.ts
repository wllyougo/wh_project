import { MissingConfigError } from "@/lib/snack-lookup/config";
import { identifyCandidates } from "@/lib/snack-lookup/identify";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const image = (await request.formData()).get("image");

  if (!(image instanceof File) || !image.type.startsWith("image/")) {
    return Response.json({ error: "invalid-image", message: "이미지 파일을 올려 주세요." }, { status: 400 });
  }
  if (image.size > MAX_UPLOAD_BYTES) {
    return Response.json({ error: "too-large", message: "사진이 너무 큽니다. 8MB 이하로 올려 주세요." }, { status: 400 });
  }

  try {
    return Response.json({ candidates: await identifyCandidates(image) });
  } catch (error) {
    if (error instanceof MissingConfigError) {
      return Response.json({ error: "config", message: error.message }, { status: 503 });
    }
    return Response.json({ error: "upstream", message: "후보를 찾는 중 오류가 났습니다." }, { status: 502 });
  }
}
