// ═══════════════════════════════════════════════════════════════════════════
// PAGES — FICHIERS
// Hub fichiers partagés sur l'accueil, page dédiée, helpers d'icônes MIME.
// Extrait de pages.js (Phase 3 — modularisation).
// ═══════════════════════════════════════════════════════════════════════════

// ── Fichiers partagés — Hub centralisé sur l'accueil ──
var _FDEFS=[
  {key:'contrats',label:'Contrats & Baux',icon:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',desc:'Bail, contrat franchise, avenants'},
  {key:'juridique',label:'Juridique & Admin',icon:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',desc:'KBis, statuts, assurances, licences'},
  {key:'travaux',label:'Travaux & Am\u00e9nagement',icon:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/><path d="M17 12h.01"/><path d="M7 12h.01"/></svg>',desc:'Plans, devis, photos chantier'},
  {key:'rh',label:'RH & \u00c9quipe',icon:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',desc:'Contrats, planning, formations'},
  {key:'marketing',label:'Marketing & Com',icon:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',desc:'Supports com, photos, flyers'},
  {key:'finances',label:'Finances & Compta',icon:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',desc:'Bilans, relev\u00e9s, factures'}
];
var _FCOLORS=['#3b82f6','#8b5cf6','#f59e0b','#10b981','#ef4444','#06b6d4'];

function _fIcon(name){
  var ext=(name||'').split('.').pop().toLowerCase();
  if(ext==='pdf')return {bg:'#fee2e2',color:'#dc2626',label:'PDF'};
  if(ext==='xls'||ext==='xlsx'||ext==='csv')return {bg:'#d1fae5',color:'#059669',label:ext.toUpperCase()};
  if(ext==='doc'||ext==='docx')return {bg:'#dbeafe',color:'#2563eb',label:'DOC'};
  if(ext==='ppt'||ext==='pptx')return {bg:'#fef3c7',color:'#d97706',label:'PPT'};
  if(['jpg','jpeg','png','gif','webp','svg'].indexOf(ext)>=0)return {bg:'#e0e7ff',color:'#4f46e5',label:'IMG'};
  return {bg:'#f1f5f9',color:'#64748b',label:ext.toUpperCase()||'?'};
}

function renderFichiersPage(){
  var ids=_getStudioIds();
  var totalFiles=0;
  ids.forEach(function(id){totalFiles+=(S.files[id]||[]).length;});
  var h='';
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:10px">';
  h+='<div><div style="font-size:20px;font-weight:700;color:#1a1a1a">Fichiers partag\u00e9s</div>';
  h+='<div style="font-size:12px;color:#888;margin-top:2px">'+totalFiles+' document'+(totalFiles!==1?'s':'')+' \u00b7 '+ids.length+' studio'+(ids.length!==1?'s':'')+'</div></div>';
  h+='<div style="display:flex;align-items:center;gap:8px">';
  h+=renderSearchBar();
  h+=userAvatarWidget(S.profile);
  h+='</div></div>';
  h+=renderFichiersHub();
  return h;
}

function renderFichiersHub(){
  var ids=_getStudioIds();
  var totalFiles=0;
  ids.forEach(function(id){totalFiles+=(S.files[id]||[]).length;});
  var h='<div class="fichiers-hub">';
  // Header
  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">';
  h+='<div style="display:flex;align-items:center;gap:10px">';
  h+='<div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#3b82f6,#6366f1);display:flex;align-items:center;justify-content:center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></div>';
  h+='<div><div style="font-size:15px;font-weight:700;color:#1a1a1a">Fichiers partag\u00e9s</div>';
  h+='<div style="font-size:11px;color:#94a3b8">'+totalFiles+' document'+(totalFiles!==1?'s':'')+' au total</div></div></div>';
  // Back button when drilling down
  if(S.fileNav.studio){
    h+='<button onclick="setFileNav(null)" class="btn" style="font-size:12px;display:flex;align-items:center;gap:4px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>Retour</button>';
  }
  h+='</div>';
  // Breadcrumb
  if(S.fileNav.studio){
    var sName=S.studios[S.fileNav.studio]?S.studios[S.fileNav.studio].name:S.fileNav.studio;
    h+='<div style="display:flex;align-items:center;gap:6px;font-size:11px;margin-bottom:14px;color:#94a3b8;flex-wrap:wrap">';
    h+='<span style="cursor:pointer;color:#3b82f6;font-weight:500" onclick="setFileNav(null)">Tous les studios</span>';
    h+='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>';
    if(S.fileNav.folder){
      h+='<span style="cursor:pointer;color:#3b82f6;font-weight:500" onclick="setFileNav(\''+S.fileNav.studio+'\')">'+sName+'</span>';
      h+='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>';
      var fDef=_FDEFS.filter(function(f){return f.key===S.fileNav.folder;})[0];
      h+='<span style="font-weight:600;color:#1a1a1a">'+(fDef?fDef.label:S.fileNav.folder)+'</span>';
    } else {
      h+='<span style="font-weight:600;color:#1a1a1a">'+sName+'</span>';
    }
    h+='</div>';
  }

  // ── Niveau 0 : grille de studios ──
  if(!S.fileNav.studio){
    h+='<div class="folder-grid">';
    if(ids.length===0){
      h+='<div style="text-align:center;padding:32px;color:#94a3b8">';
      h+='<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:.4;margin-bottom:8px"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>';
      h+='<div style="font-size:12px;font-weight:600">Aucun studio</div>';
      h+='</div>';
    }
    ids.forEach(function(id,idx){
      var s=S.studios[id];
      if(!s)return;
      var fc=(S.files[id]||[]).length;
      var hasDrive=!!(s.driveUrl);
      var statColor=s.statut==='ouvert'?'#10b981':s.statut==='chantier'?'#f59e0b':s.statut==='preparation'?'#3b82f6':'#94a3b8';
      h+='<div class="folder-card studio-folder-card" onclick="setFileNav(\''+id+'\')" style="animation-delay:'+(idx*60)+'ms">';
      h+='<div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,'+statColor+'20,'+statColor+'08);display:flex;align-items:center;justify-content:center;margin-bottom:10px">';
      h+='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="'+statColor+'" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></div>';
      h+='<div style="font-size:13px;font-weight:600;color:#1a1a1a;margin-bottom:2px">'+s.name+'</div>';
      h+='<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8">';
      h+=fc+' fichier'+(fc!==1?'s':'');
      if(hasDrive)h+=' <span style="color:#34a853;font-weight:600" title="Google Drive connect\u00e9">\u2713 Drive</span>';
      h+='</div>';
      h+='</div>';
    });
    h+='</div>';

  // ── Niveau 1 : 6 sous-dossiers d'un studio ──
  } else if(!S.fileNav.folder){
    var sid=S.fileNav.studio;
    var sFiles=S.files[sid]||[];
    var sDrive=S.studios[sid]&&S.studios[sid].driveUrl||'';
    // Google Drive config bar
    h+='<div class="drive-config-bar">';
    h+='<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L4.5 12.5l3.5 6h8l3.5-6L12 2z" fill="#FBBC04"/><path d="M4.5 12.5l3.5 6h8" fill="#34A853"/><path d="M12 2l7.5 10.5-3.5 6" fill="#4285F4"/><path d="M4.5 12.5L12 2l7.5 10.5H4.5z" fill="#EA4335" opacity=".3"/></svg>';
    if(sDrive){
      h+='<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;color:#1e40af">Google Drive connect\u00e9</div>';
      h+='<div style="font-size:10px;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+sDrive+'</div></div>';
      h+='<a href="'+sDrive+'" target="_blank" class="btn btn-primary" style="font-size:11px;text-decoration:none;padding:6px 14px;flex-shrink:0">Ouvrir Drive</a>';
      if(!isViewer())h+='<button class="btn" style="font-size:10px;padding:4px 8px;color:#dc2626" onclick="event.stopPropagation();_setDriveUrl(\''+sid+'\',\'\')">Retirer</button>';
    } else {
      h+='<div style="flex:1"><div style="font-size:12px;font-weight:600;color:#1e40af">Connecter Google Drive</div>';
      h+='<div style="font-size:10px;color:#64748b">Collez le lien d\'un dossier Drive partag\u00e9 pour stocker vos fichiers (15 Go gratuit)</div></div>';
      if(!isViewer())h+='<button class="btn btn-primary" style="font-size:11px;padding:6px 14px;flex-shrink:0" onclick="event.stopPropagation();_promptDriveUrl(\''+sid+'\')">Configurer</button>';
    }
    h+='</div>';
    // Google Drive — file browser natif in-app (OAuth + Drive API v3)
    if(sDrive){
      var dFId=_extractDriveFolderId(sDrive);
      if(dFId){
        h+='<div class="drive-embed-wrap"><div data-gdrive-browser="'+dFId+'"></div></div>';
      }
    }
    // Sub-folders grid
    var driveFolderUrls=(S.studios[sid]&&S.studios[sid].driveFolderUrls)||{};
    h+='<div class="folder-grid">';
    _FDEFS.forEach(function(fd,idx){
      var fc=sFiles.filter(function(f){return f.folder===fd.key;}).length;
      var folderDrive=driveFolderUrls[fd.key]||'';
      var clickHandler=folderDrive
        ? 'window.open(\''+folderDrive.replace(/'/g,'%27')+'\',\'_blank\')'
        : '_promptFolderDriveUrl(\''+sid+'\',\''+fd.key+'\')';
      h+='<div class="folder-card" onclick="'+clickHandler+'" style="animation-delay:'+(idx*60)+'ms;position:relative">';
      // Bouton config (admin) si Drive déjà configuré
      if(folderDrive&&!isViewer()){
        h+='<button onclick="event.stopPropagation();_promptFolderDriveUrl(\''+sid+'\',\''+fd.key+'\')" title="Modifier le lien Drive" style="position:absolute;top:8px;right:8px;width:24px;height:24px;border-radius:6px;border:1px solid #e8e8e0;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:11px;padding:0">&#9881;</button>';
      }
      h+='<div style="width:40px;height:40px;border-radius:12px;background:'+_FCOLORS[idx]+'12;display:flex;align-items:center;justify-content:center;margin-bottom:10px;color:'+_FCOLORS[idx]+'">'+fd.icon+'</div>';
      h+='<div style="font-size:13px;font-weight:600;color:#1a1a1a;margin-bottom:2px">'+fd.label+'</div>';
      h+='<div style="font-size:11px;color:#94a3b8">'+fd.desc+'</div>';
      // Badge état
      if(folderDrive){
        h+='<div style="margin-top:6px;display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;color:#34a853;background:#e6f4ea;padding:2px 8px;border-radius:10px"><svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M12 2L4.5 12.5l3.5 6h8l3.5-6L12 2z" fill="#FBBC04"/><path d="M4.5 12.5l3.5 6h8" fill="#34A853"/><path d="M12 2l7.5 10.5-3.5 6" fill="#4285F4"/></svg>Drive</div>';
      } else if(fc>0){
        h+='<div style="margin-top:6px;font-size:10px;font-weight:700;color:'+_FCOLORS[idx]+';background:'+_FCOLORS[idx]+'10;padding:2px 8px;border-radius:10px;display:inline-block">'+fc+' fichier'+(fc!==1?'s':'')+'</div>';
      } else if(!isViewer()){
        h+='<div style="margin-top:6px;font-size:10px;color:#94a3b8;font-style:italic">Cliquez pour lier un dossier Drive</div>';
      }
      h+='</div>';
    });
    h+='</div>';

  // ── Niveau 2 : fichiers d'un dossier ──
  } else {
    var sid2=S.fileNav.studio;
    var folder=S.fileNav.folder;
    var allF=S.files[sid2]||[];
    var filtered=allF.filter(function(f){return f.folder===folder;});
    var fDef2=_FDEFS.filter(function(f){return f.key===folder;})[0];
    if(!fDef2){S.fileNav.folder=null;render();return h;}
    var fIdx=_FDEFS.indexOf(fDef2);
    var fColor=_FCOLORS[fIdx]||'#3b82f6';
    var sDrive2=S.studios[sid2]&&S.studios[sid2].driveUrl||'';
    // Actions bar
    h+='<div style="display:flex;gap:8px;margin-bottom:14px;align-items:center;flex-wrap:wrap">';
    if(!isViewer()){
      h+='<label class="btn btn-primary" style="cursor:pointer;font-size:12px;display:flex;align-items:center;gap:6px">';
      h+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
      h+='Ajouter<input type="file" style="display:none" onchange="uploadFichier(\''+sid2+'\',this,\''+folder+'\')" multiple/></label>';
    }
    if(sDrive2){
      h+='<a href="'+sDrive2+'" target="_blank" class="btn" style="font-size:12px;text-decoration:none;display:flex;align-items:center;gap:6px;color:#1e40af;border-color:#bfdbfe;background:#eff6ff">';
      h+='<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L4.5 12.5l3.5 6h8l3.5-6L12 2z" fill="#FBBC04"/><path d="M4.5 12.5l3.5 6h8" fill="#34A853"/><path d="M12 2l7.5 10.5-3.5 6" fill="#4285F4"/></svg>';
      h+='Ouvrir Drive</a>';
    }
    // Search filter
    if(filtered.length>3){
      h+='<div style="flex:1"></div>';
      h+='<div style="display:flex;align-items:center;gap:6px;background:#f5f5ed;border:1px solid #e8e8e0;border-radius:8px;padding:4px 10px;min-width:140px">';
      h+='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
      h+='<input type="text" placeholder="Rechercher..." style="border:none;background:none;font-size:11px;outline:none;width:100%;color:#1a1a1a" oninput="_filterFiles(this.value,\''+sid2+'\',\''+folder+'\')"/>';
      h+='</div>';
    }
    h+='<div id="uprog-'+sid2+'" style="display:none;font-size:12px;color:'+fColor+'">Upload en cours...</div>';
    h+='</div>';
    // File list header
    if(filtered.length>0){
      h+='<div style="font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;padding:0 12px">Fichiers Supabase ('+filtered.length+')</div>';
    }
    // Drop zone + file list
    h+='<div class="file-drop-zone" id="fdz-'+sid2+'" style="--fdz-color:'+fColor+'"';
    h+=' ondragover="event.preventDefault();this.classList.add(\'drag-over\')"';
    h+=' ondragleave="this.classList.remove(\'drag-over\')"';
    h+=' ondrop="event.preventDefault();this.classList.remove(\'drag-over\');_handleDrop(event,\''+sid2+'\',\''+folder+'\')">';
    if(filtered.length===0){
      h+='<div class="file-empty-state">';
      h+='<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="'+fColor+'" stroke-width="1.2" style="opacity:.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
      h+='<div style="font-size:13px;font-weight:600;color:#64748b;margin-top:10px">Aucun fichier dans ce dossier</div>';
      h+='<div style="font-size:11px;color:#94a3b8;margin-top:4px">Glissez vos fichiers ici ou cliquez "Ajouter"</div>';
      h+='</div>';
    } else {
      filtered.forEach(function(f,fi){
        var fi2=_fIcon(f.name);
        var isImg=['jpg','jpeg','png','gif','webp'].indexOf((f.name||'').split('.').pop().toLowerCase())>=0;
        h+='<div class="fh-file-row" data-fname="'+(f.name||'').toLowerCase().replace(/"/g,'&quot;')+'" style="animation-delay:'+(fi*40)+'ms">';
        // Thumbnail or type badge
        h+='<div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">';
        if(isImg){
          h+='<div style="width:42px;height:42px;border-radius:8px;overflow:hidden;flex-shrink:0;border:1px solid #e8e8e0"><img src="'+f.url+'" style="width:100%;height:100%;object-fit:cover" loading="lazy" onerror="this.parentNode.innerHTML=\'IMG\'"/></div>';
        } else {
          h+='<div style="width:42px;height:42px;border-radius:8px;background:'+fi2.bg+';color:'+fi2.color+';display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;flex-shrink:0">'+fi2.label+'</div>';
        }
        h+='<div style="min-width:0"><div style="font-size:12px;font-weight:600;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+f.name+'</div>';
        h+='<div style="font-size:10px;color:#94a3b8;margin-top:1px">'+f.date+' \u00b7 '+f.size+'</div></div></div>';
        // Action buttons
        h+='<div style="display:flex;gap:4px;flex-shrink:0">';
        h+='<button class="btn fh-action-btn" title="Copier le lien" onclick="event.stopPropagation();_copyFileLink(\''+f.url.replace(/'/g,"\\'")+'\')">';
        h+='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>';
        h+='<a href="'+f.url+'" target="_blank" class="btn fh-action-btn" title="Ouvrir" style="text-decoration:none">';
        h+='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>';
        if(!isViewer())h+='<button class="btn fh-action-btn" title="Supprimer" style="color:#dc2626" onclick="event.stopPropagation();deleteFichier(\''+sid2+'\',\''+f.path.replace(/'/g,"\\'")+'\')">';
        if(!isViewer())h+='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>';
        h+='</div></div>';
      });
    }
    h+='</div>';
  }
  h+='</div>';
  return h;
}

// Google Drive URL config
function _promptDriveUrl(sid){
  var url=prompt('Collez le lien du dossier Google Drive partag\u00e9 pour '+((S.studios[sid]&&S.studios[sid].name)||sid)+' :');
  if(url===null)return;
  url=url.trim();
  if(url&&!/drive\.google\.com/i.test(url)){toast('URL invalide — collez un lien Google Drive');return;}
  _setDriveUrl(sid,url);
}
async function _setDriveUrl(sid,url){
  if(isViewer()||!S.studios[sid])return;
  S.studios[sid].driveUrl=url||'';
  var res=await sb.from('studios').upsert({id:sid,data:S.studios[sid],updated_at:new Date().toISOString()});
  if(res.error){toast('Erreur : '+res.error.message);return;}
  toast(url?'Drive connect\u00e9':'Drive retir\u00e9');
  render();
}

function _promptFolderDriveUrl(sid,folderKey){
  if(isViewer()){toast('Action r\u00e9serv\u00e9e aux administrateurs');return;}
  if(!S.studios[sid])return;
  var fDef=_FDEFS.filter(function(f){return f.key===folderKey;})[0];
  var fLabel=fDef?fDef.label:folderKey;
  var current=(S.studios[sid].driveFolderUrls&&S.studios[sid].driveFolderUrls[folderKey])||'';
  var url=prompt('Lien Google Drive pour « '+fLabel+' » \u2014 '+(S.studios[sid].name||sid)+' :\n\n(laissez vide pour supprimer)',current);
  if(url===null)return;
  url=url.trim();
  if(url&&!/drive\.google\.com/i.test(url)){toast('URL invalide \u2014 collez un lien Google Drive');return;}
  _setFolderDriveUrl(sid,folderKey,url);
}
async function _setFolderDriveUrl(sid,folderKey,url){
  if(isViewer()||!S.studios[sid])return;
  var current=Object.assign({},S.studios[sid].driveFolderUrls||{});
  if(url)current[folderKey]=url;
  else delete current[folderKey];
  // Merge atomique via rpcPatch \u2014 \u00e9vite race condition multi-utilisateur
  var result=await rpcPatch(sid,{merge:{driveFolderUrls:current}});
  if(result){S.studios[sid]=result;toast(url?'Lien Drive enregistr\u00e9':'Lien Drive supprim\u00e9');}
  render();
}

// Drag & drop handler for file hub
function _handleDrop(ev,sid,folder){
  if(isViewer())return;
  var dt=ev.dataTransfer;if(!dt||!dt.files||!dt.files.length)return;
  var fakeInput={files:dt.files};
  uploadFichier(sid,fakeInput,folder);
}

function _extractDriveFolderId(url){
  if(!url)return null;
  var m=url.match(/\/folders\/([^?/]+)/)||url.match(/id=([^&]+)/)||url.match(/[-\w]{25,}/);
  return m?(m[1]||m[0]):null;
}

function _filterFiles(query,sid,folder){
  var rows=document.querySelectorAll('.fh-file-row');
  var q=(query||'').toLowerCase();
  rows.forEach(function(row){
    var name=(row.getAttribute('data-fname')||'').toLowerCase();
    row.style.display=(!q||name.indexOf(q)>=0)?'':'none';
  });
}

function _copyFileLink(url){
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(function(){
      if(typeof toast==='function')toast('Lien copié !');
    });
  }else{
    var ta=document.createElement('textarea');
    ta.value=url;document.body.appendChild(ta);
    ta.select();document.execCommand('copy');document.body.removeChild(ta);
    if(typeof toast==='function')toast('Lien copié !');
  }
}

// Ouvre la tâche dans la page studio (onglet Workflow)
function openMyTask(sid,todoId){
  if(!S.studios[sid])return;
  S.selectedId=sid;
  S.view='detail';
  S.detailTab='workflow';
  render();
  // Scroll to the task if possible
  setTimeout(function(){
    var el=document.querySelector('[data-todo-id="'+todoId+'"]');
    if(el&&el.scrollIntoView)el.scrollIntoView({behavior:'smooth',block:'center'});
  },200);
}

