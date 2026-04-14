import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys"

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Store plugins
const plugins = new Map()

// 🔌 Load all plugins from /plugins folder
async function loadPlugins() {
  const pluginDir = path.join(__dirname, "plugins")

  if (!fs.existsSync(pluginDir)) {
    console.log("⚠️ plugins folder not found")
    return
  }

  const files = fs.readdirSync(pluginDir)

  for (const file of files) {
    if (file.endsWith(".js")) {
      try {
        const plugin = await import(`./plugins/${file}`)
        const cmd = plugin.default.command
        plugins.set(cmd, plugin.default)
        console.log(`✅ Loaded plugin: ${cmd}`)
      } catch (err) {
        console.log(`❌ Failed to load ${file}`, err)
      }
    }
  }
}

// 🚀 Start WABBOT
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info")

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ["WABBOT", "Chrome", "1.0.0"]
  })

  sock.ev.on("creds.update", saveCreds)

  // 📱 PAIRING CODE LOGIN
  if (!sock.authState.creds.registered) {
    const phoneNumber = "234XXXXXXXXXX" // 👈 CHANGE THIS TO YOUR NUMBER

    const code = await sock.requestPairingCode(phoneNumber)
    console.log("📱 PAIRING CODE:", code)
  }

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

      console.log("❌ Connection closed")

      if (shouldReconnect) {
        console.log("🔄 Reconnecting...")
        startBot()
      }
    }

    if (connection === "open") {
      console.log("✅ WABBOT Connected Successfully")
    }
  })

  // 📩 Listen for messages
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return

    const sender = msg.key.remoteJid

    const messageText =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ""

    if (!messageText.startsWith(".")) return

    const args = messageText.trim().split(" ")
    const command = args[0]
    const text = args.slice(1).join(" ")

    const plugin = plugins.get(command)
    if (!plugin) return

    try {
      await plugin.run(sock, sender, text)
    } catch (error) {
      console.log("Plugin Error:", error)
      sock.sendMessage(sender, { text: "❌ Error running command." })
    }
  })
}

// 🔥 Initialize
await loadPlugins()
startBot()
