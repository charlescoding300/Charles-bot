import fs from "fs";

export async function loadPlugins() {
    const files = fs.readdirSync("./plugins");

    let plugins = [];

    for (let file of files) {
        const mod = await import(`../plugins/${file}`);
        plugins.push(mod.default);
        console.log("Loaded:", file);
    }

    return plugins;
}
