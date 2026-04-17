// ═══════════════════════════════════════════════════════════════════════════
// Tests golden — Calculs BP (Business Plan)
// Ces tests protègent les fonctions financières critiques contre les régressions.
// Valeurs de référence : dossier officiel Club Pilates (448 800 A1 / 610 190 A2 / 761 841 A3).
// ═══════════════════════════════════════════════════════════════════════════
import { describe, it, expect, beforeAll } from 'vitest';
import { loadGlobalScript, setupMinimalState } from './_setup.js';

beforeAll(() => {
  // Charger utils.js en premier (définit num(), fmt(), helpers partagés)
  loadGlobalScript('js/utils.js');
  // Puis constants.js (CA_A1/A2/A3, BP_LINES, buildBPFromDossier, build3YearBP, STEPS...)
  loadGlobalScript('js/constants.js');
  // Puis state.js (définit S)
  loadGlobalScript('js/state.js');
  setupMinimalState();
  // Enfin simulator.js (computeBPCA, computeSimARPU, computeSimCA, SIM_ARPU_TOTAL_BP...)
  loadGlobalScript('js/simulator.js');
});

describe('Constantes BP — dossier officiel', () => {
  it('CA_A1 = 448 800 €', () => {
    expect(globalThis.CA_A1).toBe(448800);
  });
  it('CA_A2 = 610 190 €', () => {
    expect(globalThis.CA_A2).toBe(610190);
  });
  it('CA_A3 = 761 841 €', () => {
    expect(globalThis.CA_A3).toBe(761841);
  });
});

describe('computeBPCA — CA mensuel à partir des membres', () => {
  it('Année 1 : 2693 membres (somme mois) → ~CA_A1', () => {
    // SIM_ARPU_TOTAL_BP[1] ≈ 166.65 → 2693 * 166.65 ≈ 448 789
    // Tolérance 1% : arrondi de l'ARPU à 2 décimales
    const ca = globalThis.computeBPCA(2693, 1);
    expect(ca).toBeGreaterThan(448000);
    expect(ca).toBeLessThan(449500);
  });
  it('Année 2 : 3854 membres → ~CA_A2', () => {
    const ca = globalThis.computeBPCA(3854, 2);
    expect(ca).toBeGreaterThan(609000);
    expect(ca).toBeLessThan(611000);
  });
  it('Année 3 : 4484 membres → ~CA_A3', () => {
    const ca = globalThis.computeBPCA(4484, 3);
    expect(ca).toBeGreaterThan(761000);
    expect(ca).toBeLessThan(762500);
  });
  it('fallback sur année 1 si année invalide', () => {
    const caFallback = globalThis.computeBPCA(1000, 99);
    const caA1 = globalThis.computeBPCA(1000, 1);
    expect(caFallback).toBe(caA1);
  });
  it('0 membre → 0 CA', () => {
    expect(globalThis.computeBPCA(0, 1)).toBe(0);
  });
});

describe('computeSimARPU — ARPU simulé selon répartition + prix', () => {
  it('BP de référence (47/50/3 avec prix 110/193.33/276.67) → ~156.67', () => {
    const arpu = globalThis.computeSimARPU({
      p4: 47, p8: 50, pi: 3,
      prix4: 110, prix8: 193.33, prixi: 276.67
    });
    // 0.47*110 + 0.50*193.33 + 0.03*276.67 ≈ 156.665
    expect(arpu).toBeCloseTo(156.665, 2);
  });
  it('tout en pack 4 à 110€ → ARPU = 110', () => {
    const arpu = globalThis.computeSimARPU({
      p4: 100, p8: 0, pi: 0,
      prix4: 110, prix8: 0, prixi: 0
    });
    expect(arpu).toBeCloseTo(110, 2);
  });
  it('valeurs par défaut si champ manquant', () => {
    const arpu = globalThis.computeSimARPU({});
    // Défauts : p4=47, p8=50, pi=3, prix4=110, prix8=193.33, prixi=276.67
    expect(arpu).toBeCloseTo(156.665, 2);
  });
});

describe('computeSimCA — CA simulé mensuel', () => {
  it('BP par défaut + prix BP → CA_sim ≈ CA_BP (invariant clé)', () => {
    const BP_CFG = { p4: 47, p8: 50, pi: 3, prix4: 110, prix8: 193.33, prixi: 276.67 };
    // 2693 membres répartis sur l'année à l'ARPU BP devraient donner ~CA_A1
    // On teste mois par mois via le facteur boutique intégré à computeSimCA.
    const simA1 = globalThis.computeSimCA(2693, BP_CFG, 1, 'notGoldGym');
    const bpA1 = globalThis.computeBPCA(2693, 1);
    // Tolérance 1% (arrondis successifs)
    const diffPct = Math.abs(simA1 - bpA1) / bpA1 * 100;
    expect(diffPct).toBeLessThan(1);
  });
  it('0 membre → 0 CA', () => {
    const BP_CFG = { p4: 47, p8: 50, pi: 3, prix4: 110, prix8: 193.33, prixi: 276.67 };
    expect(globalThis.computeSimCA(0, BP_CFG, 1, 'notGoldGym')).toBe(0);
  });
});

describe('buildBPFromDossier — BP mensuel 12 mois', () => {
  it('retourne 12 lignes pour année 1', () => {
    const bp = globalThis.buildBPFromDossier(globalThis.CA_A1, 0, 1, 'test', {});
    expect(bp.length).toBe(12);
  });
  it('somme des CA mensuels ≈ CA annuel (tolérance arrondis)', () => {
    const bp = globalThis.buildBPFromDossier(globalThis.CA_A1, 0, 1, 'test', {});
    const sumCA = bp.reduce((s, r) => s + (r._ca || 0), 0);
    // Tolérance large car les mois sont arrondis individuellement
    expect(sumCA).toBeGreaterThan(globalThis.CA_A1 * 0.98);
    expect(sumCA).toBeLessThan(globalThis.CA_A1 * 1.02);
  });
  it('EBITDA année 3 positif (cruising)', () => {
    const bp = globalThis.buildBPFromDossier(globalThis.CA_A3, 0, 3, 'test', {});
    const totEbitda = bp.reduce((s, r) => s + (r._ebitda || 0), 0);
    expect(totEbitda).toBeGreaterThan(0);
  });
});

describe('build3YearBP — BP consolidé 3 ans', () => {
  it('retourne {a1, a2, a3} avec 12 mois chacun', () => {
    const res = globalThis.build3YearBP(
      { moisDebut: 0, annee: 2026, annualCA: globalThis.CA_A1 },
      'test',
      {}
    );
    expect(res.a1.length).toBe(12);
    expect(res.a2.length).toBe(12);
    expect(res.a3.length).toBe(12);
  });
  it('CA A3 > CA A2 > CA A1 (croissance attendue)', () => {
    const res = globalThis.build3YearBP(
      { moisDebut: 0, annee: 2026, annualCA: globalThis.CA_A1 },
      'test',
      {}
    );
    const ca1 = res.a1.reduce((s, r) => s + r._ca, 0);
    const ca2 = res.a2.reduce((s, r) => s + r._ca, 0);
    const ca3 = res.a3.reduce((s, r) => s + r._ca, 0);
    expect(ca2).toBeGreaterThan(ca1);
    expect(ca3).toBeGreaterThan(ca2);
  });
});
