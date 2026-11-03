# fiverr-alarm-pinger

Keeps the fiverr-alarm Render server alive by pinging it every 5 minutes.

## Environment Variables (Render-এ বসাও)

| Key | Value |
|---|---|
| `MAIN_SERVER_URL` | `https://fiverr-alarm-hiff.onrender.com/health` |

## How it works

Two Render free instances ping each other:
- pinger → pings main server every 5 min
- main server → pings pinger every 4 min (via self-ping)

Neither ever sleeps.
