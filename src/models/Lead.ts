import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILead extends Document {
  botId: mongoose.Types.ObjectId;
  name?: string;
  phone?: string;
  email?: string;
  lastMessage: string;
  transcript: unknown[];
  status: "new" | "contacted" | "resolved";
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    botId: { type: Schema.Types.ObjectId, ref: "BotConfig", required: true },
    name: { type: String },
    phone: { type: String },
    email: { type: String },
    lastMessage: { type: String },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transcript: { type: [Schema.Types.Mixed], default: [] } as any,
    status: { type: String, enum: ["new", "contacted", "resolved"], default: "new" },
  },
  { timestamps: true }
);

export const Lead: Model<ILead> = mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);
