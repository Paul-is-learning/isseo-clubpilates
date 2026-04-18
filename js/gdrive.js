// ═══════════════════════════════════════════════════════════════════════════
// GOOGLE DRIVE — Intégration complète (OAuth + Drive API v3)
// ═══════════════════════════════════════════════════════════════════════════
// Remplace l'iframe legacy "embeddedfolderview" (API dépréciée) par du vrai
// API Drive avec :
//   - OAuth 2.0 moderne via Google Identity Services (GIS)
//   - Liste fichiers/dossiers avec métadonnées (taille, date, thumbnails)
//   - Upload direct depuis l'app (drag & drop)
//   - Preview PDF/Office dans modal sans quitter l'app
//   - Création auto de dossier par studio
//   - Recherche full-text
//
// Config requise (à renseigner dans js/config.js) :
//   window.ISSEO_GOOGLE_CLIENT_ID — OAuth 2.0 Client ID
//   window.ISSEO_GOOGLE_API_KEY   — Google API Key (Drive API enabled)
//
// Scope utilisé : drive (accès complet au Drive de l'utilisateur).
// Pour un usage interne, Google affichera un warning "app non vérifiée" que
// l'utilisateur peut passer outre. Pour distribuer largement, soumettre l'app
// à verification Google (7-14 jours, gratuit).
// ═══════════════════════════════════════════════════════════════════════════

(function () {
  var DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';
  var DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
  var STORAGE_KEY = 'isseo_gdrive_token';

  // État interne
  var _gapiInited = false;
  var _gisInited = false;
  var _tokenClient = null;
  var _currentToken = null;
  var _initPromise = null;
  var _listeners = [];

  /**
   * État signé / non signé pour l'UI.
   */
  function isSignedIn() {
    return !!(_currentToken && _currentToken.access_token && _currentToken.expires_at > Date.now());
  }

  /**
   * Souscription aux changements d'état (signin/signout).
   */
  function onStateChange(fn) {
    _listeners.push(fn);
    return function () {
      _listeners = _listeners.filter(function (l) { return l !== fn; });
    };
  }
  function _emitState() {
    var signed = isSignedIn();
    _listeners.forEach(function (fn) { try { fn(signed); } catch (_) {} });
  }

  /**
   * Charge un script externe et attend qu'il soit prêt.
   */
  function _loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.defer = true;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Failed to load ' + src)); };
      document.head.appendChild(s);
    });
  }

  /**
   * Init gapi (Google API Client) + charge le module client + Drive discovery doc.
   */
  function _initGapi(apiKey) {
    return new Promise(function (resolve, reject) {
      if (_gapiInited) return resolve();
      if (!window.gapi) return reject(new Error('gapi non chargé'));
      window.gapi.load('client', function () {
        window.gapi.client
          .init({ apiKey: apiKey, discoveryDocs: [DISCOVERY_DOC] })
          .then(function () { _gapiInited = true; resolve(); })
          .catch(reject);
      });
    });
  }

  /**
   * Init GIS (Google Identity Services) → crée le token client réutilisable.
   */
  function _initGis(clientId) {
    return new Promise(function (resolve, reject) {
      if (_gisInited) return resolve();
      if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
        return reject(new Error('Google Identity Services non chargé'));
      }
      _tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: DRIVE_SCOPE,
        callback: function () {} // override à chaque demande de token
      });
      _gisInited = true;
      resolve();
    });
  }

  /**
   * Restaure un token valide depuis localStorage s'il existe.
   */
  function _restoreToken() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var tok = JSON.parse(raw);
      if (tok && tok.expires_at && tok.expires_at > Date.now() + 60000) {
        _currentToken = tok;
        if (window.gapi && window.gapi.client) window.gapi.client.setToken(tok);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (_) {}
  }

  function _saveToken(tok) {
    _currentToken = tok;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tok)); } catch (_) {}
    if (window.gapi && window.gapi.client) window.gapi.client.setToken(tok);
  }

  function _clearToken() {
    _currentToken = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    if (window.gapi && window.gapi.client) window.gapi.client.setToken(null);
  }

  /**
   * Point d'entrée principal : charge gapi + GIS si pas fait, restore token.
   * Idempotent — safe d'appeler plusieurs fois.
   */
  function init() {
    if (_initPromise) return _initPromise;
    var clientId = window.ISSEO_GOOGLE_CLIENT_ID;
    var apiKey = window.ISSEO_GOOGLE_API_KEY;
    if (!clientId || !apiKey) {
      _initPromise = Promise.reject(new Error('Google Drive : credentials manquants dans config.js'));
      return _initPromise;
    }
    _initPromise = Promise.all([
      _loadScript('https://apis.google.com/js/api.js'),
      _loadScript('https://accounts.google.com/gsi/client')
    ])
      .then(function () { return _initGapi(apiKey); })
      .then(function () { return _initGis(clientId); })
      .then(function () { _restoreToken(); _emitState(); });
    return _initPromise;
  }

  /**
   * Demande à l'utilisateur de s'authentifier (popup Google).
   * Retourne une promise qui résout après signin réussi.
   */
  function signIn() {
    return init().then(function () {
      return new Promise(function (resolve, reject) {
        if (!_tokenClient) return reject(new Error('GIS non initialisé'));
        _tokenClient.callback = function (resp) {
          if (resp.error) return reject(new Error(resp.error));
          var expiresInMs = (resp.expires_in || 3600) * 1000;
          _saveToken({
            access_token: resp.access_token,
            expires_at: Date.now() + expiresInMs - 60000, // marge 1 min
            scope: resp.scope
          });
          _emitState();
          resolve();
        };
        _tokenClient.requestAccessToken({ prompt: _currentToken ? '' : 'consent' });
      });
    });
  }

  /**
   * Déconnexion — révoque le token et nettoie le storage.
   */
  function signOut() {
    if (_currentToken && _currentToken.access_token && window.google && window.google.accounts) {
      try { window.google.accounts.oauth2.revoke(_currentToken.access_token, function () {}); } catch (_) {}
    }
    _clearToken();
    _emitState();
  }

  /**
   * Vérifie/rafraîchit le token si nécessaire avant un appel API.
   */
  function _ensureToken() {
    if (isSignedIn()) return Promise.resolve();
    return signIn();
  }

  /**
   * Liste les fichiers/dossiers d'un dossier Drive.
   * @param {string} folderId — ID du dossier parent (ou 'root')
   * @param {object} [opts] — { pageSize, orderBy, query }
   */
  function listFolder(folderId, opts) {
    opts = opts || {};
    return _ensureToken().then(function () {
      var q = "'" + folderId + "' in parents and trashed = false";
      if (opts.query) q += " and (name contains '" + opts.query.replace(/'/g, "\\'") + "')";
      return window.gapi.client.drive.files.list({
        q: q,
        pageSize: opts.pageSize || 100,
        fields: 'files(id, name, mimeType, size, modifiedTime, iconLink, thumbnailLink, webViewLink, webContentLink, owners(displayName, emailAddress), parents)',
        orderBy: opts.orderBy || 'folder,name',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true
      }).then(function (res) {
        return res.result.files || [];
      });
    });
  }

  /**
   * Parse une réponse d'erreur Drive et produit un message lisible.
   */
  function _parseDriveError(xhr, defaultMsg) {
    var msg = defaultMsg || 'Erreur Drive';
    try {
      var body = JSON.parse(xhr.responseText);
      var e = body && body.error;
      if (e) {
        if (xhr.status === 403) {
          if (/insufficient/i.test(e.message || '')) {
            msg = 'Permissions insuffisantes sur le dossier Drive lié. Assurez-vous que le compte Google connecté dispose d\'un accès en écriture (Éditeur, pas Spectateur).';
          } else if (/rateLimit|userRateLimit/i.test(e.message || '')) {
            msg = 'Quota Drive dépassé — réessayez dans quelques secondes.';
          } else {
            msg = e.message || msg;
          }
        } else if (xhr.status === 404) {
          msg = 'Dossier Drive introuvable. Le lien est peut-être expiré ou vous n\'y avez pas accès.';
        } else if (xhr.status === 401) {
          msg = 'Session Google expirée — déconnectez-vous et reconnectez-vous.';
        } else {
          msg = e.message || msg;
        }
      }
    } catch (_) { /* responseText non-JSON */ }
    var err = new Error(msg);
    err.httpStatus = xhr.status;
    err.driveCode = xhr.status;
    return err;
  }

  /**
   * Upload un fichier dans un dossier Drive.
   * @param {string} folderId — dossier parent
   * @param {File} file — File API Blob
   * @param {function} [onProgress] — callback (pct 0-100)
   */
  function upload(folderId, file, onProgress) {
    return _ensureToken().then(function () {
      return new Promise(function (resolve, reject) {
        var metadata = { name: file.name, mimeType: file.type || 'application/octet-stream', parents: [folderId] };
        var boundary = '-------isseo-drive-upload-' + Date.now();
        var delim = '\r\n--' + boundary + '\r\n';
        var closeDelim = '\r\n--' + boundary + '--';

        var reader = new FileReader();
        reader.onload = function () {
          var base64 = btoa(
            new Uint8Array(reader.result)
              .reduce(function (data, byte) { return data + String.fromCharCode(byte); }, '')
          );
          var multipartBody =
            delim +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify(metadata) +
            delim +
            'Content-Type: ' + metadata.mimeType + '\r\n' +
            'Content-Transfer-Encoding: base64\r\n\r\n' +
            base64 +
            closeDelim;

          var xhr = new XMLHttpRequest();
          xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink');
          xhr.setRequestHeader('Authorization', 'Bearer ' + _currentToken.access_token);
          xhr.setRequestHeader('Content-Type', 'multipart/related; boundary="' + boundary + '"');
          if (onProgress && xhr.upload) {
            xhr.upload.onprogress = function (e) {
              if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100));
            };
          }
          xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
            else reject(_parseDriveError(xhr, 'Upload échoué (HTTP ' + xhr.status + ')'));
          };
          xhr.onerror = function () { reject(new Error('Upload : erreur réseau')); };
          xhr.send(multipartBody);
        };
        reader.onerror = function () { reject(new Error('Lecture fichier échouée')); };
        reader.readAsArrayBuffer(file);
      });
    });
  }

  /**
   * Supprime un fichier (met à la corbeille Drive).
   */
  function trash(fileId) {
    return _ensureToken().then(function () {
      return window.gapi.client.drive.files.update({
        fileId: fileId,
        resource: { trashed: true },
        supportsAllDrives: true
      });
    });
  }

  /**
   * Crée un dossier.
   */
  function createFolder(name, parentId) {
    return _ensureToken().then(function () {
      return window.gapi.client.drive.files.create({
        resource: {
          name: name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: parentId ? [parentId] : undefined
        },
        fields: 'id, name, webViewLink',
        supportsAllDrives: true
      }).then(function (res) { return res.result; });
    });
  }

  /**
   * Recherche full-text dans tout le Drive de l'utilisateur.
   */
  function search(query, opts) {
    opts = opts || {};
    return _ensureToken().then(function () {
      var q = "fullText contains '" + query.replace(/'/g, "\\'") + "' and trashed = false";
      return window.gapi.client.drive.files.list({
        q: q,
        pageSize: opts.pageSize || 20,
        fields: 'files(id, name, mimeType, modifiedTime, iconLink, thumbnailLink, webViewLink, parents)'
      }).then(function (res) { return res.result.files || []; });
    });
  }

  /**
   * Extrait l'ID d'un dossier depuis une URL Drive.
   */
  function extractFolderId(url) {
    if (!url) return null;
    var m = url.match(/folders\/([a-zA-Z0-9_-]+)/);
    if (m) return m[1];
    m = url.match(/id=([a-zA-Z0-9_-]+)/);
    if (m) return m[1];
    // Peut-être déjà un ID brut
    if (/^[a-zA-Z0-9_-]{10,}$/.test(url)) return url;
    return null;
  }

  /**
   * URL de preview Drive pour un fichier (utilisable dans <iframe>).
   */
  function previewUrl(fileId) {
    return 'https://drive.google.com/file/d/' + fileId + '/preview';
  }

  // API publique
  window.isseoGDrive = {
    init: init,
    signIn: signIn,
    signOut: signOut,
    isSignedIn: isSignedIn,
    onStateChange: onStateChange,
    listFolder: listFolder,
    upload: upload,
    trash: trash,
    createFolder: createFolder,
    search: search,
    extractFolderId: extractFolderId,
    previewUrl: previewUrl,
    isConfigured: function () {
      return !!(window.ISSEO_GOOGLE_CLIENT_ID && window.ISSEO_GOOGLE_API_KEY);
    }
  };

  // Auto-init si credentials présents (ne bloque pas le boot si credentials vides)
  if (window.ISSEO_GOOGLE_CLIENT_ID && window.ISSEO_GOOGLE_API_KEY) {
    init().catch(function (err) {
      var msg = (err && (err.message || err.error || err.toString())) || 'erreur inconnue';
      console.warn('[gdrive] init:', msg);
    });
  }
})();
