// ═══════════════════════════════════════════════════════════════════════════
// CONFIG RUNTIME — Clés publiques des outils d'observabilité
// ═══════════════════════════════════════════════════════════════════════════
// Ces clés sont PUBLIQUES par conception (le SDK tourne côté navigateur).
// Elles identifient le projet Sentry/PostHog, pas une session utilisateur.
// Vide = l'outil est simplement désactivé (no-op).
// ═══════════════════════════════════════════════════════════════════════════

// Sentry — monitoring d'erreurs prod.
// Créer un projet sur sentry.io → Settings → Client Keys → copier le DSN ici.
window.ISSEO_SENTRY_DSN = 'https://8eac2be5874696836649f887b24001a8@o4511237258412032.ingest.de.sentry.io/4511237272305744';

// PostHog — analytics produit (events + funnels + heatmaps).
// Créer un projet sur posthog.com → Project Settings → copier la Project API Key ici.
window.ISSEO_POSTHOG_KEY = '';
window.ISSEO_POSTHOG_HOST = 'https://eu.i.posthog.com';

// Environnement logique — utilisé par Sentry/PostHog pour séparer dev / prod
window.ISSEO_ENV = /^(localhost|127\.0\.0\.1|192\.168\.|10\.)/.test(location.hostname) ? 'dev' : 'prod';
