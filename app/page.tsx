import { redirect } from "next/navigation";
import { readTeamCookie } from "./lib/cookies";

export const dynamic = "force-dynamic";

export default async function Home() {
  const team = await readTeamCookie();
  if (!team) redirect("/onboarding");
  redirect("/dashboard");
}
