// ═══════════════════════════════════════════════════════════════════════════
// GOOGLE DRIVE — Interface utilisateur (file browser in-app)
// ═══════════════════════════════════════════════════════════════════════════
// Monté par pages-fichiers.js via un placeholder <div data-gdrive-browser="folderId">.
// Fournit : liste fichiers avec thumbnails, drag & drop upload, preview modal,
// suppression, rafraîchissement.
// ═══════════════════════════════════════════════════════════════════════════

(function () {
  // Cache par dossier (évite de re-fetch à chaque render)
  var _cache = {};
  var _mounting = {};

  function _formatSize(bytes) {
    if (!bytes) return '—';
    bytes = +bytes;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  }

  function _formatDate(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    var days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return 'Hier';
    if (days < 7) return 'Il y a ' + days + ' jours';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function _mimeIcon(mime) {
    if (!mime) return '📄';
    if (mime.indexOf('folder') >= 0) return '📁';
    if (mime.indexOf('pdf') >= 0) return '📕';
    if (mime.indexOf('spreadsheet') >= 0 || mime.indexOf('excel') >= 0 || mime.indexOf('csv') >= 0) return '📊';
    if (mime.indexOf('presentation') >= 0 || mime.indexOf('powerpoint') >= 0) return '📊';
    if (mime.indexOf('document') >= 0 || mime.indexOf('word') >= 0) return '📝';
    if (mime.indexOf('image') >= 0) return '🖼️';
    if (mime.indexOf('video') >= 0) return '🎬';
    if (mime.indexOf('audio') >= 0) return '🎵';
    if (mime.indexOf('zip') >= 0) return '🗜️';
    return '📄';
  }

  function _renderToolbar(folderId, container) {
    var gd = window.isseoGDrive;
    var signed = gd && gd.isSignedIn();
    return [
      '<div class="gdrive-toolbar" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px">',
      '<div style="display:flex;align-items:center;gap:6px;flex:1;min-width:200px">',
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L4.5 12.5l3.5 6h8l3.5-6L12 2z" fill="#FBBC04"/><path d="M4.5 12.5l3.5 6h8" fill="#34A853"/><path d="M12 2l7.5 10.5-3.5 6" fill="#4285F4"/></svg>',
      '<strong style="font-size:13px">Google Drive</strong>',
      signed ? '<span style="font-size:10px;color:#10b981;font-weight:600">● Connecté</span>' : '<span style="font-size:10px;color:#94a3b8">Non connecté</span>',
      '</div>',
      signed
        ? '<input type="text" placeholder="Rechercher..." class="gdrive-search" style="flex:0 1 200px;padding:6px 10px;border:1px solid #e2e8f0;border-radius:8px;font-size:12px" />'
        : '',
      signed
        ? '<button class="gdrive-refresh btn" style="font-size:11px;padding:6px 12px">↻ Rafraîchir</button>'
        : '',
      signed
        ? '<button class="gdrive-upload-trigger btn btn-primary" style="font-size:11px;padding:6px 14px">⇧ Upload</button>'
        : '<button class="gdrive-signin btn btn-primary" style="font-size:11px;padding:6px 14px">Se connecter à Google Drive</button>',
      signed
        ? '<button class="gdrive-signout btn" style="font-size:10px;padding:4px 8px;color:#64748b">Déconnecter</button>'
        : '',
      '<a href="https://drive.google.com/drive/folders/' + folderId + '" target="_blank" class="btn" style="font-size:11px;text-decoration:none;padding:6px 12px">Drive ↗</a>',
      '</div>'
    ].join('');
  }

  function _renderFileRow(file) {
    var isFolder = file.mimeType && file.mimeType.indexOf('folder') >= 0;
    var thumb = file.thumbnailLink
      ? '<img src="' + file.thumbnailLink + '" style="width:36px;height:36px;object-fit:cover;border-radius:6px;flex-shrink:0" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"/><div style="display:none;width:36px;height:36px;border-radius:6px;background:#f1f5f9;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">' + _mimeIcon(file.mimeType) + '</div>'
      : '<div style="width:36px;height:36px;border-radius:6px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">' + _mimeIcon(file.mimeType) + '</div>';
    var clickAction = isFolder
      ? 'window.open(\'https://drive.google.com/drive/folders/' + file.id + '\', \'_blank\')'
      : 'window._gdriveOpenPreview(\'' + file.id + '\', \'' + (file.name || '').replace(/'/g, "\\'") + '\')';
    return [
      '<div class="gdrive-file-row" data-file-id="' + file.id + '" style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:8px;cursor:pointer;transition:background .15s" onclick="' + clickAction + '" onmouseenter="this.style.background=\'#f8fafc\'" onmouseleave="this.style.background=\'transparent\'">',
      thumb,
      '<div style="flex:1;min-width:0">',
      '<div style="font-size:13px;font-weight:600;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (file.name || '') + '</div>',
      '<div style="font-size:11px;color:#94a3b8;margin-top:2px">' + _formatDate(file.modifiedTime) + (file.size ? ' · ' + _formatSize(file.size) : '') + '</div>',
      '</div>',
      isFolder ? '<span style="font-size:10px;color:#94a3b8">dossier</span>' : '',
      '<button onclick="event.stopPropagation();window._gdriveDeleteFile(\'' + file.id + '\', \'' + (file.name || '').replace(/'/g, "\\'") + '\')" title="Supprimer" style="background:none;border:none;cursor:pointer;color:#94a3b8;font-size:14px;padding:4px;border-radius:4px" onmouseenter="this.style.color=\'#dc2626\';this.style.background=\'#fef2f2\'" onmouseleave="this.style.color=\'#94a3b8\';this.style.background=\'transparent\'">🗑</button>',
      '</div>'
    ].join('');
  }

  function _renderSkeleton() {
    var h = '';
    for (var i = 0; i < 4; i++) {
      h += '<div style="display:flex;align-items:center;gap:12px;padding:10px 12px">';
      h += '<div class="skeleton" style="width:36px;height:36px;border-radius:6px"></div>';
      h += '<div style="flex:1"><div class="skeleton" style="height:12px;width:60%;border-radius:4px;margin-bottom:4px"></div><div class="skeleton" style="height:10px;width:30%;border-radius:4px"></div></div>';
      h += '</div>';
    }
    return h;
  }

  function _renderUploadZone() {
    return [
      '<div class="gdrive-dropzone" style="border:2px dashed #cbd5e1;border-radius:10px;padding:20px;text-align:center;color:#64748b;font-size:12px;margin-top:12px;transition:all .2s">',
      '<div style="font-size:28px;margin-bottom:6px">⇧</div>',
      '<div><strong>Glissez-déposez</strong> des fichiers ici</div>',
      '<div style="font-size:10px;color:#94a3b8;margin-top:4px">ou cliquez sur Upload dans la barre</div>',
      '<input type="file" class="gdrive-file-input" multiple style="display:none" />',
      '</div>'
    ].join('');
  }

  function _attachHandlers(container, folderId) {
    var gd = window.isseoGDrive;

    // Sign in / out
    var btnIn = container.querySelector('.gdrive-signin');
    if (btnIn) btnIn.addEventListener('click', function () {
      gd.signIn().then(function () { renderInto(container, folderId); }).catch(function (err) {
        alert('Échec Google Drive : ' + err.message);
      });
    });
    var btnOut = container.querySelector('.gdrive-signout');
    if (btnOut) btnOut.addEventListener('click', function () {
      gd.signOut();
      delete _cache[folderId];
      renderInto(container, folderId);
    });

    // Refresh
    var btnRefresh = container.querySelector('.gdrive-refresh');
    if (btnRefresh) btnRefresh.addEventListener('click', function () {
      delete _cache[folderId];
      renderInto(container, folderId);
    });

    // Upload trigger + file input + dropzone
    var trigger = container.querySelector('.gdrive-upload-trigger');
    var input = container.querySelector('.gdrive-file-input');
    var dropzone = container.querySelector('.gdrive-dropzone');
    if (trigger && input) trigger.addEventListener('click', function () { input.click(); });
    if (dropzone && input) dropzone.addEventListener('click', function () { input.click(); });

    function handleFiles(files) {
      if (!files || !files.length) return;
      Array.prototype.forEach.call(files, function (file) { _uploadWithProgress(container, folderId, file); });
    }
    if (input) input.addEventListener('change', function (e) { handleFiles(e.target.files); e.target.value = ''; });
    if (dropzone) {
      dropzone.addEventListener('dragover', function (e) { e.preventDefault(); dropzone.style.background = '#eff6ff'; dropzone.style.borderColor = '#3b82f6'; });
      dropzone.addEventListener('dragleave', function () { dropzone.style.background = ''; dropzone.style.borderColor = '#cbd5e1'; });
      dropzone.addEventListener('drop', function (e) {
        e.preventDefault();
        dropzone.style.background = '';
        dropzone.style.borderColor = '#cbd5e1';
        handleFiles(e.dataTransfer && e.dataTransfer.files);
      });
    }

    // Search (debounced)
    var search = container.querySelector('.gdrive-search');
    if (search) {
      var tmo = null;
      search.addEventListener('input', function (e) {
        clearTimeout(tmo);
        var q = e.target.value.trim();
        tmo = setTimeout(function () {
          var listEl = container.querySelector('.gdrive-file-list');
          if (!listEl) return;
          listEl.innerHTML = _renderSkeleton();
          gd.listFolder(folderId, { query: q || null }).then(function (files) {
            _cache[folderId + (q ? '::' + q : '')] = files;
            listEl.innerHTML = files.length
              ? files.map(_renderFileRow).join('')
              : '<div style="text-align:center;color:#94a3b8;padding:24px;font-size:12px">Aucun fichier' + (q ? ' correspondant à "' + q + '"' : '') + '</div>';
          }).catch(function (err) {
            listEl.innerHTML = '<div style="color:#dc2626;padding:12px;font-size:12px">Erreur : ' + err.message + '</div>';
          });
        }, 350);
      });
    }
  }

  function _uploadWithProgress(container, folderId, file) {
    var gd = window.isseoGDrive;
    // Banner de progression
    var progressBox = document.createElement('div');
    progressBox.style.cssText = 'padding:10px 14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;margin-bottom:8px;font-size:12px;display:flex;align-items:center;gap:10px';
    progressBox.innerHTML = '<div style="flex-shrink:0">⇧</div><div style="flex:1"><div><strong>' + file.name + '</strong> · ' + _formatSize(file.size) + '</div><div class="gdrive-progress-bar" style="height:4px;background:#dbeafe;border-radius:2px;margin-top:4px;overflow:hidden"><div class="gdrive-progress-fill" style="height:100%;width:0%;background:#3b82f6;transition:width .2s"></div></div></div><span class="gdrive-progress-pct" style="font-weight:600;color:#3b82f6">0%</span>';
    var progressArea = container.querySelector('.gdrive-progress-area');
    if (!progressArea) {
      progressArea = document.createElement('div');
      progressArea.className = 'gdrive-progress-area';
      var toolbar = container.querySelector('.gdrive-toolbar');
      if (toolbar && toolbar.nextSibling) toolbar.parentNode.insertBefore(progressArea, toolbar.nextSibling);
      else container.appendChild(progressArea);
    }
    progressArea.appendChild(progressBox);

    var fillEl = progressBox.querySelector('.gdrive-progress-fill');
    var pctEl = progressBox.querySelector('.gdrive-progress-pct');

    gd.upload(folderId, file, function (pct) {
      if (fillEl) fillEl.style.width = pct + '%';
      if (pctEl) pctEl.textContent = pct + '%';
    }).then(function () {
      progressBox.style.background = '#f0fdf4';
      progressBox.style.borderColor = '#86efac';
      pctEl.textContent = '✓';
      pctEl.style.color = '#10b981';
      setTimeout(function () { progressBox.remove(); }, 2000);
      delete _cache[folderId];
      renderInto(container, folderId);
    }).catch(function (err) {
      progressBox.style.background = '#fef2f2';
      progressBox.style.borderColor = '#fecaca';
      progressBox.style.flexDirection = 'column';
      progressBox.style.alignItems = 'stretch';
      var status = err && err.httpStatus;
      var isPermErr = status === 403;
      var head = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px"><span style="flex-shrink:0;font-size:16px">⚠</span>'
        + '<div style="flex:1"><strong style="color:#991b1b">' + file.name + '</strong>'
        + '<div style="font-size:11px;color:#b91c1c;margin-top:2px">' + (err.message || 'Erreur inconnue') + '</div></div></div>';
      var hint = '';
      if (isPermErr) {
        hint = '<div style="font-size:11px;color:#78350f;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:8px 10px;margin-top:4px">'
          + '<b>Comment résoudre :</b><br>'
          + '• Ouvrez le dossier Drive, partagez-le avec le compte connecté en <b>Éditeur</b>.<br>'
          + '• OU transférez-en la propriété au compte connecté.<br>'
          + '• OU reconnectez-vous avec le compte propriétaire (bouton Déconnecter ↑).'
          + '</div>';
      }
      progressBox.innerHTML = head + hint;
      setTimeout(function () { progressBox.remove(); }, isPermErr ? 15000 : 8000);
    });
  }

  /**
   * Rend le browser complet dans un container.
   */
  function renderInto(container, folderId) {
    var gd = window.isseoGDrive;
    if (!gd || !gd.isConfigured()) {
      container.innerHTML = '<div style="padding:20px;background:#fef3c7;border:1px solid #fde68a;border-radius:8px;font-size:12px;color:#854d0e">⚠ Google Drive API non configurée — renseigne <code>ISSEO_GOOGLE_CLIENT_ID</code> et <code>ISSEO_GOOGLE_API_KEY</code> dans <code>js/config.js</code>.</div>';
      return;
    }

    container.innerHTML = _renderToolbar(folderId, container) +
      '<div class="gdrive-file-list" style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:6px">' + _renderSkeleton() + '</div>' +
      (gd.isSignedIn() ? _renderUploadZone() : '');

    _attachHandlers(container, folderId);

    if (!gd.isSignedIn()) {
      // Juste afficher l'état "non connecté" et attendre que l'utilisateur clique
      container.querySelector('.gdrive-file-list').innerHTML =
        '<div style="text-align:center;color:#94a3b8;padding:32px 20px;font-size:13px">' +
        '<div style="font-size:32px;margin-bottom:8px">🔒</div>' +
        'Connecte-toi à Google Drive pour voir les fichiers' +
        '</div>';
      return;
    }

    // Listing (avec cache)
    gd.init().then(function () {
      var cached = _cache[folderId];
      var listEl = container.querySelector('.gdrive-file-list');
      var renderList = function (files) {
        _cache[folderId] = files;
        listEl.innerHTML = files.length
          ? files.map(_renderFileRow).join('')
          : '<div style="text-align:center;color:#94a3b8;padding:24px;font-size:12px">Dossier vide — drag-drop des fichiers pour commencer</div>';
      };
      if (cached) renderList(cached);
      gd.listFolder(folderId).then(renderList).catch(function (err) {
        listEl.innerHTML = '<div style="color:#dc2626;padding:12px;font-size:12px">Erreur : ' + err.message + '</div>';
      });
    });
  }

  // ─── Modal preview ─────────────────────────────────────────────────────────
  window._gdriveOpenPreview = function (fileId, name) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;flex-direction:column;padding:40px;animation:fadeIn .2s';
    overlay.innerHTML = [
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;color:#fff">',
      '<div style="font-size:15px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">' + (name || 'Fichier') + '</div>',
      '<div style="display:flex;gap:8px">',
      '<a href="https://drive.google.com/file/d/' + fileId + '/view" target="_blank" style="padding:6px 14px;background:rgba(255,255,255,0.15);color:#fff;border-radius:6px;text-decoration:none;font-size:12px">Ouvrir dans Drive ↗</a>',
      '<button onclick="this.closest(\'[data-gdrive-preview]\').remove()" style="padding:6px 14px;background:rgba(255,255,255,0.15);color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px">Fermer ✕</button>',
      '</div></div>',
      '<iframe src="' + window.isseoGDrive.previewUrl(fileId) + '" style="flex:1;width:100%;border:0;border-radius:10px;background:#fff"></iframe>'
    ].join('');
    overlay.setAttribute('data-gdrive-preview', '1');
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
  };

  // ─── Suppression fichier ───────────────────────────────────────────────────
  window._gdriveDeleteFile = function (fileId, name) {
    if (!confirm('Supprimer "' + (name || 'ce fichier') + '" ?\n(mis à la corbeille Drive)')) return;
    window.isseoGDrive.trash(fileId).then(function () {
      if (typeof toast === 'function') toast('Supprimé : ' + name);
      // Invalide le cache de tous les dossiers (on sait pas lequel)
      _cache = {};
      // Retrouve tous les browsers ouverts et re-render
      document.querySelectorAll('[data-gdrive-browser]').forEach(function (el) {
        renderInto(el, el.getAttribute('data-gdrive-browser'));
      });
    }).catch(function (err) { alert('Erreur suppression : ' + err.message); });
  };

  /**
   * Mount API — appelé après render() global depuis app.js.
   * Scanne les <div data-gdrive-browser="folderId"> et y monte l'UI.
   */
  window.mountGDriveBrowsers = function () {
    var nodes = document.querySelectorAll('[data-gdrive-browser]');
    nodes.forEach(function (el) {
      var folderId = el.getAttribute('data-gdrive-browser');
      if (!folderId) return;
      // Évite re-mount si déjà monté (gardé par marqueur interne)
      if (_mounting[folderId] === el) return;
      _mounting[folderId] = el;
      renderInto(el, folderId);
    });
  };

  /**
   * Navigate le browser existant vers un nouveau folderId (utilisé par les
   * vignettes sous-catégories).
   */
  window.navigateGDriveBrowserTo = function (newFolderId) {
    var el = document.querySelector('[data-gdrive-browser]');
    if (!el) return false;
    el.setAttribute('data-gdrive-browser', newFolderId);
    _mounting[newFolderId] = el;
    renderInto(el, newFolderId);
    try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (_) {}
    return true;
  };

  /**
   * Invalide le cache d'un parent (utilisé après création d'un sous-dossier).
   */
  window.invalidateGDriveCache = function (parentId) {
    if (parentId) delete _cache[parentId];
    else _cache = {};
  };
})();

// ═══════════════════════════════════════════════════════════════════════════
// Navigation vignettes sous-catégories → sous-dossier Drive correspondant
// ═══════════════════════════════════════════════════════════════════════════
// Cherche (ou crée à la volée) le sous-dossier homonyme dans le dossier
// parent lié au studio, puis navigue le browser natif vers lui.
window.openSubfolderInBrowser = async function (sid, folderKey, folderLabel, cardEl) {
  var gd = window.isseoGDrive;
  if (!gd || !gd.isConfigured()) { toast('Google Drive non configuré'); return; }
  var s = S.studios[sid];
  if (!s || !s.driveUrl) { toast('Liez d\'abord un dossier Drive parent'); return; }
  var parentId = _extractDriveFolderId(s.driveUrl);
  if (!parentId) { toast('URL Drive invalide'); return; }

  // Signin si besoin
  if (!gd.isSignedIn()) {
    try { await gd.signIn(); } catch (e) { toast('Connexion Google requise'); return; }
  }

  // État visuel "loading" sur la carte
  if (cardEl) cardEl.classList.add('is-loading');

  try {
    // Liste les enfants du parent (pas de cache — on veut l'état à jour)
    var children = await gd.listFolder(parentId, { pageSize: 100 });
    var norm = function (s) { return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); };
    var target = (children || []).filter(function (c) {
      return c.mimeType && c.mimeType.indexOf('folder') >= 0 && norm(c.name) === norm(folderLabel);
    })[0];

    if (!target) {
      if (cardEl) cardEl.classList.remove('is-loading');
      var ok = confirm('Le sous-dossier « ' + folderLabel + ' » n\'existe pas encore dans votre Drive.\n\nLe créer maintenant ?');
      if (!ok) return;
      if (cardEl) cardEl.classList.add('is-loading');
      var created = await gd.createFolder(folderLabel, parentId);
      target = created;
      if (window.invalidateGDriveCache) window.invalidateGDriveCache(parentId);
      toast('Sous-dossier « ' + folderLabel + ' » créé dans Drive');
      if (cardEl) { cardEl.classList.remove('is-loading'); cardEl.classList.add('is-created'); setTimeout(function () { cardEl.classList.remove('is-created'); }, 1500); }
    }

    if (cardEl) cardEl.classList.remove('is-loading');
    // Naviguer le browser embed vers ce sous-dossier
    if (!window.navigateGDriveBrowserTo(target.id)) {
      // Fallback : ouvrir Drive dans un nouvel onglet si pas de browser monté
      window.open('https://drive.google.com/drive/folders/' + target.id, '_blank');
    }
  } catch (e) {
    if (cardEl) cardEl.classList.remove('is-loading');
    toast('Erreur Drive : ' + (e && e.message ? e.message : 'inconnue'));
    console.warn('[gdrive nav]', e);
  }
};
