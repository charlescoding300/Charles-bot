import makeWASocket, {
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} from "@whiskeysockets/baileys";

import pino from "pino";
import readline from "readline";
import { loadPlugins } from "./lib/loader.js";

const logger = pino({ level: "silent" });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(text) {
    return new Promise(resolve => rl.question(text, resolve));
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        logger,
        printQRInTerminal: false
    });

    sock.ev.on("creds.update", saveCreds);

    // 🔥 PAIRING CODE LOGIN
    if (!sock.authState.creds.registered) {
        const number = await ask("📱 Enter WhatsApp number (no +): ");

        const code = await sock.requestPairingCode(number.trim());

        console.log("\n🔥 PAIRING CODE:");
        console.log(code);
        console.log("\n👉 Go to WhatsApp → Linked Devices → Link with code\n");
    }

    const plugins = await loadPlugins();

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text;

        const sender = msg.key.remoteJid;

        if (!text) return;

        for (let p of plugins) {
            if (text.startsWith(p.command)) {
                p.run(sock, sender, text);
            }
        }
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "close") {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

            if (shouldReconnect) startBot();
        }

        if (connection === "open") {
            console.log("✅ WABBOT CONNECTED");
        }
    });

    console.log("🔥 STARTING WABBOT...");
}

startBot();
