import { nextSortOrder } from "@/lib/admin/reorder";
import { revalidatePublic } from "@/lib/admin/revalidate";
import { adminRoute, HttpError, json, readJson } from "@/lib/auth/guard";
import { verifyUpload } from "@/lib/blob";
import { getDb, schema } from "@/lib/db";
import { effectiveAlt, showcaseCreateSchema } from "@/lib/validation";

// Commit one finished showcase upload. Width/height come from the browser and must match the file.
export const POST = adminRoute(async (req) => {
  const input = await readJson(req, showcaseCreateSchema);
  const blob = await verifyUpload(input.url, "showcase");
  if (blob.width !== input.width || blob.height !== input.height)
    throw new HttpError(400, `The image is ${blob.width}×${blob.height}, not ${input.width}×${input.height}.`);

  const [row] = await getDb()
    .insert(schema.showcaseItems)
    .values({
      imageUrl: blob.url,
      caption: input.caption,
      alt: effectiveAlt(input.alt, input.caption),
      width: blob.width,
      height: blob.height,
      sortOrder: await nextSortOrder("showcase"),
    })
    .returning({ id: schema.showcaseItems.id });
  revalidatePublic();
  return json({ id: row.id }, 201);
});
