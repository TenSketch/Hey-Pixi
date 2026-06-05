import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin");

  await dbConnect();
  
  const db = mongoose.connection.db;
  if (!db) redirect("/dashboard");
  
  const usersCol = db.collection("users");
  
  let dbUser = await usersCol.findOne({ email: session.user.email });
  if (!dbUser) {
    // If not found, create them to prevent empty profile errors
    await usersCol.insertOne({
      email: session.user.email as string,
      name: session.user.name || "User",
      subscriptionPlan: "free",
      role: "admin",
      tokenUsage: 0,
      tokenLimit: 100,
      subscriptionStatus: "active",
      autoRenew: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    dbUser = await usersCol.findOne({ email: session.user.email });
  }

  if (!dbUser) {
    redirect("/dashboard");
  }

  const { getActiveWorkspaceContextMongoose } = await import("@/lib/workspace");
  const { ownerId, role: effectiveRole, isPersonal } = await getActiveWorkspaceContextMongoose(dbUser);

  // Fetch workspace owner info if this user is acting as a child member in the current context
  let ownerInfo: { name: string; email: string } | undefined;
  if (!isPersonal) {
    const ownerUser = await usersCol.findOne({ _id: ownerId });
    if (ownerUser) {
      ownerInfo = { name: ownerUser.name as string, email: ownerUser.email as string };
    }
  }

  // Serialize to plain JSON for client rendering
  const serializedUser = {
    _id: dbUser._id.toString(),
    name: dbUser.name || "User",
    email: dbUser.email,
    parentId: isPersonal ? undefined : ownerId.toString(),
    role: effectiveRole,
    subscriptionPlan: dbUser.subscriptionPlan || "free",
    tokenUsage: dbUser.tokenUsage !== undefined ? dbUser.tokenUsage : 0,
    tokenLimit: dbUser.tokenLimit || 100,
    subscriptionStatus: dbUser.subscriptionStatus || "active",
    autoRenew: !!dbUser.autoRenew,
    createdAt: dbUser.createdAt ? new Date(dbUser.createdAt as Date).toISOString() : undefined,
    updatedAt: dbUser.updatedAt ? new Date(dbUser.updatedAt as Date).toISOString() : undefined,
    ownerInfo,
  };

  return <ProfileClient user={serializedUser} />;
}
