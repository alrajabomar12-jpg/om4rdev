import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";

/** Every successful mutation: the public page re-renders on its next request, no redeploy. */
export function revalidatePublic({ roblox = false } = {}) {
  // Game list changes alter which Roblox data the page needs; drop the cached responses outright.
  if (roblox) revalidateTag("roblox", { expire: 0 });
  revalidatePath("/");
}
