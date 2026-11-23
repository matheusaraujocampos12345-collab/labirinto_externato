// Exporta a linha do tempo (cortes, digitação, deixas) para o script de áudio.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { timelineJSON } from '../src/timeline.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
const out = path.join(ROOT, 'out', 'timeline.json');
fs.writeFileSync(out, JSON.stringify(timelineJSON(), null, 2));
console.log('timeline →', out);
