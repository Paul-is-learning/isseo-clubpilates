// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANT PREACT — Widget "Prochaines étapes" (pilote Phase 5)
// ═══════════════════════════════════════════════════════════════════════════
// Premier composant migré vers Preact + htm. Sert de pattern pour les suivants.
// Philosophie : coexiste avec le système render() full innerHTML existant.
//   - pages-accueil.js émet un <div data-preact-widget="next-steps"></div>
//   - après render(), app.js mount ce composant dans le div
//   - au prochain render(), le div est recréé → Preact re-mount
// Quand plus de composants seront migrés, on pourra retirer les render() legacy
// un par un sans big-bang.
// ═══════════════════════════════════════════════════════════════════════════
(function () {
  // Dépendances globales (UMD chargées via <script>)
  var _preact = window.preact;
  var _htm = window.htmModule || window.htm;
  if (!_preact || !_htm) {
    console.warn('[Preact] preact ou htm non chargé — widget next-steps indisponible');
    return;
  }

  var h = _preact.h;
  var render = _preact.render;
  // htm : init une fois, lie à h
  var html = _htm.bind(h);

  // SVG icônes réutilisés
  var iconCheck = html`
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60A5FA"
      stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  `;
  var iconChevron = html`
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
      stroke="rgba(255,255,255,0.45)" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  `;

  // Composant fonctionnel
  function NextStepsWidget(props) {
    var items = props.items || [];
    if (!items.length) return null;
    return html`
      <div class="next-steps-widget">
        <div class="next-steps-widget__header">
          ${iconCheck}
          <span class="next-steps-widget__title">Prochaines étapes</span>
          <span class="next-steps-widget__count">${items.length}</span>
        </div>
        <div class="next-steps-widget__list">
          ${items.map(function (it) {
            return html`
              <div class="next-steps-widget__item"
                   onClick=${function () { window.openDetail && window.openDetail(it.id); }}>
                <div class="next-steps-widget__item-body">
                  <div class="next-steps-widget__item-name">${it.name}</div>
                  <div class="next-steps-widget__item-step">→ ${it.step}</div>
                </div>
                ${iconChevron}
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  // Calcul des prochaines étapes à partir du state global S
  function computeNextSteps() {
    if (!window.S || !window.S.studios) return [];
    var ids = (typeof window._getStudioIds === 'function') ? window._getStudioIds() : Object.keys(window.S.studios);
    var STEPS_FALLBACK = window.STEPS || [];
    var out = [];
    ids.forEach(function (id) {
      var st = window.S.studios[id];
      if (!st || st.statut === 'abandonne') return;
      var stepsList = (typeof window.getStudioSteps === 'function')
        ? window.getStudioSteps(id)
        : STEPS_FALLBACK;
      var done = st.steps || {};
      var next = null;
      for (var i = 0; i < stepsList.length; i++) {
        if (!done[stepsList[i].id]) { next = stepsList[i]; break; }
      }
      if (!next) return;
      out.push({ id: id, name: st.name, step: next.label });
    });
    return out;
  }

  // API publique : mount dans le container trouvé
  window.mountNextStepsWidget = function mountNextStepsWidget() {
    var container = document.querySelector('[data-preact-widget="next-steps"]');
    if (!container) return;
    var items = computeNextSteps();
    render(h(NextStepsWidget, { items: items }), container);
  };
})();
