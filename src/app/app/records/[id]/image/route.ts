import { RecordNotFoundError } from "@/domain/record/errors";
import { createRecordsServer } from "@/infrastructure/container";

// GET /app/records/[id]/image — R2 사진 전달 (§6-4). 버킷 공개 주소 없이 이 경로로만 연다. 기록이나 사진이 없으면 404
export async function GET(_: Request, { params }: RouteContext<"/app/records/[id]/image">) {
  const { id } = await params;
  const server = await createRecordsServer();
  const record = await server.get.execute(id).catch((e) => {
    if (e instanceof RecordNotFoundError) return null;
    throw e;
  });
  const image = record?.imageKey ? await server.images.get(record.imageKey) : null;
  if (!image) return new Response(null, { status: 404 });
  return new Response(image.body, {
    headers: { "Content-Type": image.contentType, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
