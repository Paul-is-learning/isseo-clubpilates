// ═══════════════════════════════════════════════════════════════════════════
// OBSERVABILITÉ — Sentry (erreurs) + PostHog (analytics produit)
// ═══════════════════════════════════════════════════════════════════════════
// Chargement conditionnel : si la clé correspondante est vide dans config.js,
// l'outil est simplement ignoré. Aucun impact sur l'app.
// Chargement asynchrone : ne ralentit pas le boot.
// ═══════════════════════════════════════════════════════════════════════════

(function () {
  // ─── Sentry ────────────────────────────────────────────────────────────────
  if (window.ISSEO_SENTRY_DSN && typeof window.ISSEO_SENTRY_DSN === 'string') {
    var s = document.createElement('script');
    s.src = 'https://browser.sentry-cdn.com/8.45.0/bundle.tracing.min.js';
    s.integrity = '';
    s.crossOrigin = 'anonymous';
    s.async = true;
    s.onload = function () {
      if (!window.Sentry) return;
      window.Sentry.init({
        dsn: window.ISSEO_SENTRY_DSN,
        environment: window.ISSEO_ENV,
        tracesSampleRate: window.ISSEO_ENV === 'prod' ? 0.1 : 0,
        release: 'isseo@' + (window.ISSEO_RELEASE || 'dev'),
        beforeSend: function (event) {
          // Jamais envoyer depuis le dev local
          if (window.ISSEO_ENV === 'dev') return null;
          return event;
        }
      });
      // Identifier l'utilisateur si profil connu
      try {
        if (window.S && window.S.profile && window.S.profile.nom) {
          window.Sentry.setUser({
            username: window.S.profile.nom,
            email: window.S.profile.email || undefined
          });
        }
      } catch (_) {}
    };
    document.head.appendChild(s);
  }

  // ─── PostHog ───────────────────────────────────────────────────────────────
  if (window.ISSEO_POSTHOG_KEY && typeof window.ISSEO_POSTHOG_KEY === 'string') {
    // Snippet officiel PostHog (loader async)
    !(function (t, e) {
      var o, n, p, r;
      e.__SV ||
        ((window.posthog = e),
        (e._i = []),
        (e.init = function (i, s, a) {
          function g(t, e) {
            var o = e.split('.');
            2 == o.length && ((t = t[o[0]]), (e = o[1]));
            t[e] = function () {
              t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
            };
          }
          ((p = t.createElement('script')).type = 'text/javascript'),
            (p.async = !0),
            (p.src = s.api_host + '/static/array.js'),
            (r = t.getElementsByTagName('script')[0]).parentNode.insertBefore(p, r);
          var u = e;
          for (
            void 0 !== a ? (u = e[a] = []) : (a = 'posthog'),
              u.people = u.people || [],
              u.toString = function (t) {
                var e = 'posthog';
                return 'posthog' !== a && (e += '.' + a), t || (e += ' (stub)'), e;
              },
              u.people.toString = function () {
                return u.toString(1) + '.people (stub)';
              },
              o = 'capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId'.split(
                ' '
              ),
              n = 0;
            n < o.length;
            n++
          )
            g(u, o[n]);
          e._i.push([i, s, a]);
        }),
        (e.__SV = 1));
    })(document, window.posthog || []);

    window.posthog.init(window.ISSEO_POSTHOG_KEY, {
      api_host: window.ISSEO_POSTHOG_HOST || 'https://eu.i.posthog.com',
      person_profiles: 'identified_only',
      // Pas de capture en dev local
      loaded: function (ph) {
        if (window.ISSEO_ENV === 'dev') ph.opt_out_capturing();
      }
    });

    // Identifier l'utilisateur après login (appelé par auth.js via hook)
    window.isseoPosthogIdentify = function () {
      try {
        if (!window.posthog || !window.S || !window.S.profile) return;
        window.posthog.identify(window.S.user && window.S.user.id, {
          nom: window.S.profile.nom,
          email: window.S.profile.email,
          role: window.S.profile.role
        });
      } catch (_) {}
    };
  }

  // ─── Helper global de capture manuelle d'erreurs (no-op si rien chargé) ───
  window.isseoCaptureError = function (err, ctx) {
    try {
      if (window.Sentry && window.Sentry.captureException) {
        window.Sentry.captureException(err, ctx ? { extra: ctx } : undefined);
      } else {
        console.error('[isseo]', err, ctx);
      }
    } catch (_) {
      console.error('[isseo]', err);
    }
  };
})();
