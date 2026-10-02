import VisitScreen from "@/components/VisitScreen";

export default async function VisitPage({ params }: PageProps<"/visit/[uid]">) {
  const { uid } = await params;
  return <VisitScreen uid={uid} />;
}
