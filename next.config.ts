import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `next dev` already binds to 0.0.0.0 and prints a "Network:" URL, so a
  // phone on the same Wi-Fi can already load the page. Without this,
  // though, the dev server's Hot Module Reload WebSocket (which always
  // sends an Origin header, unlike a same-origin script/asset load) gets
  // silently blocked when the origin is a LAN IP instead of localhost —
  // the page still loads, but live-reload stops working from the phone.
  // Covers the two most common home/office private ranges; if your
  // network uses 172.16-31.x.x instead, add that specific /16 here too.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
};

export default nextConfig;
