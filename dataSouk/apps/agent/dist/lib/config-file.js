import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const CONFIG_PATH = process.env.DATASOUK_CONFIG_PATH ?? path.join(os.homedir(), '.datasouk', 'config.json');
export function getConfigPath() {
    const dir = path.dirname(CONFIG_PATH);
    fs.mkdirSync(dir, { recursive: true });
    return CONFIG_PATH;
}
export function loadAgentConfig() {
    try {
        const raw = fs.readFileSync(getConfigPath(), 'utf8');
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
export function saveAgentConfig(config) {
    fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), 'utf8');
}
//# sourceMappingURL=config-file.js.map