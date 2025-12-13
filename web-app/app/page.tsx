"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { PowerButtonCard } from "@/components/power-button-card";
import { LoginForm } from "@/components/login-form";
import { Button } from "@/components/ui/button";
import { LogOut, Home } from "lucide-react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleQuick = async (duration: number) => {
    const response = await fetch("/api/mqtt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "quick", duration }),
    });

    if (!response.ok) {
      throw new Error("Failed to send command");
    }

    const data = await response.json();
    return { ack: data.ack || "unknown" };
  };

  const handlePress = async () => {
    const response = await fetch("/api/mqtt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "press" }),
    });

    if (!response.ok) {
      throw new Error("Failed to press");
    }

    const data = await response.json();
    return { ack: data.ack || "unknown" };
  };

  const handleRelease = async () => {
    const response = await fetch("/api/mqtt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "release" }),
    });

    if (!response.ok) {
      throw new Error("Failed to release");
    }

    const data = await response.json();
    return { ack: data.ack || "unknown" };
  };

  const pollStatus = async () => {
    const response = await fetch("/api/mqtt");

    if (!response.ok) {
      throw new Error("Failed to poll status");
    }

    const data = await response.json();
    return data; // { connected, deviceStatus } - deviceStatus from ESP32 LWT
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
  };

  // Prevent hydration mismatch
  if (!isClient || status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </main>
    );
  }

  if (!session) {
    return <LoginForm onSuccess={() => window.location.reload()} />;
  }

  return (
    <main className="min-h-screen p-4">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Home className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-semibold">House Control</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </header>

      {/* Dashboard */}
      <div className="max-w-4xl mx-auto">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <PowerButtonCard
            onQuick={handleQuick}
            onPress={handlePress}
            onRelease={handleRelease}
            pollStatus={pollStatus}
          />

          {/* Placeholder for future devices */}
          {/*
          <DoorLockCard ... />
          <WaterTankCard ... />
          */}
        </div>
      </div>
    </main>
  );
}
