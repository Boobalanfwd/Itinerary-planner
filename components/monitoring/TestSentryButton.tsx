"use client";

import React, { useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { Bug, ChevronUp, ChevronDown, Server, Zap, Check, ExternalLink, FileDown } from "lucide-react";
import { toast } from "sonner";

const SENTRY_DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  "https://ff56689599c6020af5ac855e47ab0424@o4512140035489792.ingest.us.sentry.io/4512140041322496";

function ensureClientSentry() {
  if (!Sentry.getClient()) {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV ?? "development",
      tracesSampleRate: 1.0,
      debug: false,
    });
  }
}

export function TestSentryButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  const [loadingServer, setLoadingServer] = useState(false);
  const [loadingClient, setLoadingClient] = useState(false);

  // 1. Client Handled Exception
  const handleClientError = async () => {
    setLoadingClient(true);
    ensureClientSentry();
    try {
      throw new Error(`Sentry Client Test Error: Wander.AI verified at ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      const eventId = Sentry.captureException(err, {
        tags: {
          test: "manual_sentry_button",
          runtime: "browser",
          page: "/",
        },
        extra: {
          timestamp: new Date().toISOString(),
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
        },
      });
      setLastEventId(eventId);
      
      // Ensure the network transport flushes immediately to Sentry ingest
      await Sentry.flush(3000);

      toast.success(`Client Error sent to Sentry! Event ID: ${eventId}`, {
        duration: 7000,
        action: {
          label: "Copy ID",
          onClick: () => {
            navigator.clipboard.writeText(eventId);
            toast.info("Event ID copied to clipboard!");
          },
        },
      });
      console.log("[Sentry Test] Sent client exception with Event ID:", eventId);
    } finally {
      setLoadingClient(false);
    }
  };

  // 2. Unhandled Exception (Simulate crash)
  const handleUnhandledError = () => {
    ensureClientSentry();
    toast.info("Triggering unhandled exception in 100ms...");
    setTimeout(() => {
      throw new Error(`Sentry Unhandled Crash Test: Wander.AI uncaught error at ${new Date().toLocaleTimeString()}`);
    }, 100);
  };

  // 3. Server-side Sentry Exception via API
  const handleServerError = async () => {
    setLoadingServer(true);
    try {
      const res = await fetch("/api/sentry-test", { method: "POST" });
      const data = await res.json();
      if (data.eventId) {
        setLastEventId(data.eventId);
        toast.success(`Server Error sent to Sentry! Event ID: ${data.eventId}`, {
          duration: 7000,
          action: {
            label: "Copy ID",
            onClick: () => {
              navigator.clipboard.writeText(data.eventId);
              toast.info("Event ID copied to clipboard!");
            },
          },
        });
      } else {
        toast.error("Server test returned without event ID");
      }
    } catch {
      toast.error("Failed to call server Sentry test endpoint");
    } finally {
      setLoadingServer(false);
    }
  };

  // 4. Capture Message / Breadcrumb
  const handleCaptureMessage = async () => {
    ensureClientSentry();
    const eventId = Sentry.captureMessage(
      `Sentry Test Message: Manual check from / page (${new Date().toLocaleTimeString()})`,
      "info"
    );
    setLastEventId(eventId);
    await Sentry.flush(3000);
    toast.info(`Info message logged to Sentry! Event ID: ${eventId}`, {
      duration: 7000,
      action: {
        label: "Copy ID",
        onClick: () => navigator.clipboard.writeText(eventId),
      },
    });
  };

  return (
    <div className="fixed bottom-24 left-5 sm:bottom-8 sm:left-8 z-40 flex flex-col items-start gap-2">
      {/* Options Popup when expanded */}
      {isOpen && (
        <div className="bg-card/95 backdrop-blur-xl border border-border/80 rounded-2xl shadow-soft-xl p-3 mb-1 w-68 space-y-1.5 animate-in fade-in slide-in-from-bottom-2">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1 flex items-center justify-between">
            <span>Sentry Diagnostics</span>
            <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-mono">v11</span>
          </div>

          <button
            type="button"
            disabled={loadingClient}
            onClick={handleClientError}
            className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold hover:bg-muted/80 transition-colors flex items-center gap-2 text-foreground cursor-pointer disabled:opacity-50"
          >
            <Bug className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <div className="flex flex-col">
              <span>Client Error (Handled)</span>
              <span className="text-[10px] text-muted-foreground font-normal">captureException() + flush</span>
            </div>
          </button>

          <button
            type="button"
            onClick={handleUnhandledError}
            className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold hover:bg-muted/80 transition-colors flex items-center gap-2 text-foreground cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <div className="flex flex-col">
              <span>Unhandled Crash</span>
              <span className="text-[10px] text-muted-foreground font-normal">throw uncaught error</span>
            </div>
          </button>

          <button
            type="button"
            disabled={loadingServer}
            onClick={handleServerError}
            className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold hover:bg-muted/80 transition-colors flex items-center gap-2 text-foreground cursor-pointer disabled:opacity-50"
          >
            <Server className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <div className="flex flex-col">
              <span>Server-side Error</span>
              <span className="text-[10px] text-muted-foreground font-normal">POST /api/sentry-test</span>
            </div>
          </button>

          <button
            type="button"
            onClick={handleCaptureMessage}
            className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold hover:bg-muted/80 transition-colors flex items-center gap-2 text-foreground cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <div className="flex flex-col">
              <span>Log Info Message</span>
              <span className="text-[10px] text-muted-foreground font-normal">captureMessage() + flush</span>
            </div>
          </button>

          <div className="pt-2 border-t border-border/50 space-y-1">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-0.5">
              PDF Export (Dev Mode)
            </div>

            <button
              type="button"
              onClick={() => {
                const link = document.createElement("a");
                link.href = "/api/itineraries/demo/export/pdf";
                link.download = "wander-ai-paris-sample-5d.pdf";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("Downloading 5-Day Paris Demo PDF...");
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-muted/80 transition-colors flex items-center gap-2 text-foreground cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-primary shrink-0" />
              <div className="flex flex-col">
                <span>Download Demo PDF</span>
                <span className="text-[10px] text-muted-foreground font-normal">Paris 5D sample (.pdf download)</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => window.open("/api/itineraries/demo/export/pdf?inline=1", "_blank")}
              className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-muted/80 transition-colors flex items-center gap-2 text-foreground cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <div className="flex flex-col">
                <span>Preview Demo PDF</span>
                <span className="text-[10px] text-muted-foreground font-normal">Instant in-browser viewer tab</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                const link = document.createElement("a");
                link.href = "/api/itineraries/sample/export/pdf";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("Downloading Latest Trip from Database...");
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-muted/80 transition-colors flex items-center gap-2 text-foreground cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <div className="flex flex-col">
                <span>Download Latest DB Trip</span>
                <span className="text-[10px] text-muted-foreground font-normal">Latest itinerary in local DB</span>
              </div>
            </button>
          </div>

          {lastEventId && (
            <div className="pt-2 border-t border-border/60 px-2 flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="truncate">Event: <span className="font-mono text-foreground">{lastEventId.slice(0, 10)}...</span></span>
              <a
                href={`https://wanderai.sentry.io/issues/?query=${lastEventId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
              >
                View <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Main Pill Button */}
      <div className="flex items-center shadow-soft-lg rounded-full bg-card/95 backdrop-blur-xl border border-border/80 hover:border-primary/50 transition-all p-1">
        <button
          type="button"
          disabled={loadingClient}
          onClick={handleClientError}
          title="Click to trigger Sentry test error"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-foreground hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <Bug className="w-3.5 h-3.5 text-red-500" />
          <span>{loadingClient ? "Sending..." : "Test Sentry"}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Toggle Sentry test options"
          className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
