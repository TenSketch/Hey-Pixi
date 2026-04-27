import { Lead, User, BotConfig } from "@/models";
import { sendLeadNotification } from "@/lib/mail";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import { BadRequestError } from "@/lib/errors";

import { ChatHistoryItem } from "./chat.service";

export class LeadService {
  static async captureLead(data: {
    botId: mongoose.Types.ObjectId;
    name: string;
    phone?: string;
    email?: string;
    lastMessage: string;
    history: ChatHistoryItem[];
    botSnapshot: { name: string };
  }) {
    // Basic validation
    if (!data.name) {
      throw new BadRequestError("Lead capture failed: Name is required");
    }

    if (!data.phone && !data.email) {
      throw new BadRequestError("Lead capture failed: Phone or Email is required");
    }

    await dbConnect();

    // Sanitize name
    const sanitizedName = data.name.trim().substring(0, 100);

    // Create the lead
    const lead = await Lead.create({
      botId: data.botId,
      name: sanitizedName,
      phone: data.phone?.trim(),
      email: data.email?.trim()?.toLowerCase(),
      lastMessage: data.lastMessage,
      transcript: data.history.concat({ text: data.lastMessage, sender: 'user' }), 
      status: "new"
    });

    // Send Email Notification to Bot Creator
    try {
      const bot = await BotConfig.findById(data.botId);
      if (bot) {
        const creator = await User.findById(bot.userId);
        if (creator?.email) {
          sendLeadNotification(creator.email, {
            name: sanitizedName,
            email: data.email,
            phone: data.phone,
            botName: data.botSnapshot.name
          }).catch(err => console.error("Email Notification Failed:", err));
        }
      }
    } catch (err) {
      console.error("Failed to trigger email notification:", err);
    }


    return lead;
  }
}
