// ═══════════════════════════════════════════════════════════════════════════
// WEB PUSH — Subscription client + opt-in flow
// ═══════════════════════════════════════════════════════════════════════════
// Permet à l'app de recevoir des notifications OS même fermée, via l'Edge
// Function `send-push` (signature VAPID côté serveur).
//
// Flow :
//   1. L'utilisateur clique "Activer les notifications" → permission demandée
//   2. On souscrit à PushManager avec ISSEO_VAPID_PUBLIC_KEY
//   3. On upserte {endpoint, p256dh, auth} dans push_subscriptions (Supabase)
//   4. Quand un évènement createNotification() se produit, le client invoque
//      `send-push` qui signe un JWT VAPID + POST sur l'endpoint du navigateur
//   5. Le SW reçoit "push", affiche la notification OS, tap → focus l'app
// ═══════════════════════════════════════════════════════════════════════════

(function () {
  function _urlB64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    var raw = atob(base64);
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  function _bufToBase64Url(buf) {
    var b = new Uint8Array(buf);
    var s = '';
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /**
   * État courant : l'utilisateur a-t-il une subscription active ?
   */
  async function isPushEnabled() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
    try {
      var reg = await navigator.serviceWorker.ready;
      var sub = await reg.pushManager.getSubscription();
      return !!sub && Notification.permission === 'granted';
    } catch (_) {
      return false;
    }
  }

  function isPushSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && typeof Notification !== 'undefined';
  }

  /**
   * Active le Web Push : demande permission → subscribe → save en DB.
   * @returns {Promise<boolean>} true si activé avec succès
   */
  async function enablePush() {
    if (!isPushSupported()) {
      if (typeof toast === 'function') toast('Push non supporté sur ce navigateur');
      return false;
    }
    if (!window.ISSEO_VAPID_PUBLIC_KEY) {
      if (typeof toast === 'function') toast('Clé VAPID non configurée — contactez Paul');
      console.warn('[push] ISSEO_VAPID_PUBLIC_KEY missing in config.js');
      return false;
    }
    if (!window.S || !S.user) return false;

    // 1) Permission OS
    if (Notification.permission === 'default') {
      var perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        if (typeof toast === 'function') toast('Permission refusée');
        return false;
      }
    } else if (Notification.permission === 'denied') {
      if (typeof toast === 'function') toast('Autorisez les notifications dans les réglages du navigateur');
      return false;
    }

    // 2) Subscribe au PushManager
    var reg;
    try {
      reg = await navigator.serviceWorker.ready;
    } catch (e) {
      if (typeof toast === 'function') toast('Service Worker indisponible');
      return false;
    }

    var existing = await reg.pushManager.getSubscription();
    var sub;
    if (existing) {
      sub = existing;
    } else {
      try {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: _urlB64ToUint8Array(window.ISSEO_VAPID_PUBLIC_KEY),
        });
      } catch (e) {
        console.warn('[push] subscribe failed', e);
        if (typeof toast === 'function') toast('Échec abonnement push : ' + (e.message || e));
        return false;
      }
    }

    // 3) Upsert en base
    var json = sub.toJSON();
    var p256dh = json.keys && json.keys.p256dh;
    var authKey = json.keys && json.keys.auth;
    if (!p256dh || !authKey) {
      console.warn('[push] subscription incomplete', json);
      return false;
    }
    var row = {
      user_id: S.user.id,
      endpoint: sub.endpoint,
      p256dh: p256dh,
      auth: authKey,
      user_agent: navigator.userAgent.slice(0, 255),
      last_used_at: new Date().toISOString(),
    };
    var res = await sb.from('push_subscriptions').upsert(row, { onConflict: 'user_id,endpoint' });
    if (res.error) {
      console.warn('[push] DB upsert failed', res.error);
      if (typeof toast === 'function') toast('Erreur enregistrement : ' + res.error.message);
      return false;
    }

    if (typeof toast === 'function') toast('Notifications push activées ✓');
    // Test local immédiat (la notif OS de test est envoyée par requestNativeNotifPermission)
    return true;
  }

  /**
   * Désactive : unsubscribe PushManager + delete en DB.
   */
  async function disablePush() {
    if (!('serviceWorker' in navigator)) return;
    try {
      var reg = await navigator.serviceWorker.ready;
      var sub = await reg.pushManager.getSubscription();
      if (sub) {
        var endpoint = sub.endpoint;
        await sub.unsubscribe();
        if (window.S && S.user) {
          await sb.from('push_subscriptions').delete().eq('user_id', S.user.id).eq('endpoint', endpoint);
        }
      }
      if (typeof toast === 'function') toast('Notifications push désactivées');
    } catch (e) {
      console.warn('[push] disable failed', e);
    }
  }

  /**
   * Rafraîchit la subscription (à appeler au login pour garder la base à jour).
   * No-op si pas encore activé.
   */
  async function refreshPushSubscription() {
    if (!isPushSupported() || !window.S || !S.user) return;
    if (Notification.permission !== 'granted') return;
    try {
      var reg = await navigator.serviceWorker.ready;
      var sub = await reg.pushManager.getSubscription();
      if (!sub) return; // jamais abonné ou revoked
      var json = sub.toJSON();
      await sb.from('push_subscriptions').upsert({
        user_id: S.user.id,
        endpoint: sub.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        user_agent: navigator.userAgent.slice(0, 255),
        last_used_at: new Date().toISOString(),
      }, { onConflict: 'user_id,endpoint' });
    } catch (_) {}
  }

  /**
   * Invoke l'Edge Function send-push pour envoyer un push à une liste d'users.
   * Fire-and-forget : un échec ne casse pas l'UI.
   */
  async function sendPushTo(userIds, opts) {
    if (!Array.isArray(userIds) || !userIds.length) return;
    if (!opts || !opts.title) return;
    try {
      await sb.functions.invoke('send-push', {
        body: {
          user_ids: userIds,
          title: opts.title,
          body: opts.body || '',
          data: opts.data || {},
          tag: opts.tag || 'isseo-push',
          url: opts.url || '',
        },
      });
    } catch (e) {
      console.warn('[push] send-push invoke failed', e);
    }
  }

  // API publique
  window.isseoPush = {
    isSupported: isPushSupported,
    isEnabled: isPushEnabled,
    enable: enablePush,
    disable: disablePush,
    refresh: refreshPushSubscription,
    sendTo: sendPushTo,
  };
})();
