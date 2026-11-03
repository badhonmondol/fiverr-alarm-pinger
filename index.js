const express = require("express");
const https = require("https");
const http = require("http");

const app = express();
const PORT = process.env.PORT || 3001;

// যে URL গুলো ping করবে — Environment Variables থেকে নেবে
const PING_TARGETS = [
  process.env.MAIN_SERVER_URL,   // fiverr-alarm main server
].filter(Boolean); // null/undefined বাদ দেওয়া

// ── /health ──────────────────────────────────────────────────────
// Render এটা দিয়ে pinger-কে জীবিত রাখবে
// Main server-এর GitHub Actions ping করবে এটাকে
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    targets: PING_TARGETS,
    uptime: Math.floor(process.uptime()) + "s",
    time: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────────────────────
// Ping function — একটা URL-কে HTTP GET করা
// ─────────────────────────────────────────────────────────────────
function pingUrl(url) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const protocol = parsed.protocol === "https:" ? https : http;

      const req = protocol.request(
        {
          hostname: parsed.hostname,
          port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
          path: parsed.pathname || "/",
          method: "GET",
          timeout: 15000,
        },
        (res) => {
          console.log(`✅ Pinged ${url} → HTTP ${res.statusCode}`);
          resolve(res.statusCode);
        }
      );

      req.on("timeout", () => {
        console.warn(`⏰ Timeout: ${url}`);
        req.destroy();
        resolve(0);
      });

      req.on("error", (err) => {
        console.error(`❌ Ping failed: ${url} → ${err.message}`);
        resolve(0);
      });

      req.end();
    } catch (err) {
      console.error(`❌ Invalid URL: ${url} → ${err.message}`);
      resolve(0);
    }
  });
}

// ─────────────────────────────────────────────────────────────────
// Ping loop — প্রতি ৫ মিনিটে সব target ping করবে
// ─────────────────────────────────────────────────────────────────
const FIVE_MINUTES = 5 * 60 * 1000;

async function pingAll() {
  console.log(`🔄 Pinging ${PING_TARGETS.length} target(s) at ${new Date().toISOString()}`);
  for (const url of PING_TARGETS) {
    await pingUrl(url);
  }
}

// সার্ভার চালু হওয়ার ১ মিনিট পরে প্রথম ping
setTimeout(() => {
  pingAll();
  // তারপর প্রতি ৫ মিনিটে
  setInterval(pingAll, FIVE_MINUTES);
}, 60 * 1000);

// ─────────────────────────────────────────────────────────────────
// Main server শুরু করা
// ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Pinger চালু হয়েছে — port ${PORT}`);
  console.log(`   Targets: ${PING_TARGETS.join(", ") || "কোনো target নেই — MAIN_SERVER_URL set করো"}`);
});

process.on("uncaughtException", (err) => {
  console.error("💥 uncaughtException:", err.message);
});

process.on("unhandledRejection", (reason) => {
  console.error("💥 unhandledRejection:", reason);
});
