"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Power, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ConnectionState = "disconnected" | "connecting" | "ready" | "error" | "pressing";

interface PowerButtonCardProps {
  onQuick: (duration: number) => Promise<{ ack: string }>;
  onPress: () => Promise<{ ack: string }>;
  onRelease: () => Promise<{ ack: string }>;
  pollStatus: () => Promise<{ connected: boolean; deviceStatus: "online" | "offline" }>;
}

const LONG_PRESS_THRESHOLD = 500; // ms

export function PowerButtonCard({ onQuick, onPress, onRelease, pollStatus }: PowerButtonCardProps) {
  const [statusText, setStatusText] = useState("Tap to power on/off PC");
  const [state, setState] = useState<ConnectionState>("disconnected");
  const pressStartRef = useRef<number>(0);
  const isLongPressRef = useRef<boolean>(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMouseDownRef = useRef<boolean>(false);

  // Poll status on mount and periodically
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const status = await pollStatus();
        if (status.deviceStatus === "online") {
          setState("ready");
        } else {
          setState("disconnected");
        }
      } catch (error) {
        setState("error");
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [pollStatus]);

  const handlePressStart = () => {
    isMouseDownRef.current = true;
    pressStartRef.current = Date.now();
    isLongPressRef.current = false;

    // Clear any existing timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    // Start long press timer
    longPressTimerRef.current = setTimeout(async () => {
      if (!isMouseDownRef.current) return; // Button was released already
      
      // Long press detected - send live press
      isLongPressRef.current = true;
      setState("pressing");
      setStatusText("Holding button...");
      try {
        await onPress();
      } catch (error) {
        setState("error");
        setStatusText("Failed to press");
      }
    }, LONG_PRESS_THRESHOLD);
  };

  const handlePressEnd = async () => {
    if (!isMouseDownRef.current) return; // Not actually pressed
    
    isMouseDownRef.current = false;
    
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const duration = Date.now() - pressStartRef.current;

    if (isLongPressRef.current) {
      // Long press - send release
      setState("connecting");
      setStatusText("Releasing button...");
      try {
        const response = await onRelease();
        if (response.ack === "released") {
          setState("ready");
          setStatusText(`Button held for ${duration}ms`);
          setTimeout(() => setStatusText("Tap to power on/off PC"), 3000);
        } else {
          setState("error");
          setStatusText("Failed to release");
          setTimeout(() => {
            setState("ready");
            setStatusText("Tap to power on/off PC");
          }, 3000);
        }
      } catch (error) {
        setState("error");
        setStatusText("Failed to release");
        setTimeout(() => {
          setState("ready");
          setStatusText("Tap to power on/off PC");
        }, 3000);
      }
    } else {
      // Quick press - send immediate command
      setState("connecting");
      setStatusText("Sending quick press...");
      try {
        const quickDuration = Math.max(duration, 200); // Ensure minimum 200ms
        const response = await onQuick(quickDuration);
        if (response.ack === "executed") {
          setState("ready");
          setStatusText("Quick press executed!");
          setTimeout(() => setStatusText("Tap to power on/off PC"), 3000);
        } else if (response.ack === "timeout") {
          setState("error");
          setStatusText("Command sent but no acknowledgment");
          setTimeout(() => {
            setState("ready");
            setStatusText("Tap to power on/off PC");
          }, 3000);
        } else {
          setState("error");
          setStatusText(`ESP32 error: ${response.ack}`);
          setTimeout(() => {
            setState("ready");
            setStatusText("Tap to power on/off PC");
          }, 3000);
        }
      } catch (error) {
        setState("error");
        setStatusText("Failed to send command");
        setTimeout(() => {
          setState("ready");
          setStatusText("Tap to power on/off PC");
        }, 3000);
      }
    }
  };

  const stateConfig = {
    disconnected: {
      buttonBg: "bg-neutral-800 hover:bg-neutral-700",
      iconColor: "text-neutral-500",
      statusDot: "bg-neutral-500",
      statusText: "Disconnected",
      statusColor: "text-neutral-500",
    },
    connecting: {
      buttonBg: "bg-amber-900/30 hover:bg-amber-900/40",
      iconColor: "text-amber-500",
      statusDot: "bg-amber-500 animate-pulse",
      statusText: "Sending...",
      statusColor: "text-amber-500",
    },
    pressing: {
      buttonBg: "bg-emerald-600 scale-95",
      iconColor: "text-white",
      statusDot: "bg-emerald-500 animate-pulse",
      statusText: "Pressing...",
      statusColor: "text-emerald-500",
    },
    ready: {
      buttonBg: "bg-emerald-900/30 hover:bg-emerald-900/40",
      iconColor: "text-emerald-500",
      statusDot: "bg-emerald-500",
      statusText: "Ready",
      statusColor: "text-emerald-500",
    },
    error: {
      buttonBg: "bg-red-900/30 hover:bg-red-900/40",
      iconColor: "text-red-500",
      statusDot: "bg-red-500",
      statusText: "Error",
      statusColor: "text-red-500",
    },
  };

  const config = stateConfig[state];

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">PC Power Control</CardTitle>
        <div className="flex items-center justify-center gap-3 mt-4 px-4 py-2 bg-secondary/50 rounded-full w-fit mx-auto">
          <span className={cn("w-3 h-3 rounded-full", config.statusDot)} />
          <span className={cn("text-sm font-medium", config.statusColor)}>
            {config.statusText}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Quick tap or hold for live control
        </p>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 pb-8">
        <button
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          disabled={state === "connecting"}
          className={cn(
            "w-48 h-48 rounded-full flex items-center justify-center",
            "transition-all duration-200 ease-out",
            "shadow-lg hover:shadow-xl",
            "focus:outline-none focus:ring-4 focus:ring-ring/50",
            state === "pressing" ? config.buttonBg : config.buttonBg
          )}
          aria-label="Power button"
        >
          {state === "connecting" ? (
            <Loader2 className="w-20 h-20 text-amber-500 animate-spin" />
          ) : (
            <Power className={cn("w-20 h-20", config.iconColor)} />
          )}
        </button>
        <p className="text-muted-foreground text-center">{statusText}</p>
      </CardContent>
    </Card>
  );
}
