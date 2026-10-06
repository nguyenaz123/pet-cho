import { verifySession } from "@/lib/dal";
import { parsePet, savePet } from "@/lib/petRepository";

/**
 * Saves the signed-in user's pet. A Route Handler rather than a Server Action so the
 * client can send it with `fetch(..., { keepalive: true })`, which survives tab close.
 */
export async function PUT(request: Request) {
  const session = await verifySession();
  if (!session) return Response.json({ error: "Not signed in" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const pet = parsePet(body, session.userId);
  if (!pet) return Response.json({ error: "Invalid pet data" }, { status: 400 });

  await savePet(pet);
  return new Response(null, { status: 204 });
}
