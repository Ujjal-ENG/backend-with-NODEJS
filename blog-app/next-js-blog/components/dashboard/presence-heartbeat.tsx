"use client";

import { useEffect } from "react";

const HEARTBEAT_INTERVAL_MS = 60_000;

async function sendPresenceUpdate(path: "/api/presence/ping" | "/api/presence/offline") {
  await fetch(path, {
    method: "POST",
    cache: "no-store",
    keepalive: true,
  });
}

export function PresenceHeartbeat() {
  useEffect(() => {
    void sendPresenceUpdate("/api/presence/ping").catch(() => undefined);

    const intervalId = window.setInterval(() => {
      void sendPresenceUpdate("/api/presence/ping").catch(() => undefined);
    }, HEARTBEAT_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void sendPresenceUpdate("/api/presence/ping").catch(() => undefined);
      }
    };

    const onPageHide = () => {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/presence/offline");
        return;
      }
      void sendPresenceUpdate("/api/presence/offline").catch(() => undefined);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      void sendPresenceUpdate("/api/presence/offline").catch(() => undefined);
    };
  }, []);

  return null;
}
