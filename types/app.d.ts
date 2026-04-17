// ═══════════════════════════════════════════════════════════════════════════
// Types globaux — ISSEO × Club Pilates
// Capture les contrats des entités métier principales pour que TypeScript
// puisse vérifier les calculs BP et les fonctions touchant à S.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Répartition + prix des 3 packs Club Pilates (base de calcul ARPU).
 */
interface SimConfig {
  p4?: number;      // % clients pack 4 (défaut 47)
  p8?: number;      // % clients pack 8 (défaut 50)
  pi?: number;      // % clients pack illimité (défaut 3)
  prix4?: number;   // prix pack 4 € HT/mois (défaut 110)
  prix8?: number;   // prix pack 8 € HT/mois (défaut 193.33)
  prixi?: number;   // prix illimité € HT/mois (défaut 276.67)
}

/**
 * Mois d'une ligne BP (charges + calculs dérivés).
 * Les champs _xxx sont calculés par buildBPFromDossier.
 */
interface BPRow {
  ca_cours?: number;
  ca_prives?: number;
  ca_boutique?: number;
  fournitures?: number;
  loyer?: number;
  charges_loc?: number;
  coachs?: number;
  amort?: number;
  is?: number;
  charges_fin?: number;
  // Champs calculés
  _ca?: number;
  _charges?: number;
  _result?: number;
  _ebitda?: number;
  _rex?: number;
  _caf?: number;
  _cashnet?: number;
  [key: string]: number | undefined;
}

/**
 * Prévisionnel sur 3 ans par studio (stocké dans S.studios[id].forecast).
 */
interface StudioForecast {
  annualCA?: number;
  annualCA2?: number;
  annualCA3?: number;
  moisDebut?: number;       // 0-11, mois d'ouverture dans l'année
  annee?: number;           // année 1 (ex 2026)
  actuel?: Record<string, Record<string, number>>;
  actuel2?: Record<string, Record<string, number>>;
  actuel3?: Record<string, Record<string, number>>;
  [key: string]: unknown;
}

/**
 * Étape du workflow (11 étapes par défaut, surchargables).
 */
interface WorkflowStep {
  id: string;
  label: string;
  desc?: string;
}

/**
 * Studio — entité métier principale.
 */
interface Studio {
  name: string;
  addr?: string;
  societe?: string;
  ouverture?: string;
  statut?: 'pipeline' | 'preparation' | 'chantier' | 'ouvert' | 'abandonne';
  capex?: number;
  emprunt?: number;
  leasing?: number;
  cohorte?: number;
  loyer_mensuel?: number;
  steps?: Record<string, boolean>;
  customSteps?: WorkflowStep[];
  forecast?: StudioForecast;
  [key: string]: unknown;
}

/**
 * Profil utilisateur (ligne table Supabase `profiles`).
 */
interface Profile {
  nom?: string;
  email?: string;
  role?: 'admin' | 'superadmin' | 'viewer' | string;
  [key: string]: unknown;
}

/**
 * État global de l'app — exposé via window.S. Déclaré ici pour typage partiel.
 * Pas exhaustif : s'enrichit au fil de la migration TS.
 */
interface AppState {
  studios: Record<string, Studio>;
  simConfig: Record<string, SimConfig>;
  adherents: Record<string, Record<string, number>>;
  scenarios: Record<string, Array<{ id: string; auteur?: string; date?: string; config?: SimConfig; ts?: string }>>;
  activeScenarioId: Record<string, string>;
  user?: { id: string; email?: string };
  profile?: Profile;
  darkMode?: boolean;
  page?: string;
  view?: string;
  selectedId?: string | null;
  detailTab?: string;
  forecastYear?: number;
  adherentYear?: number;
  [key: string]: unknown;
}

// Déclarations de variables globales (chargées via <script>) pour que TS les trouve
declare var S: AppState;
declare var sb: unknown;
declare var STEPS: WorkflowStep[];
declare var CA_A1: number;
declare var CA_A2: number;
declare var CA_A3: number;
declare var BP_CHURN: number[];
declare var MOIS: string[];
declare var CHARGES: Array<{ id: string; label: string }>;
declare var CHARGES_NO_AMORT: Array<{ id: string; label: string }>;
declare var BP_LINES: Array<{ id: string; label: string; cat: string }>;
declare function render(): void;
declare function toast(msg: string): void;
declare function saveNavState(): void;
declare function restoreNavState(): void;
declare function _checkDirtyBeforeNav(): boolean;
declare function hasDirty(): boolean;
declare function discardAllDirty(): void;
declare function _getStudioIds(): string[];
declare function getStudioSteps(sid: string): WorkflowStep[];
declare function getBPAdherents(sid: string): number[];
declare function getStudioResultats(sid: string): Record<number, unknown>;
declare function getStudioBPOpts(sid: string): Record<string, unknown>;
declare function isGoldGymStudio(sid: string): boolean;
declare function isLattesStudio(sid: string): boolean;
declare function isViewer(): boolean;
declare function isSuperAdmin(): boolean;
declare function num(v: unknown, fallback?: number): number;
declare function fmt(v: unknown): string;
declare function fmtN(v: unknown): string;
declare function openDetail(id: string): void;
declare function setPage(page: string): void;
declare function setDetailTab(tab: string): void;
declare function computeBPCA(membres: number, ay: number): number;
declare function computeSimARPU(cfg: SimConfig): number;
declare function computeSimCA(membres: number, cfg: SimConfig, ay: number, sid?: string): number;
declare function buildBPFromDossier(annualCA: number, moisDebut: number, annee: number, sid: string, opts?: Record<string, unknown>): BPRow[];
declare function buildBP(annualCA: number, moisDebut: number, unused: unknown, sid: string, opts?: Record<string, unknown>): BPRow[];
declare function build3YearBP(forecast: StudioForecast, sid: string, opts?: Record<string, unknown>): { a1: BPRow[]; a2: BPRow[]; a3: BPRow[] };
declare var CA_GG_A1: number;
declare var CA_GG_A2: number;
declare var CA_GG_A3: number;
declare var INIT: Record<string, unknown>;
declare var SIM_ARPU_TOTAL_BP: Record<number, number>;
declare var SIM_PRIX_REF: { prix4: number; prix8: number; prixi: number };
declare var SIM_BOUTIQUE_FACTOR: Record<number, number>;

declare global {
  interface Window {
    S: AppState;
    sb: unknown;
    // API publique utilisée par les composants
    openDetail?: (id: string) => void;
    setPage?: (page: string) => void;
    setDetailTab?: (tab: string) => void;
    render?: () => void;
    toast?: (msg: string) => void;
    // Observabilité
    ISSEO_SENTRY_DSN?: string;
    ISSEO_POSTHOG_KEY?: string;
    ISSEO_POSTHOG_HOST?: string;
    ISSEO_ENV?: 'dev' | 'prod';
    ISSEO_RELEASE?: string;
    isseoCaptureError?: (err: unknown, ctx?: Record<string, unknown>) => void;
    isseoPosthogIdentify?: () => void;
    Sentry?: {
      init: (opts: Record<string, unknown>) => void;
      captureException: (err: unknown, opts?: Record<string, unknown>) => void;
      setUser: (user: Record<string, unknown>) => void;
    };
    posthog?: {
      init: (key: string, opts?: Record<string, unknown>) => void;
      capture: (event: string, props?: Record<string, unknown>) => void;
      identify: (id: string, props?: Record<string, unknown>) => void;
      opt_out_capturing: () => void;
    };
    preact?: { h: Function; render: Function; Component: Function; Fragment: unknown };
    htm?: (tpl: TemplateStringsArray, ...args: unknown[]) => unknown;
    htmModule?: unknown;
    // Fonctions BP globales
    computeBPCA?: (membres: number, ay: number) => number;
    computeSimARPU?: (cfg: SimConfig) => number;
    computeSimCA?: (membres: number, cfg: SimConfig, ay: number, sid?: string) => number;
    buildBPFromDossier?: (annualCA: number, moisDebut: number, annee: number, sid: string, opts?: Record<string, unknown>) => BPRow[];
    build3YearBP?: (forecast: StudioForecast, sid: string, opts?: Record<string, unknown>) => { a1: BPRow[]; a2: BPRow[]; a3: BPRow[] };
    getStudioSteps?: (sid: string) => WorkflowStep[];
    getBPAdherents?: (sid: string) => number[];
    _getStudioIds?: () => string[];
    STEPS?: WorkflowStep[];
    CA_A1?: number;
    CA_A2?: number;
    CA_A3?: number;
    // Preact widgets
    mountNextStepsWidget?: () => void;
  }
}

export {};
