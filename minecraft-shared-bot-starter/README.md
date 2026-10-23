# MineLink — Minecraft shared bot starter

Arabic RTL dashboard + Node.js backend. It supports starting a Java connection with Mineflayer or a Bedrock connection with `bedrock-protocol`, subject to server configuration and library protocol support.

## Important limitations
- This is a starter project, not a guarantee of 24/7 free hosting.
- The server address is configured by the owner in environment variables, not supplied by public visitors. This prevents the site from becoming an open network proxy.
- Keep `ADMIN_TOKEN` private. Do not expose the connect/disconnect API publicly without authentication and rate limiting.
- Bedrock protocol versions and online/Xbox authentication requirements vary. Check the current `bedrock-protocol` documentation and test against your server.
- AuthMe Reloaded is a Java server plugin; the starter intentionally does not guess credentials or automatically issue `/login`. Implement that only after confirming your server's exact authentication flow and using secrets securely.
- Use only on a server where you have permission to connect a bot.

## Run locally
1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env` and set the values in your terminal or hosting dashboard. Node does not automatically load `.env` without an extra package, so for local testing you can export variables in your shell or install/configure dotenv.
3. Run `npm install`
4. Set environment variables, then run `npm start`
5. Open `http://localhost:3000`

## Deploy
Import this folder into a Node.js host that permits persistent outbound TCP/UDP traffic and long-running processes. Set the environment variables in the host dashboard. Confirm that outbound traffic to the Minecraft server is allowed. Free hosts may sleep, limit runtime, or block traffic, so verify the current terms.

## Main files
- `server.js`: API and bot connections
- `public/index.html`: dashboard
- `public/style.css`: responsive UI
- `public/app.js`: dashboard interactions
