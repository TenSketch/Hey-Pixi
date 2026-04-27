import { NextResponse } from "next/server";
import { LeadService } from "@/lib/services/lead.service";
import { BotConfig } from "@/models";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { botId, name, email, phone, selectedService, lastMessage } = body;

        if (!botId || !name) {
            return NextResponse.json({ error: "BotId and Name are required" }, { status: 400 });
        }

        if (!mongoose.Types.ObjectId.isValid(botId)) {
            return NextResponse.json({ error: "Invalid Bot ID" }, { status: 400 });
        }

        await dbConnect();
        const bot = await BotConfig.findById(botId);
        if (!bot) {
            return NextResponse.json({ error: "Bot not found" }, { status: 404 });
        }

        // Capture lead using the service
        // We pass the selected service as part of the context or last message
        const lead = await LeadService.captureLead({
            botId: new mongoose.Types.ObjectId(botId),
            name,
            email,
            phone,
            lastMessage: lastMessage || `Interested in: ${selectedService || 'Service'}`,
            history: [], // No history for direct form submission
            botSnapshot: { name: bot.name }
        });

        return NextResponse.json({ success: true, leadId: lead._id });
    } catch (error: unknown) {
        console.error("Public Lead Capture Error:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
