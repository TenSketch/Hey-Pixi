import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBotConfig extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  role: string;
  url: string;
  systemPrompt: string;
  themeColor: string;
  isActive: boolean;
  notificationPhone?: string;
  whatsAppOptIn?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BotConfigSchema = new Schema<IBotConfig>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    url: { type: String },
    systemPrompt: { type: String, required: true },
    themeColor: { type: String, default: "#0f172a" },
    isActive: { type: Boolean, default: false },
    notificationPhone: { type: String },
    whatsAppOptIn: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const BotConfig: Model<IBotConfig> = mongoose.models.BotConfig || mongoose.model<IBotConfig>("BotConfig", BotConfigSchema);
