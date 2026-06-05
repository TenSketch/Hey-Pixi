import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models";
import CreateBotClient from "./CreateBotClient";

export default async function CreateBotPage() {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin");

  await dbConnect();
  const dbUser = await User.findOne({ email: session.user.email });
  if (!dbUser) redirect("/dashboard");

  // Redirect viewer back to AI agents list page
  if (dbUser.role === "viewer") {
    redirect("/dashboard/bots");
  }

  return <CreateBotClient />;
}
