import mongoose, { Schema, Document, Model } from "mongoose";

// --- User Schema ---
export interface IUser extends Document {
  email: string;
  name: string;
  password?: string; // Optional for OAuth users, required for Credentials
  subscriptionPlan: "free" | "pro";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String }, // Hashed password
    subscriptionPlan: { type: String, enum: ["free", "pro"], default: "free" },
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

// --- BotConfig Schema ---
export interface IBotConfig extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  role: string;
  url: string;
  systemPrompt: string;
  themeColor: string;
  isActive: boolean;
  notificationPhone?: string; // WhatsApp number to send leads to
  whatsAppOptIn?: boolean; // Whether the user has agreed to WhatsApp opt-in policy
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
    isActive: { type: Boolean, default: false }, // Requires payment to become active
    notificationPhone: { type: String },
    whatsAppOptIn: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Clear the model from cache in development to ensure schema changes like whatsAppOptIn are picked up
if (process.env.NODE_ENV === "development") {
  delete mongoose.models.BotConfig;
}

export const BotConfig: Model<IBotConfig> = mongoose.models.BotConfig || mongoose.model<IBotConfig>("BotConfig", BotConfigSchema);

// --- Lead Schema ---
export interface ILead extends Document {
  botId: mongoose.Types.ObjectId;
  name?: string;
  phone?: string;
  email?: string;
  lastMessage: string;
  transcript: unknown[]; // Array of message objects
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

// --- Payment Schema ---
export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  botId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  status: "successful" | "failed" | "pending";
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    botId: { type: Schema.Types.ObjectId, ref: "BotConfig", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String, required: true },
    razorpaySignature: { type: String, required: true },
    status: { type: String, enum: ["successful", "failed", "pending"], default: "pending" },
  },
  { timestamps: true }
);

export const Payment: Model<IPayment> = mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);
