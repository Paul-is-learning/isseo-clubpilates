#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// Génère une paire de clés VAPID (ECDSA P-256) pour Web Push.
// Usage : node scripts/generate-vapid-keys.mjs
// ═══════════════════════════════════════════════════════════════════════════
// La clé publique va dans js/config.js (window.ISSEO_VAPID_PUBLIC_KEY).
// La clé privée va dans les secrets Supabase :
//   supabase secrets set VAPID_PRIVATE_KEY="..." VAPID_PUBLIC_KEY="..."
// ═══════════════════════════════════════════════════════════════════════════

import crypto from 'node:crypto';

const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
});

// Format attendu VAPID :
// - Public : 65 bytes uncompressed (0x04 + X[32] + Y[32]) en base64url
// - Private : 32 bytes raw (le scalaire d) en base64url

const pubJwk = publicKey.export({ format: 'jwk' });
const privJwk = privateKey.export({ format: 'jwk' });

function b64urlDecode(b64) {
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function b64urlEncode(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const xBuf = b64urlDecode(pubJwk.x);
const yBuf = b64urlDecode(pubJwk.y);
const pubRaw = Buffer.concat([Buffer.from([0x04]), xBuf, yBuf]);

const pubB64 = b64urlEncode(pubRaw);
const privB64 = privJwk.d; // déjà en base64url dans le JWK

console.log('');
console.log('═══════════════════════════════════════════════════════════════════════════');
console.log('  Clés VAPID générées ✓');
console.log('═══════════════════════════════════════════════════════════════════════════');
console.log('');
console.log('  VAPID_PUBLIC_KEY  =', pubB64);
console.log('  VAPID_PRIVATE_KEY =', privB64);
console.log('');
console.log('─── Étapes suivantes ─────────────────────────────────────────────────────');
console.log('');
console.log('1) Dans js/config.js, remplacez la valeur de ISSEO_VAPID_PUBLIC_KEY par');
console.log('   la clé publique ci-dessus.');
console.log('');
console.log('2) Déclarez les secrets côté Supabase :');
console.log('');
console.log('   supabase secrets set \\');
console.log('     VAPID_PUBLIC_KEY="' + pubB64 + '" \\');
console.log('     VAPID_PRIVATE_KEY="' + privB64 + '" \\');
console.log('     VAPID_SUBJECT="mailto:paul@isseo.fr"');
console.log('');
console.log('3) Déployez l\'Edge Function :');
console.log('');
console.log('   supabase functions deploy send-push --no-verify-jwt');
console.log('');
console.log('4) Appliquez la migration DB :');
console.log('');
console.log('   (via dashboard Supabase > SQL Editor, coller migrations/004_push_subscriptions.sql)');
console.log('');
console.log('═══════════════════════════════════════════════════════════════════════════');
console.log('');
