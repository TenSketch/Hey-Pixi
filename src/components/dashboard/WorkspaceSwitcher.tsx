"use client";

import { useState, useRef, useEffect } from "react";
import { switchWorkspace } from "@/lib/actions/workspace-actions";
import { useRouter } from "next/navigation";
import { Building2, ChevronDown, User, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WorkspaceOption {
  id: string; // "personal" or the workspace owner's _id
  label: string;
  sublabel: string;
  isPersonal: boolean;
}

interface WorkspaceSwitcherProps {
  workspaces: WorkspaceOption[];
  activeWorkspaceId: string;
}

export function WorkspaceSwitcher({ workspaces, activeWorkspaceId }: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const activeWs = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSwitch = async (wsId: string) => {
    if (wsId === activeWorkspaceId) {
      setOpen(false);
      return;
    }
    setSwitching(true);
    try {
      await switchWorkspace(wsId);
      setOpen(false);
      router.refresh();
    } catch {
      console.error("Failed to switch workspace");
    } finally {
      setSwitching(false);
    }
  };

  // Don't render if user only has one workspace (no invite)
  if (workspaces.length <= 1) return null;

  return (
    <div ref={ref} className="relative px-4 pt-3 pb-1">
      <button
        onClick={() => setOpen(!open)}
        disabled={switching}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left",
          "bg-slate-50 border-slate-200 hover:border-brand/40 hover:bg-white",
          open && "border-brand/40 bg-white shadow-sm"
        )}
      >
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold",
          activeWs.isPersonal
            ? "bg-gradient-to-br from-slate-500 to-slate-700"
            : "bg-gradient-to-br from-indigo-500 to-violet-600"
        )}>
          {activeWs.isPersonal
            ? <User size={14} />
            : <Building2 size={14} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800 truncate">{activeWs.label}</p>
          <p className="text-[10px] text-slate-400 truncate">{activeWs.sublabel}</p>
        </div>
        <ChevronDown size={14} className={cn(
          "text-slate-400 shrink-0 transition-transform",
          open && "rotate-180"
        )} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-4 right-4 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Switch Workspace</p>
          </div>
          {workspaces.map((ws) => {
            const isActive = ws.id === activeWorkspaceId;
            return (
              <button
                key={ws.id}
                onClick={() => handleSwitch(ws.id)}
                disabled={switching}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                  isActive
                    ? "bg-brand/5"
                    : "hover:bg-slate-50"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold",
                  ws.isPersonal
                    ? "bg-gradient-to-br from-slate-500 to-slate-700"
                    : "bg-gradient-to-br from-indigo-500 to-violet-600"
                )}>
                  {ws.isPersonal ? <User size={12} /> : <Building2 size={12} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-xs font-semibold truncate",
                    isActive ? "text-brand" : "text-slate-700"
                  )}>{ws.label}</p>
                  <p className="text-[10px] text-slate-400 truncate">{ws.sublabel}</p>
                </div>
                {isActive && (
                  <Check size={14} className="text-brand shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
