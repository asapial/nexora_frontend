import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * POST /api/revalidate
 *
 * On-demand ISR cache purge for site content.
 * Called by SiteContentEditor immediately after a successful admin save
 * so changes appear on the home / public pages instantly instead of
 * waiting for the next ISR window.
 *
 * Body: { tag?: string }   — defaults to "site-content"
 */
export async function POST(req: NextRequest) {
  // Simple guard — must match the env secret (or skip in dev)
  const secret = req.headers.get("x-revalidate-secret");
  const expected = process.env.REVALIDATE_SECRET;

  if (expected && secret !== expected) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const tag: string = typeof body.tag === "string" && body.tag ? body.tag : "site-content";

    // Next.js 16: revalidateTag requires a second profile argument.
    // "default" profile (stale: 5 min, revalidate: 15 min) is the standard choice.
    revalidateTag(tag, "default");

    // Also purge the layout path so all pages under (main) get fresh data.
    revalidatePath("/", "layout");

    return NextResponse.json({ success: true, revalidated: tag, now: Date.now() });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: String(err) },
      { status: 500 },
    );
  }
}
