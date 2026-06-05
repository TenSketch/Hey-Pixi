import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProjectInvite extends Document {
  email: string;
  role: "admin" | "manager" | "viewer";
  invitedBy: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  status: "pending" | "accepted";
  createdAt: Date;
  updatedAt: Date;
}

const ProjectInviteSchema = new Schema<IProjectInvite>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ["admin", "manager", "viewer"], required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted"], default: "pending" },
  },
  { timestamps: true }
);

// ProjectInvite model is exported below
export const ProjectInvite: Model<IProjectInvite> = mongoose.models.ProjectInvite || mongoose.model<IProjectInvite>("ProjectInvite", ProjectInviteSchema);
