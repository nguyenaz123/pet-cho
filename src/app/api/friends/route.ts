import { verifySession } from "@/lib/dal";
import { listOtherPlayers } from "@/lib/petRepository";

/** Other players' pets for the friends list. Signed-in players only. */
export async function GET() {
  const session = await verifySession();
  if (!session) return Response.json({ error: "Not signed in" }, { status: 401 });
  return Response.json(await listOtherPlayers(session.userId));
}
