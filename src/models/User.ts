import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  email: string;
  name: string;
  password?: string;
  subscriptionPlan: "free" | "pro";
  role: "admin" | "manager" | "viewer";
  tokenUsage: number;
  tokenLimit: number;
  subscriptionStatus: "active" | "warning_sent" | "exhausted" | "past_due";
  paymentMandateId?: string;
  autoRenew: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  parentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String },
    subscriptionPlan: { type: String, enum: ["free", "pro"], default: "free" },
    role: { type: String, enum: ["admin", "manager", "viewer"], default: "admin" },
    tokenUsage: { type: Number, default: 0 },
    tokenLimit: { type: Number, default: 100 },
    subscriptionStatus: { type: String, enum: ["active", "warning_sent", "exhausted", "past_due"], default: "active" },
    paymentMandateId: { type: String },
    autoRenew: { type: Boolean, default: false },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    parentId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

if (mongoose.models.User) {
  delete mongoose.models.User;
}
export const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
