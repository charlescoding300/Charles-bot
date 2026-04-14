import fs from "fs";

export default {
    command: ".menu",
    run: async (sock, sender) => {

        const sent = await sock.sendMessage(sender, {
            text: "```Initializing WABBOT System...```"
        });

        await new Promise(r => setTimeout(r, 1000));

        await sock.sendMessage(sender, {
            text: "```Loading Command Core...```",
            edit: sent.key
        });

        await new Promise(r => setTimeout(r, 1000));

        await sock.sendMessage(sender, {
            text: "```Access Granted.```",
            edit: sent.key
        });

        await new Promise(r => setTimeout(r, 1000));

        // SAFE plugin scan
        const files = fs.readdirSync("./plugins")
            .filter(file => file.endsWith(".js"))
            .map(file => file.replace(".js", ""))
            .sort();

        const commandList = files
            .map(cmd => `║ ▸ .${cmd}`)
            .join("\n");

        const menu = `
╔══════════════════════╗
║     ⚡ WABBOT MD ⚡
╠══════════════════════╣
${commandList}
╠══════════════════════╣
║ STATUS   : ONLINE
║ PLUGINS  : ${files.length}
║ ENGINE   : MULTI DEVICE
╚══════════════════════╝

> Created By ▒▒▒ˡᵉˣʸ⃝⃝༒💘
        `;

        await sock.sendMessage(sender, {
            text: menu,
            edit: sent.key
        });
    }
};
