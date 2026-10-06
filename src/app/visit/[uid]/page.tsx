import { redirect } from "next/navigation";
import VisitScreen, { PupNotFound } from "@/components/VisitScreen";
import { verifySession } from "@/lib/dal";
import { getPet } from "@/lib/petRepository";

export default async function VisitPage({ params }: PageProps<"/visit/[uid]">) {
  const session = await verifySession();
  if (!session) redirect("/");

  const { uid } = await params;
  if (uid === session.userId) redirect("/");

  const pet = await getPet(uid);
  if (!pet) return <PupNotFound />;
  return <VisitScreen saved={pet} />;
}
