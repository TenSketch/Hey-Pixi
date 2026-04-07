import dbConnect from "@/lib/mongodb";
import { BotConfig } from "@/models";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { notFound } from "next/navigation";

export default async function WidgetPage({ params }: { params: Promise<{ botId: string }> }) {
  const { botId } = await params;

  await dbConnect();
  const bot = await BotConfig.findById(botId);

  if (!bot) {
      return notFound();
  }

  if (!bot.isActive) {
      return <div className="text-sm p-4 font-mono bg-amber-50 text-amber-800 h-full border border-amber-200">This bot is currently inactive.</div>;
  }

  return (
      <div className="h-screen w-screen overflow-hidden bg-transparent">
          <ChatWindow botId={botId} botName={bot.name} themeColor={bot.themeColor} />
      </div>
  );
}
