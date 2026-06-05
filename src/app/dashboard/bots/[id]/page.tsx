import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import { User, BotConfig } from "@/models";
import BotSettingsClient from "./BotSettingsClient";
import mongoose from "mongoose";

export default async function BotSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin");

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return <div className="p-8 text-center text-red-600 font-semibold bg-white border border-slate-200 rounded-xl shadow-sm max-w-md mx-auto">Invalid Bot ID format</div>;
  }

  await dbConnect();
  const dbUser = await User.findOne({ email: session.user.email });
  if (!dbUser) redirect("/dashboard");

  const { getActiveWorkspaceContextMongoose } = await import("@/lib/workspace");
  const { ownerId, role: effectiveRole } = await getActiveWorkspaceContextMongoose(dbUser);

  const bot = await BotConfig.findOne({ _id: id, userId: ownerId }).lean();
  if (!bot) {
    return <div className="p-8 text-center text-slate-500 font-medium bg-white border border-slate-200 rounded-xl shadow-sm max-w-md mx-auto">AI Agent not found or unauthorized access</div>;
  }

  // Serialize Mongoose object ids and dates to plain JSON strings
  const serializedBot = {
    ...bot,
    _id: bot._id.toString(),
    userId: bot.userId.toString(),
    createdAt: bot.createdAt ? (bot.createdAt as Date).toISOString() : undefined,
    updatedAt: bot.updatedAt ? (bot.updatedAt as Date).toISOString() : undefined,
  };

  return <BotSettingsClient initialBot={serializedBot} role={effectiveRole} />;
}
