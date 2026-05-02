import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AgentConfig } from '@datasouk/shared';

const CONFIG_PATH =
  process.env.DATASOUK_CONFIG_PATH ?? path.join(os.homedir(), '.datasouk', 'config.json');

export function getConfigPath(): string {
  const dir = path.dirname(CONFIG_PATH);
  fs.mkdirSync(dir, { recursive: true });
  return CONFIG_PATH;
}

export function loadAgentConfig(): AgentConfig | null {
  try {
    const raw = fs.readFileSync(getConfigPath(), 'utf8');
    return JSON.parse(raw) as AgentConfig;
  } catch {
    return null;
  }
}

export function saveAgentConfig(config: AgentConfig): void {
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), 'utf8');
}
