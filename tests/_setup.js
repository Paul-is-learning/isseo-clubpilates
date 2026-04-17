// ═══════════════════════════════════════════════════════════════════════════
// Setup de tests — charge les scripts globaux du projet pour tester les
// fonctions existantes sans les modifier (pas de refacto imports/exports).
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// Mock localStorage pour les scripts qui y accèdent à l'init (state.js, etc.)
if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.getItem !== 'function') {
  const _store = {};
  globalThis.localStorage = {
    getItem: (k) => (k in _store ? _store[k] : null),
    setItem: (k, v) => { _store[k] = String(v); },
    removeItem: (k) => { delete _store[k]; },
    clear: () => { for (const k in _store) delete _store[k]; }
  };
}

/**
 * Charge un .js global dans le contexte courant (globalThis).
 * Les fichiers du projet déclarent tout via `var` au top-level sous l'hypothèse
 * d'un environnement navigateur (scripts globaux). Ici, on utilise une regex
 * simple pour les transformer en assignations explicites à globalThis avant eval.
 */
export function loadGlobalScript(relPath) {
  let code = fs.readFileSync(path.join(root, relPath), 'utf8');
  // Transforme `var NAME` top-level en `globalThis.NAME` pour que ce soit accessible
  // (détection grossière mais suffisante pour notre cas : pas de var au début d'une ligne indentée)
  code = code.replace(/^(var|const|let|function|async function)\s+(\w+)/gm, (m, kw, name) => {
    if (kw === 'function' || kw === 'async function') {
      return `globalThis.${name} = ${kw}`;
    }
    return `globalThis.${name}`;
  });
  // Indirect eval → exécution en scope global du module de test
  (0, eval)(code);
}

/**
 * Stub minimal de l'état global S, suffisant pour les fonctions pures testées.
 */
export function setupMinimalState() {
  globalThis.S = globalThis.S || {
    studios: {},
    simConfig: {},
    adherents: {},
    scenarios: {},
    activeScenarioId: {},
    darkMode: false
  };
}
