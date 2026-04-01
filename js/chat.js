// ── Chat flottant global entre associés ───────────────────────────────────────

function renderFloatingChat(){
  var msgs=S.globalChat||[];
  var me=(S.profile&&S.profile.nom)||'';
  var colors=['#185FA5','#0F6E56','#854F0B','#993C1D','#533AB7','#A32D2D'];
  function aC(n){var h=0;for(var i=0;i<n.length;i++)h=n.charCodeAt(i)+((h<<5)-h);return colors[Math.abs(h)%colors.length];}
  function ini(n){return n.split(' ').map(function(w){return w[0]||'';}).join('').toUpperCase().slice(0,2);}
  // Calcul non lus (messages des autres après la dernière lecture)
  var unread=msgs.filter(function(m){return m.auteur!==me&&m.ts>S.chatLastSeen;}).length;
  var h='';
  // Bulle fermée
  h+='<div style="position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;align-items:flex-end;gap:8px">';
  if(S.chatOpen){
    // Panneau ouvert
    h+='<div style="width:360px;background:#fff;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,0.18);border:1px solid #e0e4ec;display:flex;flex-direction:column;overflow:hidden">';
    // Header
    h+='<div style="background:#0f1f3d;padding:12px 14px;display:flex;align-items:center;justify-content:space-between">';
    h+='<div style="display:flex;align-items:center;gap:8px">';
    h+='<div style="width:28px;height:28px;background:rgba(255,255,255,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px">💬</div>';
    h+='<div>';
    h+='<div style="color:#fff;font-size:12px;font-weight:700;letter-spacing:0.3px">Chat</div>';
    h+='<div style="color:rgba(255,255,255,0.55);font-size:10px">'+msgs.length+' message'+(msgs.length>1?'s':'')+'</div>';
    h+='</div></div>';
    h+='<button onclick="toggleChat()" style="background:rgba(255,255,255,0.12);border:none;color:#fff;width:24px;height:24px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;line-height:1">×</button>';
    h+='</div>';
    // Liste messages
    h+='<div id="global-chat-msgs" style="flex:1;height:400px;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px;background:#f8f9fb">';
    if(msgs.length===0){
      h+='<div style="text-align:center;color:#aaa;font-size:12px;margin:auto;padding:20px 0">Aucun message pour l\'instant.<br>Commencez la discussion !</div>';
    }
    var canDeleteMsg=isSuperAdmin();
    msgs.forEach(function(m){
      var isMe=m.auteur===me;
      var ts=m.ts||'';
      h+='<div style="display:flex;gap:7px;align-items:flex-end;'+(isMe?'flex-direction:row-reverse':'')+'" class="chat-msg-row">';
      h+=avatarHTML(m.auteur||'?',26);
      h+='<div style="max-width:240px;position:relative">';
      if(!isMe)h+='<div style="font-size:9.5px;color:#888;margin-bottom:2px;font-weight:600">'+(m.auteur||'')+'</div>';
      h+='<div style="background:'+(isMe?'#0f1f3d':'#fff')+';color:'+(isMe?'#fff':'#2c3e50')+';border-radius:'+(isMe?'12px 12px 4px 12px':'12px 12px 12px 4px')+';padding:7px 10px;font-size:12px;line-height:1.45;box-shadow:0 1px 3px rgba(0,0,0,0.08);word-break:break-word">'+(m.texte||'')+'</div>';
      h+='<div style="font-size:9px;color:#bbb;margin-top:2px;text-align:'+(isMe?'right':'left')+'">'+(m.date||'')+(canDeleteMsg?'&nbsp;<button onclick="supprimerGlobalMessage(\''+ts.replace(/'/g,"\\'")+'\')" style="background:none;border:none;cursor:pointer;color:#ddd;font-size:10px;padding:0;line-height:1;margin-left:2px" title="Supprimer">🗑</button>':'')+'</div>';
      h+='</div></div>';
    });
    h+='</div>';
    // Input
    if(isViewer()){
      h+='<div style="padding:8px 12px;border-top:1px solid #eee;background:#f8f9fb;text-align:center;font-size:10px;color:#aaa">👁 Lecture seule</div>';
    } else {
      h+='<div style="padding:10px;border-top:1px solid #eee;background:#fff;display:flex;gap:6px;align-items:center">';
      h+='<input id="global-chat-input" type="text" placeholder="Écrire un message…" style="flex:1;border:1px solid #dce1ea;border-radius:20px;padding:7px 12px;font-size:12px;outline:none;background:#f8f9fb" onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();envoyerGlobalMessage();}">';
      h+='<button onclick="envoyerGlobalMessage()" style="background:#0f1f3d;color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0">➤</button>';
      h+='</div>';
    }
    h+='</div>';
  }
  // Bouton bulle
  h+='<button onclick="toggleChat()" style="width:52px;height:52px;border-radius:50%;background:#0f1f3d;border:none;cursor:pointer;box-shadow:0 4px 14px rgba(15,31,61,0.4);display:flex;align-items:center;justify-content:center;font-size:22px;position:relative;transition:transform .15s" onmouseover="this.style.transform=\'scale(1.08)\'" onmouseout="this.style.transform=\'scale(1)\'">';
  h+='💬';
  if(unread>0){
    h+='<span style="position:absolute;top:0;right:0;background:#e53e3e;color:#fff;border-radius:50%;width:18px;height:18px;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #fff">'+Math.min(unread,9)+'</span>';
  }
  h+='</button>';
  h+='</div>';
  return h;
}

function saveLoyerMensuel(sid,lm){
  if(isViewer())return;
  if(!S.studios[sid])S.studios[sid]={};
  S.studios[sid].loyer_mensuel=lm>0?lm:0;
  markDirty('loyer',sid);
  render();
}

function saveCapexLine(sid,idx,val){
  if(isViewer())return;
  if(!S.studios[sid])S.studios[sid]={};
  if(!S.studios[sid].capexDetail)S.studios[sid].capexDetail={};
  var key='l'+idx;
  val=Math.max(0,Math.round(+val)||0);
  S.studios[sid].capexDetail[key]=val;
  markDirty('capex',sid);
  render();
  toast('CAPEX mis à jour ✓');
}

function renderChat(){
  var cr=document.getElementById('chat-root');
  if(!cr)return;
  if(S.view==='auth'){cr.innerHTML='';return;}
  // Ne pas écraser si l'utilisateur est en train de taper (input non vide + focus)
  var inp=document.getElementById('global-chat-input');
  if(inp&&document.activeElement===inp&&inp.value.length>0)return;
  cr.innerHTML=renderFloatingChat();
  if(S.chatOpen){
    var list=document.getElementById('global-chat-msgs');
    if(list)list.scrollTop=list.scrollHeight;
  }
}

function toggleChat(){
  S.chatOpen=!S.chatOpen;
  if(S.chatOpen&&S.globalChat.length>0){
    S.chatLastSeen=S.globalChat[S.globalChat.length-1].ts;
    localStorage.setItem('chatLastSeen',S.chatLastSeen);
  }
  renderChat();
  if(S.chatOpen){
    var list=document.getElementById('global-chat-msgs');
    if(list)list.scrollTop=list.scrollHeight;
    setTimeout(function(){var i=document.getElementById('global-chat-input');if(i)i.focus();},50);
  }
}

async function envoyerGlobalMessage(){
  if(isViewer())return;
  var inp=document.getElementById('global-chat-input');
  var texte=inp&&inp.value&&inp.value.trim();
  if(!texte)return;
  inp.value='';
  var now=new Date();
  var msg={
    auteur:(S.profile&&S.profile.nom)||'Associé',
    texte:texte,
    date:now.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})+' '+now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),
    ts:now.toISOString(),
  };
  if(!S.globalChat)S.globalChat=[];
  S.globalChat.push(msg);
  S.chatLastSeen=msg.ts;
  localStorage.setItem('chatLastSeen',S.chatLastSeen);
  renderChat();
  var list=document.getElementById('global-chat-msgs');
  if(list)list.scrollTop=list.scrollHeight;
  // Merge + save Supabase
  var ex=await sb.from('studios').select('data').eq('id','global_chat').maybeSingle();
  var existing=(ex.data&&ex.data.data&&ex.data.data.messages)||[];
  var tsSet=new Set(existing.map(function(m){return m.ts;}));
  if(!tsSet.has(msg.ts))existing.push(msg);
  existing.sort(function(a,b){return a.ts>b.ts?1:-1;});
  await sb.from('studios').upsert({id:'global_chat',data:{messages:existing},updated_at:new Date().toISOString()});
  notifyAll({type:'message',title:'Chat — '+(msg.auteur||'Associé'),body:texte.length>80?texte.slice(0,80)+'…':texte});
  // Refocus l'input après sauvegarde
  setTimeout(function(){var i=document.getElementById('global-chat-input');if(i)i.focus();},50);
}

async function supprimerGlobalMessage(ts){
  if(!isSuperAdmin())return;
  S.globalChat=S.globalChat.filter(function(m){return m.ts!==ts;});
  renderChat();
  await sb.from('studios').upsert({id:'global_chat',data:{messages:S.globalChat},updated_at:new Date().toISOString()});
}

