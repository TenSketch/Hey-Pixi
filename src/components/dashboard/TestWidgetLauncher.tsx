"use client";

import { Button } from "@/components/ui/Button";

interface TestWidgetLauncherProps {
    botId: string;
}

export function TestWidgetLauncher({ botId }: TestWidgetLauncherProps) {
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mt-8">
            <h3 className="font-bold text-slate-900 text-lg mb-2">Test Your Agent</h3>
            <p className="text-slate-500 mb-4 text-sm">
                You can try out your fully functioning AI agent right from here.
            </p>
            <Button
                onClick={() => {
                    const width = 450;
                    const height = 750;
                    const left = (window.screen.width - width) / 2;
                    const top = (window.screen.height - height) / 2;
                    window.open(
                        `/widget/${botId}`, 
                        "_blank", 
                        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
                    );
                }}
                className="bg-brand hover:bg-brand-dark"
            >
                Launch Test Chat
            </Button>
        </div>
    );
}
