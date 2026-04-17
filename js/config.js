// ═══════════════════════════════════════════════════════════════════════════
// CONFIG RUNTIME — Clés publiques des outils d'observabilité
// ═══════════════════════════════════════════════════════════════════════════
// Ces clés sont PUBLIQUES par conception (le SDK tourne côté navigateur).
// Elles identifient le projet Sentry/PostHog, pas une session utilisateur.
// Vide = l'outil est simplement désactivé (no-op).
// ═══════════════════════════════════════════════════════════════════════════

// Sentry — monitoring d'erreurs prod.
// Créer un projet sur sentry.io → Settings → Client Keys → copier le DSN ici.
window.ISSEO_SENTRY_DSN = '';

// PostHog — analytics produit (events + funnels + heatmaps).
// Créer un projet sur posthog.com → Project Settings → copier la Project API Key ici.
window.ISSEO_POSTHOG_KEY = '';
window.ISSEO_POSTHOG_HOST = 'https://eu.i.posthog.com';

// Environnement logique — utilisé par Sentry/PostHog pour séparer dev / prod
window.ISSEO_ENV = /^(localhost|127\.0\.0\.1|192\.168\.|10\.)/.test(location.hostname) ? 'dev' : 'prod';
