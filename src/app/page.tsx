import { connection } from "next/server";
import GameScreen from "@/components/GameScreen";
import LoginScreen from "@/components/LoginScreen";
import SetupNotice from "@/components/SetupNotice";
import { missingEnv, verifySession } from "@/lib/dal";
import { loadOrCreatePet } from "@/lib/petRepository";

export default async function Home() {
  // Env is read at request time; otherwise a build without secrets would prerender the setup notice forever.
  await connection();
  const missing = missingEnv();
  if (missing.length) return <SetupNotice missing={missing} />;

  const session = await verifySession();
  if (!session) return <LoginScreen />;

  const pet = await loadOrCreatePet(session.userId);
  return <GameScreen initialPet={pet} user={{ name: session.name, image: session.image }} />;
}
