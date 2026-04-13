const MOIS=['Jan','Fev','Mar','Avr','Mai','Jun','Jul','Aou','Sep','Oct','Nov','Dec'];

// ── Données localisation par studio ───────────────────────────────────────────
const LOCALISATION_DATA={
  garenne:{
    trafic:[
      {lbl:'TMJA estimé RD908',kpi:'~20–30K',sub:'véh/jour, 2 sens · Données CD92 (open data)',col:'#D85A30'},
      {lbl:'Profil de l\'axe',kpi:'Voie urbaine dense',sub:'Ancienne RN308 → RD908 · Traversée centre-ville, 2×1 voie',col:'#D85A30'},
      {lbl:'Nature du trafic',kpi:'Domicile – travail',sub:'Flux dominants : La Défense + transit Clichy / Colombes',col:'#D85A30'},
    ],
    transports:[
      {lbl:'Transilien L — Paris Saint-Lazare',kpi:'Gare La Garenne-Colombes',sub:'~700m du studio (à pied ~9 min) · 1 train / 10 min · Saint-Lazare en ~12 min',tags:[{t:'8 900 entrants/jour',c:'tb'}],col:'#378ADD'},
      {lbl:'Tramway T2 — Pont de Bezons ↔ Porte de Versailles',kpi:'Stations Charlebourg / Les Fauvelles',sub:'Connexion La Défense directe · Correspondance Transilien L',tags:[{t:'Dessert le corridor La Défense',c:'tb'}],col:'#378ADD'},
      {lbl:'Bus RATP (5 lignes)',kpi:'73 · 163 · 176 · 178 · 363',sub:'Ligne 73 → Musée d\'Orsay direct · Lignes nocturnes N24 · N152',tags:[{t:'Maillage TC exceptionnel',c:'tg'}],col:'#1D9E75'},
      {lbl:'Densité TC',kpi:'2,24 stations/km²',sub:'vs 0,76 moyenne Hauts-de-Seine · Record parmi les communes 92',tags:[{t:'Forte capture piétonne potentielle',c:'tg'}],col:'#1D9E75'},
    ],
    demo:[
      {lbl:'Population (2022)',kpi:'~30 000',sub:'hab sur 1,78 km² · +26% vs 1999',col:'#7F77DD'},
      {lbl:'Densité',kpi:'16 700',sub:'hab/km² — extrêmement élevée · Top 5% France',col:'#7F77DD'},
      {lbl:'Revenu médian ménage',kpi:'39 200 €',sub:'/ an — très élevé · Cible Club Pilates premium',col:'#7F77DD'},
    ],
    comparaison:[
      {lbl:'TMJA (véh/jour)',pct:95,col:'#378ADD',note:'Lattes ~28K · La Garenne ~25K → comparable'},
      {lbl:'Densité TC',pct:100,col:'#1D9E75',note:'La Garenne >> Lattes — 4 modes vs 1 tram'},
      {lbl:'Densité pop.',pct:100,col:'#7F77DD',note:'La Garenne : 16 700/km² vs Lattes : ~600/km²'},
      {lbl:'Revenu médian',pct:88,col:'#BA7517',note:'La Garenne : 39K€ vs Lattes : 26K€ — +50%'},
      {lbl:'Flux piéton',pct:100,col:'#D85A30',note:'La Garenne >> Lattes — marche à pied 81% usagers gare'},
      {lbl:'Saisonnalité',pct:20,col:'#888780',note:'La Garenne : quasi-nulle vs Lattes : +30% été'},
    ],
    tags:[
      {t:'Densité pop. exceptionnelle',c:'tg'},{t:'Revenu élevé — cible Pilates',c:'tg'},
      {t:'TC multi-modal (L + T2 + 5 bus)',c:'tg'},{t:'Flux piéton fort depuis gare',c:'tg'},
      {t:'Proximité La Défense (cadres)',c:'tg'},{t:'Trafic auto stable toute l\'année',c:'tg'},
      {t:'Axe 2×1 voie — visibilité auto limitée',c:'ta'},{t:'Stationnement limité centre-ville',c:'ta'},
      {t:'Concurrence pilates / fitness à identifier',c:'tr'},{t:'Profil navetteur → créneaux 6h30-9h + 18h-20h30',c:'tb'},
    ],
    synthese:'Contrairement à Lattes (flux auto dominant, dépendance voiture), La Garenne-Colombes offre un profil <b>radicalement différent</b> : flux piéton très élevé, TC dense, revenus supérieurs, et une clientèle de cadres navetteurs La Défense — cœur de cible Club Pilates. Le studio doit capitaliser sur la capture piétonne depuis la gare et les créneaux 6h30–9h + 18h–20h30.',
  },
  lattes:{
    trafic:[
      {lbl:'TMJA av. de Montpellier',kpi:'~28 000',sub:'véh/jour · Axe structurant Montpellier–Lattes',col:'#D85A30'},
      {lbl:'Profil de l\'axe',kpi:'Avenue commerciale',sub:'2×2 voies · Fort flux pendulaire · Bonne visibilité',col:'#D85A30'},
      {lbl:'Nature du trafic',kpi:'Flux automobile dominant',sub:'Dépendance voiture forte · Clientèle de proximité',col:'#D85A30'},
    ],
    transports:[
      {lbl:'Tramway ligne 1 — Mosson ↔ Odysseum',kpi:'Arrêt Lattes Centre (~1,5 km)',sub:'Connexion centre Montpellier en ~20 min',tags:[{t:'Réseau TaM Montpellier',c:'tb'}],col:'#378ADD'},
      {lbl:'Bus TaM (plusieurs lignes)',kpi:'Desserte Lattes / Montpellier',sub:'Fréquence correcte en heure de pointe',tags:[{t:'TC moins dense qu\'en IDF',c:'ta'}],col:'#378ADD'},
    ],
    demo:[
      {lbl:'Population (2022)',kpi:'~17 500',sub:'hab · Commune résidentielle en forte croissance',col:'#7F77DD'},
      {lbl:'Densité',kpi:'~600',sub:'hab/km² — faible (territoire étendu)',col:'#7F77DD'},
      {lbl:'Revenu médian ménage',kpi:'26 000 €',sub:'/ an · Profil familial CSP+ en développement',col:'#7F77DD'},
    ],
    comparaison:[
      {lbl:'TMJA (véh/jour)',pct:100,col:'#378ADD',note:'Lattes : ~28K — meilleure visibilité auto'},
      {lbl:'Densité TC',pct:25,col:'#1D9E75',note:'Lattes : 1 tram + bus vs 4 modes à La Garenne'},
      {lbl:'Densité pop.',pct:5,col:'#7F77DD',note:'Lattes : ~600/km² — population plus dispersée'},
      {lbl:'Revenu médian',pct:65,col:'#BA7517',note:'Lattes : 26K€ vs Garenne : 39K€'},
      {lbl:'Croissance pop.',pct:95,col:'#D85A30',note:'Forte croissance résidentielle +40% en 20 ans'},
      {lbl:'Bassin de vie',pct:80,col:'#888780',note:'ZAC Montpellier Sud en développement — potentiel'},
    ],
    tags:[
      {t:'Fort trafic automobile',c:'tg'},{t:'Zone commerciale attractive',c:'tg'},
      {t:'Croissance résidentielle forte',c:'tg'},{t:'Stationnement aisé',c:'tg'},
      {t:'TC limité — dépendance voiture',c:'ta'},{t:'Revenu médian plus faible',c:'ta'},
      {t:'Saisonnalité estivale +30%',c:'ta'},{t:'Concurrence fitness à surveiller',c:'tr'},
    ],
    synthese:'Lattes présente un profil "flux automobile" avec un fort TMJA et une clientèle de proximité résidentielle. La croissance démographique soutenue du bassin de vie Montpellier Sud constitue un atout majeur. Le studio bénéficiera d\'une excellente visibilité depuis l\'avenue et d\'un parking aisé, critères déterminants dans ce contexte de mobilité voiture.',
  },
  levallois:{
    trafic:[
      {lbl:'TMJA Rue Édouard Vaillant',kpi:'~15–20K',sub:'véh/jour · Rue commerçante structurante',col:'#D85A30'},
      {lbl:'Profil de l\'axe',kpi:'Artère commerçante dense',sub:'Centre-ville Levallois · 2×1 voie · Flux piéton élevé',col:'#D85A30'},
      {lbl:'Nature du trafic',kpi:'Mix piéton / voiture',sub:'Fort flux résidentiel · Cadres CSP++ dominant',col:'#D85A30'},
    ],
    transports:[
      {lbl:'Métro ligne 3 — Pont de Levallois',kpi:'~400m du studio (~5 min à pied)',sub:'Connexion Opéra / République en ~15 min',tags:[{t:'Terminus ligne 3',c:'tb'}],col:'#378ADD'},
      {lbl:'Bus RATP (4 lignes)',kpi:'163 · 174 · 175 · 176',sub:'Connexion Neuilly, La Défense, Paris',tags:[{t:'Desserte dense',c:'tg'}],col:'#1D9E75'},
      {lbl:'Vélos & trottinettes',kpi:'Vélib + opérateurs free-floating',sub:'Usage très élevé — profil jeune actif',tags:[{t:'Mobilité douce forte',c:'tg'}],col:'#1D9E75'},
    ],
    demo:[
      {lbl:'Population (2022)',kpi:'~65 000',sub:'hab sur 2,4 km² · +12% en 10 ans',col:'#7F77DD'},
      {lbl:'Densité',kpi:'27 000',sub:'hab/km² — parmi les + denses de France',col:'#7F77DD'},
      {lbl:'Revenu médian ménage',kpi:'38 500 €',sub:'/ an — très élevé · Profil cadres CSP++',col:'#7F77DD'},
    ],
    comparaison:[
      {lbl:'Densité pop.',pct:100,col:'#7F77DD',note:'Levallois : 27 000/km² — Top 3 France'},
      {lbl:'Revenu médian',pct:90,col:'#BA7517',note:'Levallois : 38,5K€ — profil premium identique Garenne'},
      {lbl:'Proximité métro',pct:100,col:'#378ADD',note:'400m métro ligne 3 — accessibilité maximale'},
      {lbl:'Flux piéton',pct:90,col:'#D85A30',note:'Artère commerçante à fort trafic piéton'},
      {lbl:'Stationnement',pct:30,col:'#888780',note:'Centre-ville dense — parking difficile'},
    ],
    tags:[
      {t:'Densité pop. exceptionnelle',c:'tg'},{t:'Métro L3 à 400m',c:'tg'},
      {t:'Revenu élevé — cible Pilates',c:'tg'},{t:'Forte fréquentation piétonne',c:'tg'},
      {t:'Cadres CSP++ La Défense / Paris',c:'tg'},{t:'Stationnement difficile',c:'ta'},
      {t:'Loyers élevés',c:'ta'},{t:'Concurrence fitness dense',c:'tr'},
    ],
    synthese:'Levallois-Perret est l\'un des marchés les plus favorables d\'Île-de-France pour Club Pilates : densité record, revenus très élevés, métro ligne 3 à 400m et flux piéton important sur une artère commerçante. La clientèle cible (cadres 30-50 ans, revenus > 38K€) est surreprésentée. Enjeu principal : se positionner sur les créneaux 7h-9h et 18h30-20h30.',
  },
  issy:{
    trafic:[
      {lbl:'TMJA avenue Victor Cresson',kpi:'~18–22K',sub:'véh/jour · Axe résidentiel/commercial mixte',col:'#D85A30'},
      {lbl:'Profil de l\'axe',kpi:'Avenue résidentielle',sub:'Quartier Val de Seine · Proximité quais de Seine',col:'#D85A30'},
      {lbl:'Nature du trafic',kpi:'Résidentiel premium',sub:'Forte proportion cadres/dirigeants · Nombreuses entreprises tech',col:'#D85A30'},
    ],
    transports:[
      {lbl:'Métro ligne 12 — Mairie d\'Issy',kpi:'~600m du studio (~8 min à pied)',sub:'Paris Montparnasse en ~12 min',tags:[{t:'Ligne 12',c:'tb'}],col:'#378ADD'},
      {lbl:'Tramway T2',kpi:'Issy Val de Seine',sub:'Connexion La Défense · Pont de Bezons',tags:[{t:'Connexion La Défense',c:'tb'}],col:'#378ADD'},
      {lbl:'RER C',kpi:'Issy-Plaine',sub:'Connexion Paris Rive Gauche directe',tags:[{t:'Multimodal',c:'tg'}],col:'#1D9E75'},
    ],
    demo:[
      {lbl:'Population (2022)',kpi:'~67 000',sub:'hab · Commune en forte attractivité',col:'#7F77DD'},
      {lbl:'Densité',kpi:'11 800',sub:'hab/km² — élevée · Quartier mixte résidentiel/tertiaire',col:'#7F77DD'},
      {lbl:'Revenu médian ménage',kpi:'40 500 €',sub:'/ an — top 92 · Concentration cadres tech & finance',col:'#7F77DD'},
    ],
    comparaison:[
      {lbl:'Revenu médian',pct:100,col:'#BA7517',note:'Issy : 40,5K€ — le plus élevé du portefeuille'},
      {lbl:'Multimodalité TC',pct:95,col:'#378ADD',note:'Métro L12 + T2 + RER C — trio exceptionnel'},
      {lbl:'Pôles entreprises',pct:100,col:'#D85A30',note:'Canal+, Microsoft, SFR, Bouygues — cible B2B forte'},
      {lbl:'Flux piéton',pct:75,col:'#7F77DD',note:'Artère résidentielle — moins commerçante'},
    ],
    tags:[
      {t:'Revenu le + élevé du portefeuille',c:'tg'},{t:'Multimodalité TC excellente',c:'tg'},
      {t:'Pôle tech & media (Canal+, Microsoft)',c:'tg'},{t:'Cible dirigeants / cadres sup',c:'tg'},
      {t:'Flux piéton modéré',c:'ta'},{t:'Visibilité depuis rue à confirmer',c:'ta'},
      {t:'Marché fitness très concurrentiel',c:'tr'},
    ],
    synthese:'Issy-les-Moulineaux présente le profil de revenu le plus élevé du portefeuille (40 500€ médian) avec une concentration unique de cadres supérieurs et dirigeants des grandes entreprises tech et médias (Canal+, Microsoft, SFR). La trimodalité TC (métro L12 + T2 + RER C) offre une accessibilité maximale. Fort potentiel B2B avec les entreprises du secteur.',
  },
  toulouse:{
    trafic:[
      {lbl:'Zone à définir',kpi:'À étudier',sub:'Données trafic à collecter selon emplacement retenu',col:'#D85A30'},
    ],
    transports:[
      {lbl:'Métro Toulouse',kpi:'Lignes A & B',sub:'Réseau dense en centre-ville · Couverture à confirmer selon adresse',tags:[{t:'En cours d\'étude',c:'ta'}],col:'#378ADD'},
    ],
    demo:[
      {lbl:'Population aire urbaine',kpi:'~800 000',sub:'3e aire urbaine de France · Croissance +1,5%/an',col:'#7F77DD'},
      {lbl:'Revenu médian',kpi:'~27 000 €',sub:'/ an · Marché plus accessible que l\'IDF',col:'#7F77DD'},
      {lbl:'Potentiel marché',kpi:'Fort',sub:'1er marché CP France hors IDF · Jeune et dynamique',col:'#7F77DD'},
    ],
    comparaison:[],
    tags:[
      {t:'3e ville de France',c:'tg'},{t:'Forte croissance démographique',c:'tg'},
      {t:'Marché pilates en développement',c:'tg'},{t:'Emplacement à finaliser',c:'ta'},
      {t:'Données précises à collecter',c:'ta'},
    ],
    synthese:'Toulouse représente un marché stratégique de premier plan — 3e aire urbaine française avec une croissance démographique soutenue (+1,5%/an) et un marché Pilates Reformer encore peu saturé. L\'emplacement précis reste à définir pour affiner l\'analyse trafic et démographique.',
  },
  goldgym:{
    trafic:[
      {lbl:'TMJA estimé RD13 (accès Pariwest)',kpi:'~12 000',sub:'véh/jour · Axe principal zone commerciale Pariwest',col:'#D85A30'},
      {lbl:'Fréquentation CC Pariwest',kpi:'4 M visiteurs/an',sub:'Centre commercial Auchan + galerie · Zone de chalandise 335 000 hab (130 000 ménages)',col:'#D85A30'},
      {lbl:'Nature du trafic',kpi:'Courses + loisirs',sub:'Flux dominants : familles périurbaines · Pic samedi + mercredi · Forte rotation parking',col:'#D85A30'},
    ],
    transports:[
      {lbl:'Transilien N — Paris-Montparnasse',kpi:'Gare La Verrière',sub:'~2 km du studio (5 min voiture, 25 min à pied) · Montparnasse en ~35 min',tags:[{t:'Connexion Paris directe',c:'tb'}],col:'#378ADD'},
      {lbl:'Transilien U — La Défense',kpi:'Gare La Verrière',sub:'Correspondance directe La Défense · Dessert le corridor ouest francilien',tags:[{t:'Accès La Défense sans changement',c:'tb'}],col:'#378ADD'},
      {lbl:'Bus réseau SQY (4 lignes)',kpi:'401 · 415 · 419 · Express',sub:'Réseau Saint-Quentin-en-Yvelines · Correspondances gare + centre-ville',tags:[{t:'Maillage local correct',c:'tb'}],col:'#1D9E75'},
      {lbl:'Accessibilité voiture',kpi:'Parking 3 000+ places',sub:'Accès direct RD13 + RN10 · Parking gratuit illimité · Visibilité signalétique CC',tags:[{t:'Accessibilité voiture excellente',c:'tg'}],col:'#1D9E75'},
    ],
    demo:[
      {lbl:'Population Maurepas (2022)',kpi:'~19 810',sub:'hab sur 8 km² · Ville résidentielle Yvelines',col:'#7F77DD'},
      {lbl:'Densité',kpi:'2 475',sub:'hab/km² — moyenne pour zone périurbaine · Habitat pavillonnaire dominant',col:'#7F77DD'},
      {lbl:'Revenu médian ménage',kpi:'40 340 €',sub:'/ an — supérieur à la moyenne nationale (20 590 €) · Cible fitness premium',col:'#7F77DD'},
      {lbl:'Zone de chalandise élargie',kpi:'335 000 hab',sub:'130 000 ménages · Communes : Maurepas, Coignières, Élancourt, Trappes, Montigny',col:'#7F77DD'},
    ],
    comparaison:[
      {lbl:'Trafic routier',pct:50,col:'#378ADD',note:'Maurepas ~12K véh/j vs Lattes ~28K — inférieur mais flux CC compensent'},
      {lbl:'Fréquentation commerciale',pct:90,col:'#1D9E75',note:'4M visiteurs/an Pariwest — flux captif élevé'},
      {lbl:'Densité pop.',pct:40,col:'#7F77DD',note:'Maurepas : 2 475/km² vs Lattes : ~600/km² — supérieur'},
      {lbl:'Revenu médian',pct:100,col:'#BA7517',note:'Maurepas : 40 340€ vs Lattes : 26K€ — +55%'},
      {lbl:'Accessibilité voiture',pct:100,col:'#D85A30',note:'Parking gratuit 3 000+ places vs Lattes — équivalent'},
      {lbl:'Transports en commun',pct:30,col:'#888780',note:'Gare La Verrière à 2 km — dépendance voiture'},
    ],
    tags:[
      {t:'Centre commercial majeur (4M visiteurs/an)',c:'tg'},{t:'Parking gratuit 3 000+ places',c:'tg'},
      {t:'Revenu médian élevé (40 340€)',c:'tg'},{t:'Zone chalandise 335 000 hab',c:'tg'},
      {t:'Familles CSP+ périurbaines',c:'tg'},{t:'Visibilité galerie commerciale',c:'tb'},
      {t:'Dépendance voiture — peu de TC directs',c:'ta'},{t:'Gare La Verrière à 2 km (non piéton)',c:'ta'},
      {t:'Concurrence fitness zone commerciale',c:'tr'},{t:'Flux courses → conversion fitness à travailler',c:'tb'},
    ],
    synthese:'Maurepas Pariwest offre un profil <b>périurbain haut de gamme</b> : zone de chalandise massive (335 000 hab, 130 000 ménages), revenus supérieurs (+55% vs Lattes), et flux captif de 4M visiteurs/an au CC. Le studio doit capitaliser sur la <b>visibilité en galerie commerciale</b> et le parking gratuit pour convertir le flux courses en abonnements fitness. Point de vigilance : la clientèle est quasi-exclusivement motorisée — les créneaux forts seront le samedi et les sorties de bureau (18h-20h).',
  },
};
// ── Coordonnées des studios (pour la carte Leaflet interactive) ───────────────
const STUDIO_COORDS={
  garenne:{lat:48.9018,lon:2.2466},
  lattes:{lat:43.5618,lon:3.9205},
  levallois:{lat:48.8950,lon:2.2870},
  issy:{lat:48.8244,lon:2.2708},
  toulouse:{lat:43.6047,lon:1.4442},
  goldgym:{lat:48.7645,lon:1.9350},
};

const fmt=function(n){return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n||0);};
const fmtN=function(n){return isNaN(n)?'--':new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(n||0);};
const num=function(v,fb){if(fb===undefined)fb=0;var n=parseFloat(v);return isNaN(n)?fb:n;};
const cleanName=function(n){return n.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]/g,'_').replace(/_+/g,'_');};

// ── BP Adherents 36 mois (source Plan Financier Club Pilates PDF) ─────────────
// A1 M1-M12 : consolidation semaines pre-vente / soft / grand opening
// A2 M13-M24 : projection mensuelle du PDF
// A3 M25-M36 : prolongation vers 400 membres
const BP_ADHERENTS=[
  65,175,199,211,222,233,243,252,261,270,277,285,  // A1
  292,298,304,310,315,321,325,330,334,338,342,345,  // A2
  349,353,357,361,365,370,375,381,386,391,396,400   // A3 -> 400
];

// Churn mensuel BP (source PDF)
const BP_CHURN=[
  0,0,
  -12,-13,-13,-14,-15,-15,-16,-16,-16,-17,
  -17,-18,-18,-18,-19,-19,-19,-20,-20,-20,-20,-21,
  -21,-21,-22,-22,-22,-22,-23,-23,-23,-23,-23,-23
];

// Repartition abonnements (source PDF)
const PACK_REP={pack4:0.47,pack8:0.50,illimite:0.03};
const PRIX={seance:33.33,pack4:110.00,pack8:193.33,illimite:276.67};

// ── CA BP 3 ans (source : Dossier Financement Lattes p.9) ─────────────────────
const CA_A1=448800,CA_A2=610190,CA_A3=761841;

// ── CA BP mensuel exact (source : dossier Lattes p.9 + adhérents BP) ──────────
// Calculés proportionnellement aux adhérents BP — somment exactement aux CA annuels
// A1 : 448 800€  A2 : 610 190€  A3 : 761 841€
const CA_MENSUEL_A1=[10833,29165,33164,35164,36997,38830,40497,41997,43497,44997,46163,47496];
const CA_MENSUEL_A2=[46231,47181,48131,49081,49873,50823,51456,52248,52881,53514,54148,54623];
const CA_MENSUEL_A3=[59296,59975,60655,61335,62014,62864,63713,64733,65582,66432,67281,67961];

// Rampes dérivées (pour compatibilité avec le reste du code)
const RAMP_A1=CA_MENSUEL_A1.map(function(v){return v/448800;});
const RAMP_CRUISE=CA_MENSUEL_A2.map(function(v){return v/610190;});
const RAMP=RAMP_A1;

// ── Charges BP par année — valeurs EXACTES du dossier financement (screenshot) ─
const BP_CHARGES_ANNUELLES={
  1:{
    fournitures:13500,
    loyer:16800,
    charges_loc:2300,
    coachs:120000,
    royalties_pct:0.09,   // 39 204 / 435 600 prestations ≈ 9%
    pub:30600,
    software:5460,
    assurance:2400,
    mutuelle:0,
    nettoyage:3800,
    compta:2500,
    entretien:1800,
    missions:20000,
    telecom:1200,
    social:648,
    creditbail:26370,
    salaries:90000,
    impots_taxes:3815,
    amort:46033,
    charges_fin:8574,
  },
  2:{
    fournitures:13500,
    loyer:38850,
    charges_loc:2300,
    coachs:120000,
    royalties_pct:0.09,
    pub:30600,
    software:5460,
    assurance:2400,
    mutuelle:2400,
    nettoyage:3800,
    compta:2500,
    entretien:1800,
    missions:4000,
    telecom:1200,
    social:1296,
    creditbail:20040,
    salaries:94225,
    impots_taxes:5187,
    amort:46033,
    charges_fin:7488,
  },
  3:{
    fournitures:13500,
    loyer:38850,
    charges_loc:2300,
    coachs:130000,
    royalties_pct:0.09,
    pub:30600,
    software:5460,
    assurance:2400,
    mutuelle:2400,
    nettoyage:3800,
    compta:2500,
    entretien:1800,
    missions:4000,
    telecom:1200,
    social:1296,
    creditbail:20040,
    salaries:105470,
    impots_taxes:6476,
    amort:46032,
    charges_fin:6359,
  },
};

// Résultats annuels de référence (source p.9) — pour validation/affichage
const BP_RESULTATS={
  1:{ca:448800,charges:426430,rex:22370,rnet:11727,caf:57760,treso:22049,marge_rex:0.050,marge_nette:0.026},
  2:{ca:610190,charges:448894,rex:161296,rnet:119606,caf:165639,treso:129928,marge_rex:0.264,marge_nette:0.196},
  3:{ca:761841,charges:484752,rex:277089,rnet:207297,caf:253329,treso:217618,marge_rex:0.364,marge_nette:0.272},
};

// ── Charges & résultats pour sites hors Lattes (loyer 4 800€/mois HT) ─────────
// L'app calcule TOUJOURS sur 12 mois glissants depuis l'ouverture.
// → loyer = 4 800 × 12 = 57 600€/an pour les 3 années (pas de partiel).
// Lattes conserve ses valeurs d'origine (dossier officiel Lattes p.9).
const BP_CHARGES_ANNUELLES_OTHER={
  1:{fournitures:13500,loyer:57600,charges_loc:2300,coachs:120000,royalties_pct:0.09,pub:30600,software:5460,assurance:2400,mutuelle:0,nettoyage:3800,compta:2500,entretien:1800,missions:20000,telecom:1200,social:648,creditbail:26370,salaries:90000,impots_taxes:3815,amort:46033,charges_fin:8574},
  2:{fournitures:13500,loyer:57600,charges_loc:2300,coachs:120000,royalties_pct:0.09,pub:30600,software:5460,assurance:2400,mutuelle:2400,nettoyage:3800,compta:2500,entretien:1800,missions:4000,telecom:1200,social:1296,creditbail:20040,salaries:94225,impots_taxes:5187,amort:46033,charges_fin:7488},
  3:{fournitures:13500,loyer:57600,charges_loc:2300,coachs:130000,royalties_pct:0.09,pub:30600,software:5460,assurance:2400,mutuelle:2400,nettoyage:3800,compta:2500,entretien:1800,missions:4000,telecom:1200,social:1296,creditbail:20040,salaries:105470,impots_taxes:6476,amort:46032,charges_fin:6359},
};
// Résultats recalculés avec loyer 57 600€/an (12 mois × 4 800€) pour toutes les années.
// Y1 : rex négatif car ramp-up CA (448 800€) < charges avec loyer IDF — réaliste.
// IS=0 si perte. CAF = rnet+amort. Tréso = CAF - 35 711 (annuité emprunt fixe).
const BP_RESULTATS_OTHER={
  1:{ca:448800,charges:467230,rex:-18430,rnet:-27004,caf:19029,treso:-16682,marge_rex:-0.041,marge_nette:-0.060},
  2:{ca:610190,charges:467644,rex:142546,rnet:105544,caf:151577,treso:115866,marge_rex:0.234,marge_nette:0.173},
  3:{ca:761841,charges:503502,rex:258339,rnet:193235,caf:239267,treso:203556,marge_rex:0.339,marge_nette:0.254},
};

// Helper : renvoie les bonnes charges/résultats selon le studio
function isLattesStudio(sid){return sid==='lattes';}
function getStudioCharges(sid,annee,lm){
  var tbl=isLattesStudio(sid)?BP_CHARGES_ANNUELLES:BP_CHARGES_ANNUELLES_OTHER;
  var ch=Object.assign({},tbl[annee]||tbl[3]);
  // Loyer mensuel custom (règle i) : remplace la ligne loyer dans les charges
  if(lm!=null&&lm>0)ch.loyer=Math.round(lm*12);
  return ch;
}
function getStudioResultats(sid){
  return isLattesStudio(sid)?BP_RESULTATS:BP_RESULTATS_OTHER;
}

// ── Helpers CAPEX custom & loyer ─────────────────────────────────────────────
// Renvoie le détail CAPEX pour un studio avec les montants custom si définis
function getCapexDetailForStudio(sid){
  var s=S.studios[sid];
  var ov=s&&s.capexDetail||{};
  return BUDGET_CAPEX_DETAIL.map(function(line,i){
    var key='l'+i;
    var montant=ov[key]!==undefined?ov[key]:line.montant;
    return Object.assign({},line,{montant:montant});
  });
}
// Calcule les totaux capex/leasing depuis un détail
function computeCapexTotals(detail){
  var capex=0,leasing=0;
  detail.forEach(function(line){
    if(line.leasing){leasing+=line.montant;}
    else{capex+=line.montant;} // inclut la remise (négatif)
  });
  return{capex:capex,leasing:leasing};
}
// Renvoie les opts BP d'un studio (loyer + capex custom)
function getStudioBPOpts(sid){
  var s=S.studios[sid];
  if(!s)return{};
  var opts={};
  if(s.loyer_mensuel>0)opts.lm=s.loyer_mensuel;
  if(s.capexDetail&&Object.keys(s.capexDetail).length>0){
    var det=getCapexDetailForStudio(sid);
    var tots=computeCapexTotals(det);
    opts.capex=tots.capex;
    opts.leasing=tots.leasing;
    opts.emprunt=Math.round(tots.capex*0.70); // 70% du CAPEX custom → emprunt bancaire
  }
  if(s.tauxInteret!=null&&s.tauxInteret>=0.01)opts.tauxInteret=s.tauxInteret;
  return opts;
}

const DEPENSE_CATS=[
  "Droit d'entrée franchise",
  'Réservation de zone et assistance pré contractuelle',
  'Formation initiale (Franchisé, Manager, 2 Sales)',
  'Coaching Pré ventes (Road to 200)',
  'Frais liés au bail (Dépôt Garantie + agence)',
  'Construction et Architecte',
  'Enseigne et décoration intérieure',
  'Pack Équipement Pilates (leasing)',
  'Pack de démarrage',
  'Pack Marketing Lancement',
  'Trésorerie',
  'Autre',
];
const DEPENSE_FINS=['Emprunt bancaire','Crédit-bail (leasing)','Fonds propres'];
const DEPENSE_CONTRIBUTORS=[
  'SAS Isséo','SAS P&W Studios','Moovi-moov','Pilatine','Holding Sabourin',
  'Paul Bécaud','Pascal Bécaud','Tom Bécaud','Paul Sabourin','Caroline Coquel','Clément Coquel',
];

// ── Structure capitalistique : quote-part par société porteuse ────────────────
const OWNERSHIP_MAP={
  'P&W Occitanie':[
    {nom:'SAS P&W Studios',pct:50,type:'AO',desc:'Holding Tom Bécaud',color:'#1a3a6b',avatarNom:'Tom Bécaud'},
    {nom:'SAS Isséo',pct:50,type:'AO',desc:'Holding famille Bécaud',color:'#0F6E56',avatarNom:'Pascal Bécaud'},
  ],
  'COBE Society':[
    {nom:'Pilatine',pct:20,type:'AO',desc:'Holding Caroline',color:'#7C3AED',avatarNom:'Caroline Coquel'},
    {nom:'Moovi-moov',pct:40,type:'AO',desc:'Holding Clément',color:'#854F0B',avatarNom:'Clément Coquel'},
    {nom:'Paul Bécaud',pct:20,type:'ADP',desc:'Nom propre',color:'#1a3a6b',avatarNom:'Paul Bécaud'},
    {nom:'SAS Isséo',pct:20,type:'ADP',desc:'Holding famille Bécaud',color:'#0F6E56',avatarNom:'Pascal Bécaud'},
  ],
  'SACOBE Society':[
    {nom:'Paul Sabourin',pct:60,type:'AO',desc:'Nom propre',color:'#B45309',avatarNom:'Paul Sabourin'},
    {nom:'Moovi-moov',pct:20,type:'ADP',desc:'Holding Clément',color:'#854F0B',avatarNom:'Clément Coquel'},
    {nom:'SAS Isséo',pct:20,type:'ADP',desc:'Holding famille Bécaud',color:'#0F6E56',avatarNom:'Pascal Bécaud'},
  ]
};

// ── Budget de référence par poste (source : dossier franchise) ────────────────
const BUDGET_CAPEX_DETAIL=[
  {label:"Droit d'entrée",montant:40000,fin:'Emprunt bancaire'},
  {label:'Réservation de zone et assistance pré contractuelle',montant:10000,fin:'Emprunt bancaire'},
  {label:'Formation initiale (Franchisé, Manager, 2 Sales)',montant:5000,fin:'Emprunt bancaire'},
  {label:'Coaching Pré ventes (Road to 200)',montant:5000,fin:'Emprunt bancaire'},
  {label:'Frais liés au bail (Dépôt Garantie + agence)',montant:25000,fin:'Emprunt bancaire'},
  {label:'Construction et Architecte',montant:200000,fin:'Emprunt bancaire'},
  {label:'Enseigne et décoration intérieure',montant:10000,fin:'Emprunt bancaire'},
  {label:'Pack Équipement Pilates',montant:121600,fin:'Crédit-bail (leasing)',leasing:true},
  {label:'Pack de démarrage',montant:28500,fin:'Emprunt bancaire'},
  {label:'Pack Marketing Lancement',montant:10000,fin:'Fonds propres'},
  {label:'Trésorerie',montant:20000,fin:'Fonds propres'},
  {label:'Négos remise Groupe',montant:-20000,fin:null,remise:true},
];
const DEBLOCAGE={
  attente:{label:'A demander',bg:'#F1EFE8',color:'#5F5E5A'},
  demande:{label:'Demande',bg:'#FAEEDA',color:'#854F0B'},
  debloque:{label:'Debloque',bg:'#E1F5EE',color:'#0F6E56'}
};

const ROLE_FILTER={
  admin:null,tom:null,pascal:null,
  viewer:null,
  coquel:function(s){return s.societe==='COBE Society'||s.societe==='SACOBE Society';},
  sabourin:function(s){return s.societe==='SACOBE Society';},
  caroline:function(s){return s.societe==='COBE Society'||s.societe==='SACOBE Society';},
};

const STATUT_CFG={
  pipeline:{bg:'#F1EFE8',text:'#5F5E5A',label:'Pipeline'},
  preparation:{bg:'#E6F1FB',text:'#185FA5',label:'Preparation'},
  chantier:{bg:'#EAF3DE',text:'#3B6D11',label:'En chantier'},
  ouvert:{bg:'#E1F5EE',text:'#0F6E56',label:'Ouvert'},
  abandonne:{bg:'#FCEBEB',text:'#A32D2D',label:'Abandonne'},
};

const STEPS=[
  {id:'testfit',label:'Test fit local',desc:'Surface 135-180m2, H2m45, 12 postes, facade enseigne'},
  {id:'loi',label:'LOI bail signee',desc:'Lettre intention, franchise loyer'},
  {id:'devis',label:'Devis travaux equipements',desc:'Devis entrepreneur + commande Balanced Body'},
  {id:'bail',label:'Bail commercial',desc:'Signature bail definitif, remise des cles'},
  {id:'financement',label:'Offre de pret',desc:'Accord bancaire + credit-bail machines'},
  {id:'at',label:'Autorisation travaux',desc:'Depot et obtention AT'},
  {id:'franchise',label:'Contrat franchise',desc:'Signature TMCP Fitness France'},
  {id:'admin',label:'Documents administratifs',desc:'KBis, statuts, compte pro, assurances'},
  {id:'chantier',label:'Demarrage chantier',desc:'GO travaux, livraison equipements'},
  {id:'preventes',label:'Pre-ventes J-60',desc:'Campagne membres, objectif 100+'},
  {id:'opening',label:'Soft Grand opening',desc:'Objectif 150+ Soft, 200+ Grand Opening'},
];
function getStudioSteps(sid){var s=S.studios[sid];return s&&s.customSteps&&s.customSteps.length?s.customSteps:STEPS;}
function ensureCustomSteps(sid){var s=S.studios[sid];if(!s)return;if(!s.customSteps||!s.customSteps.length){s.customSteps=STEPS.map(function(st){return{id:st.id,label:st.label,desc:st.desc};});}}

// ── BP_LINES : structure pour l'UI (labels + catégories) ─────────────────────
const BP_LINES=[
  {id:'ca_cours',label:'CA Cours collectifs',cat:'p'},
  {id:'ca_prives',label:'CA Cours prives',cat:'p'},
  {id:'ca_boutique',label:'CA Boutique',cat:'p'},
  {id:'fournitures',label:'Fournitures consommables',cat:'c'},
  {id:'loyer',label:'Loyer bail',cat:'c'},
  {id:'charges_loc',label:'Charges locatives',cat:'c'},
  {id:'coachs',label:'Coachs instructeurs',cat:'c'},
  {id:'royalties',label:'Royalties 9%',cat:'c'},
  {id:'pub',label:'Marketing / Pub',cat:'c'},
  {id:'software',label:'Software',cat:'c'},
  {id:'assurance',label:'Assurances',cat:'c'},
  {id:'mutuelle',label:'Mutuelle',cat:'c'},
  {id:'nettoyage',label:'Nettoyage',cat:'c'},
  {id:'compta',label:'Compta / Juridique',cat:'c'},
  {id:'entretien',label:'Entretien',cat:'c'},
  {id:'missions',label:'Missions / Lancement',cat:'c'},
  {id:'telecom',label:'Telecommunications',cat:'c'},
  {id:'social',label:'Charges sociales var.',cat:'c'},
  {id:'creditbail',label:'Loyers credit-bail',cat:'c'},
  {id:'salaries',label:'Charges de personnel',cat:'c'},
  {id:'impots',label:'Impots et taxes',cat:'c'},
  {id:'amort',label:'Amortissements',cat:'c'},
  {id:'charges_fin',label:'Charges financieres',cat:'c'},
  {id:'is',label:'Impot sur societes',cat:'c'},
];
const PRODUITS=BP_LINES.filter(function(l){return l.cat==='p';});
const CHARGES=BP_LINES.filter(function(l){return l.cat==='c';});
// EBITDA = CA - toutes charges sauf amort, IS, charges fin
const CHARGES_NO_AMORT=BP_LINES.filter(function(l){return l.cat==='c'&&l.id!=='amort'&&l.id!=='is'&&l.id!=='charges_fin';});

// Construit un BP mensuel fidèle au dossier de financement Lattes (p.9)
// Utilise les CA mensuels absolus calculés depuis les adhérents BP
function buildBPFromDossier(annualCA,moisDebut,annee,sid,opts){
  opts=opts||{};
  // Sélectionner la table de CA mensuel de référence selon l'année
  // Si le CA passé diffère du CA de référence (studio custom), on scale proportionnellement
  var caRef=annee===1?CA_A1:annee===2?CA_A2:CA_A3;
  var caMensuelRef=annee===1?CA_MENSUEL_A1:annee===2?CA_MENSUEL_A2:CA_MENSUEL_A3;
  var ratio=annualCA/caRef; // = 1.0 pour les studios standard, autre si CA custom
  var ch=getStudioCharges(sid||'lattes',annee,opts.lm);
  // Régler amort proportionnellement au CAPEX custom (règle ii)
  var CAPEX_REF=333500,LEASING_REF=121600,EMPRUNT_REF=230000,TAUX_REF=0.0373;
  if(opts.capex&&opts.capex>0&&Math.round(opts.capex)!==CAPEX_REF)
    ch.amort=Math.round(ch.amort*opts.capex/CAPEX_REF);
  // Régler creditbail proportionnellement au leasing custom
  if(opts.leasing&&opts.leasing>0&&Math.round(opts.leasing)!==LEASING_REF)
    ch.creditbail=Math.round(ch.creditbail*opts.leasing/LEASING_REF);
  // Charges financières : ajustement emprunt + taux d'intérêt custom
  var empruntEffectif=opts.emprunt||EMPRUNT_REF;
  var tauxEffectif=opts.tauxInteret!=null?opts.tauxInteret:TAUX_REF;
  var _hasCustomFin=(opts.emprunt&&Math.round(opts.emprunt)!==EMPRUNT_REF)||(opts.tauxInteret!=null&&Math.abs(opts.tauxInteret-TAUX_REF)>0.0001);
  if(_hasCustomFin)ch.charges_fin=Math.round(ch.charges_fin*(empruntEffectif/EMPRUNT_REF)*(tauxEffectif/TAUX_REF));
  // Remboursement capital mensuel (amortissement linéaire 7 ans)
  var rembtMensuel=Math.round(empruntEffectif/7/12);

  // Royalties annuelles exactes du dossier (pas de recalcul approximatif)
  var royaltiesAnnuelles=annee===1?39204:annee===2?53303:66628;
  // Ratio royalties mensuel = proportionnel au CA mensuel
  var royaltiesRatio=royaltiesAnnuelles/(annee===1?CA_A1:annee===2?CA_A2:CA_A3);

  // IS annuel calculé sur le résultat exact du dossier
  var totalChargesHorsFinIS=ch.fournitures+ch.loyer+ch.charges_loc+ch.coachs+royaltiesAnnuelles
    +ch.pub+ch.software+ch.assurance+ch.mutuelle+ch.nettoyage+ch.compta+ch.entretien
    +ch.missions+ch.telecom+ch.social+ch.creditbail+ch.salaries+ch.impots_taxes+ch.amort;
  var rexAnnuel=annualCA-totalChargesHorsFinIS;
  var rcaiAnnuel=rexAnnuel-ch.charges_fin;
  var isAnnuel=rcaiAnnuel<=0?0:Math.round(Math.min(rcaiAnnuel,42500)*0.15+Math.max(0,rcaiAnnuel-42500)*0.25);

  return Array.from({length:12},function(_,i){
    // CA mensuel = valeur absolue de référence × ratio (= valeur exacte si ratio=1)
    var ca=Math.round(caMensuelRef[i]*ratio);
    var caPresta=Math.round(ca*0.969);
    var row={mi:(moisDebut+i)%12,_ca:ca,annee:annee};
    // Produits — répartition exacte du dossier
    // A1: cours 429000, prives 6600, boutique 13200 sur CA 448800
    row.ca_cours=Math.round(ca*(annee===1?429000/448800:annee===2?583050/610190:728813/761841));
    row.ca_prives=Math.round(ca*(annee===1?6600/448800:annee===2?9200/610190:11500/761841));
    row.ca_boutique=Math.round(ca*(annee===1?13200/448800:annee===2?17940/610190:21528/761841));
    // Charges fixes mensualisées
    row.fournitures=Math.round(ch.fournitures/12);
    row.loyer=Math.round(ch.loyer/12);
    row.charges_loc=Math.round(ch.charges_loc/12);
    row.coachs=Math.round(ch.coachs/12);
    row.royalties=Math.round(ca*royaltiesRatio); // proportionnel au CA mensuel
    row.pub=Math.round(ch.pub/12);
    row.software=Math.round(ch.software/12);
    row.assurance=Math.round(ch.assurance/12);
    row.mutuelle=Math.round(ch.mutuelle/12);
    row.nettoyage=Math.round(ch.nettoyage/12);
    row.compta=Math.round(ch.compta/12);
    row.entretien=Math.round(ch.entretien/12);
    row.missions=Math.round(ch.missions/12);
    row.telecom=Math.round(ch.telecom/12);
    row.social=Math.round(ch.social/12);
    row.creditbail=Math.round(ch.creditbail/12);
    row.salaries=Math.round(ch.salaries/12);
    row.impots=Math.round(ch.impots_taxes/12);
    row.amort=Math.round(ch.amort/12);
    row.charges_fin=Math.round(ch.charges_fin/12);
    row.is=Math.round(isAnnuel/12);

    // Totaux mensuels
    row._charges=CHARGES.reduce(function(s,l){return s+(row[l.id]||0);},0);
    // REX mensuel = CA - toutes charges sauf charges_fin et IS
    var chargesAvantFinIS=CHARGES.filter(function(l){return l.id!=='charges_fin'&&l.id!=='is';}).reduce(function(s,l){return s+(row[l.id]||0);},0);
    row._rex=ca-chargesAvantFinIS;
    // Résultat net mensuel = CA - toutes charges
    row._result=ca-row._charges;
    // EBITDA mensuel = REX + Amortissements (charges financières exclues)
    row._ebitda=row._rex+row.amort;
    // CAF mensuelle = RN + Amort
    row._caf=row._result+row.amort;
    // Remboursement capital mensuel (cash sortant hors P&L)
    row._rembt=rembtMensuel;
    // Cash net disponible = CAF − Remboursement capital
    row._cashnet=row._caf-rembtMensuel;
    return row;
  });
}

function buildBP(annualCA,moisDebut,ramp,sid,opts){
  var annee=annualCA<=(CA_A1*1.1)?1:annualCA<=(CA_A2*1.1)?2:3;
  return buildBPFromDossier(annualCA,moisDebut,annee,sid,opts);
}

function build3YearBP(forecast,sid,opts){
  var md=forecast.moisDebut||0;
  // On utilise TOUJOURS les CA du dossier de financement — les valeurs Supabase sont ignorées
  return {
    a1:buildBPFromDossier(CA_A1,md,1,sid,opts),
    a2:buildBPFromDossier(CA_A2,md,2,sid,opts),
    a3:buildBPFromDossier(CA_A3,md,3,sid,opts),
  };
}

function inferStatut(steps,sid){
  var ST=sid?getStudioSteps(sid):STEPS;
  var done=ST.filter(function(s){return steps[s.id];}).length;
  if(done===ST.length)return 'ouvert';
  if(done>=Math.ceil(ST.length*0.45))return 'chantier';
  if(done>=1)return 'preparation';
  return 'pipeline';
}

var PROSPECT_TABS=[
  {id:'pw',label:'P&W Studio',color:'#1a3a6b',icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'},
  {id:'cobe',label:'COBE Society',color:'#0F6E56',icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'},
  {id:'sacobe',label:'SACOBE Society',color:'#854F0B',icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>'}
];

const INIT={
  lattes:{name:'Montpellier Lattes',addr:'130 av. de Montpellier, 34970 Lattes',societe:'P&W Occitanie',ouverture:'Septembre 2026',statut:'preparation',capex:333500,emprunt:230000,leasing:121600,alertes:['Deadline franchise 30/06/2026'],cohorte:1,steps:{testfit:true,loi:true,devis:false,bail:true,financement:false,at:false,franchise:false,admin:false,chantier:false,preventes:false,opening:false},forecast:{annualCA:CA_A1,annualCA2:CA_A2,annualCA3:CA_A3,moisDebut:8,annee:2026,actuel:{},actuel2:{},actuel3:{}}},
  garenne:{name:'La Garenne-Colombes',addr:'102B Bd de la Republique, 92250 La Garenne-Colombes',societe:'COBE Society',ouverture:'Fin sept. 2026',statut:'preparation',capex:333500,emprunt:230000,leasing:121600,alertes:['Pacte associes COBE a finaliser'],cohorte:1,steps:{testfit:true,loi:true,devis:false,bail:true,financement:false,at:false,franchise:false,admin:false,chantier:false,preventes:false,opening:false},forecast:{annualCA:CA_A1,annualCA2:CA_A2,annualCA3:CA_A3,moisDebut:8,annee:2026,actuel:{},actuel2:{},actuel3:{}}},
  levallois:{name:'Levallois-Perret',addr:'80 Rue Edouard Vaillant, 92300 Levallois-Perret',societe:'COBE Society',ouverture:'Fin sept. 2026',statut:'preparation',capex:333500,emprunt:230000,leasing:121600,alertes:['Bail commercial a finaliser'],cohorte:1,steps:{testfit:true,loi:true,devis:false,bail:false,financement:false,at:false,franchise:false,admin:false,chantier:false,preventes:false,opening:false},forecast:{annualCA:CA_A1,annualCA2:CA_A2,annualCA3:CA_A3,moisDebut:8,annee:2026,actuel:{},actuel2:{},actuel3:{}}},
  issy:{name:'Issy-les-Moulineaux',addr:'39 avenue Victor Cresson, 92130 Issy-les-Moulineaux',societe:'SACOBE Society',ouverture:'Fin sept. 2026',statut:'preparation',capex:333500,emprunt:230000,leasing:121600,alertes:['Credit-bail equipements a mettre en place'],cohorte:1,steps:{testfit:true,loi:true,devis:true,bail:true,financement:false,at:false,franchise:true,admin:false,chantier:false,preventes:false,opening:false},forecast:{annualCA:CA_A1,annualCA2:CA_A2,annualCA3:CA_A3,moisDebut:8,annee:2026,actuel:{},actuel2:{},actuel3:{}}},
  toulouse:{name:'Toulouse Montpellier Nord',addr:'Montpellier, France',societe:'P&W Occitanie',ouverture:'2027',statut:'pipeline',capex:333500,emprunt:230000,leasing:121600,alertes:['Deadline franchise 30/06/2027'],cohorte:2,steps:{testfit:false,loi:false,devis:false,bail:false,financement:false,at:false,franchise:false,admin:false,chantier:false,preventes:false,opening:false},forecast:{annualCA:CA_A1,annualCA2:CA_A2,annualCA3:CA_A3,moisDebut:0,annee:2027,actuel:{},actuel2:{},actuel3:{}}},
  goldgym:{name:'Maurepas Pariwest (Gold Gym)',addr:'Centre Commercial Pariwest, Rdpt Laurent Schwartz, 78310 Maurepas',societe:'COBE Society',ouverture:'2027',statut:'pipeline',capex:333500,emprunt:230000,leasing:121600,alertes:['Identification local en cours'],cohorte:1,steps:{testfit:false,loi:false,devis:false,bail:false,financement:false,at:false,franchise:false,admin:false,chantier:false,preventes:false,opening:false},forecast:{annualCA:CA_A1,annualCA2:CA_A2,annualCA3:CA_A3,moisDebut:0,annee:2027,actuel:{},actuel2:{},actuel3:{}}},
};

