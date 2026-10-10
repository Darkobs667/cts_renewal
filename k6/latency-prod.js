/**
 * ─────────────────────────────────────────────────────────────
 *  TEST DE LATENCE PRODUCTION — 3 comptes réels
 *  Mesure les vraies latences Render + Aiven PostgreSQL
 *
 *  ⚠️  NE JAMAIS mettre les credentials en dur ici.
 *      Utiliser les variables d'environnement -e.
 *
 *  Utilisation :
 *    k6 run k6/latency-prod.js ^
 *      -e BASE_URL=https://cts-backend-1.onrender.com/api ^
 *      -e U1_EMAIL=compte1@uadb.edu.sn ^
 *      -e U1_PWD=motdepasse1 ^
 *      -e U2_EMAIL=compte2@uadb.edu.sn ^
 *      -e U2_PWD=motdepasse2 ^
 *      -e U3_EMAIL=compte3@uadb.edu.sn ^
 *      -e U3_PWD=motdepasse3
 * ─────────────────────────────────────────────────────────────
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { BASE_URL } from './config.js';

// ── Métriques par endpoint ────────────────────────────────────
const loginLatency     = new Trend('latency_login',      true);
const positionsLatency = new Trend('latency_positions',  true);
const candidatesLatency= new Trend('latency_candidates', true);
const votesMyLatency   = new Trend('latency_votes_my',   true);
const resultsLatency   = new Trend('latency_results',    true);
const errorRate        = new Rate('error_rate');

export const options = {
  // 3 VUs = 1 par compte, 5 minutes de charge douce
  scenarios: {
    trois_electeurs: {
      executor:    'constant-vus',
      vus:         3,
      duration:    '5m',
    },
  },
  thresholds: {
    // Seuils réalistes pour Render free + Aiven (latence EU→Africa)
    latency_login:      ['p(95)<3000', 'avg<1500'],
    latency_positions:  ['p(95)<2000', 'avg<1000'],
    latency_candidates: ['p(95)<2000', 'avg<1000'],
    latency_votes_my:   ['p(95)<2000', 'avg<1000'],
    latency_results:    ['p(95)<2000', 'avg<1000'],
    http_req_failed:    ['rate<0.05'],
    error_rate:         ['rate<0.05'],
  },
};

// Comptes chargés depuis les variables d'environnement
const ACCOUNTS = [
  { email: __ENV.U1_EMAIL, password: __ENV.U1_PWD },
  { email: __ENV.U2_EMAIL, password: __ENV.U2_PWD },
  { email: __ENV.U3_EMAIL, password: __ENV.U3_PWD },
];

const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };

export default function () {
  // Chaque VU utilise son propre compte (VU 1→compte 1, VU 2→compte 2, etc.)
  const account = ACCOUNTS[(__VU - 1) % ACCOUNTS.length];

  if (!account?.email || !account?.password) {
    console.error(`VU ${__VU}: credentials manquants — vérifiez U${__VU}_EMAIL et U${__VU}_PWD`);
    sleep(5);
    return;
  }

  // ── 1. Login ──────────────────────────────────────────────
  let token = null;
  group('01_login', () => {
    const start = Date.now();
    const res   = http.post(
      `${BASE_URL}/login`,
      JSON.stringify({ email: account.email, password: account.password }),
      { headers }
    );
    loginLatency.add(Date.now() - start);

    const ok = check(res, {
      'login: 200':        (r) => r.status === 200,
      'login: token reçu': (r) => Boolean(r.json('data.access_token')),
    });
    errorRate.add(!ok ? 1 : 0);

    if (!ok) {
      console.log(`Login échoué (${res.status}) pour ${account.email}: ${res.body?.substring(0, 100)}`);
      sleep(2);
      return;
    }

    token = res.json('data.access_token');
    console.log(`VU ${__VU} connecté: ${account.email} → token OK`);
  });

  if (!token) { sleep(3); return; }

  const authH = { ...headers, Authorization: `Bearer ${token}` };

  sleep(0.5);

  // ── 2. Positions ──────────────────────────────────────────
  group('02_positions', () => {
    const start = Date.now();
    const res   = http.get(`${BASE_URL}/positions`, { headers: authH });
    positionsLatency.add(Date.now() - start);

    check(res, { 'positions: 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200 ? 1 : 0);
    sleep(0.3);
  });

  // ── 3. Candidats ──────────────────────────────────────────
  group('03_candidates', () => {
    const start = Date.now();
    const res   = http.get(`${BASE_URL}/candidates`, { headers: authH });
    candidatesLatency.add(Date.now() - start);

    check(res, { 'candidates: 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200 ? 1 : 0);
    sleep(0.3);
  });

  // ── 4. Mes votes ──────────────────────────────────────────
  group('04_votes_my', () => {
    const start = Date.now();
    const res   = http.get(`${BASE_URL}/votes/my`, { headers: authH });
    votesMyLatency.add(Date.now() - start);

    check(res, { 'votes/my: 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200 ? 1 : 0);
    sleep(0.3);
  });

  // ── 5. Résultats ──────────────────────────────────────────
  group('05_results', () => {
    const start = Date.now();
    const res   = http.get(`${BASE_URL}/votes/results`, { headers: authH });
    resultsLatency.add(Date.now() - start);

    check(res, { 'results: 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200 ? 1 : 0);
    sleep(0.3);
  });

  // ── 6. Logout ─────────────────────────────────────────────
  group('06_logout', () => {
    http.post(`${BASE_URL}/logout`, null, { headers: authH });
  });

  // Pause humaine entre itérations
  sleep(Math.random() * 3 + 2);
}

export function handleSummary(data) {
  const m   = data.metrics;
  const p50 = (k) => m[k] ? Math.round(m[k].values['p(50)']) + 'ms' : 'N/A';
  const p95 = (k) => m[k] ? Math.round(m[k].values['p(95)']) + 'ms' : 'N/A';
  const avg = (k) => m[k] ? Math.round(m[k].values.avg)      + 'ms' : 'N/A';
  const min = (k) => m[k] ? Math.round(m[k].values.min)      + 'ms' : 'N/A';
  const max = (k) => m[k] ? Math.round(m[k].values.max)      + 'ms' : 'N/A';
  const rt  = (k) => m[k] ? (m[k].values.rate * 100).toFixed(1) + '%' : 'N/A';

  const passed = !Object.values(data.metrics)
    .some((m) => Object.values(m.thresholds || {}).some((t) => !t.ok));

  return {
    'k6/reports/latency-prod-summary.json': JSON.stringify(data, null, 2),
    stdout: `
╔════════════════════════════════════════════════════════════════╗
║    CTS Vote — Latences PRODUCTION (Render + Aiven PostgreSQL)  ║
╚════════════════════════════════════════════════════════════════╝

🌐 ${BASE_URL}
👥 3 électeurs réels · 5 minutes · 3 VUs simultanés

┌─────────────────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ Endpoint            │   min    │   avg    │   p(50)  │   p(95)  │   max    │
├─────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ Login               │ ${min('latency_login').padEnd(8)} │ ${avg('latency_login').padEnd(8)} │ ${p50('latency_login').padEnd(8)} │ ${p95('latency_login').padEnd(8)} │ ${max('latency_login').padEnd(8)} │
│ GET /positions      │ ${min('latency_positions').padEnd(8)} │ ${avg('latency_positions').padEnd(8)} │ ${p50('latency_positions').padEnd(8)} │ ${p95('latency_positions').padEnd(8)} │ ${max('latency_positions').padEnd(8)} │
│ GET /candidates     │ ${min('latency_candidates').padEnd(8)} │ ${avg('latency_candidates').padEnd(8)} │ ${p50('latency_candidates').padEnd(8)} │ ${p95('latency_candidates').padEnd(8)} │ ${max('latency_candidates').padEnd(8)} │
│ GET /votes/my       │ ${min('latency_votes_my').padEnd(8)} │ ${avg('latency_votes_my').padEnd(8)} │ ${p50('latency_votes_my').padEnd(8)} │ ${p95('latency_votes_my').padEnd(8)} │ ${max('latency_votes_my').padEnd(8)} │
│ GET /votes/results  │ ${min('latency_results').padEnd(8)} │ ${avg('latency_results').padEnd(8)} │ ${p50('latency_results').padEnd(8)} │ ${p95('latency_results').padEnd(8)} │ ${max('latency_results').padEnd(8)} │
└─────────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘

📊 Requêtes totales     : ${m.http_reqs?.values.count ?? 'N/A'}
❌ Taux d'erreurs        : ${rt('error_rate')}
⚡ Débit (req/s)         : ${(m.http_reqs?.values.rate ?? 0).toFixed(2)}

${passed
  ? '✅ TOUS LES SEUILS PASSÉS — Infrastructure validée'
  : '⚠️  SEUILS DÉPASSÉS — Voir tableau ci-dessus'}

Interprétation :
  < 500ms  → Excellent (cache actif)
  500-1s   → Bon (DB Aiven + Render Europe)
  1-2s     → Acceptable (latence réseau Sénégal → Europe)
  > 3s     → À optimiser
`,
  };
}
