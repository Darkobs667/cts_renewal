/**
 * ─────────────────────────────────────────────────────────────
 *  LOAD TEST — Simulation du jour de vote
 *
 *  IMPORTANT : Ce test utilise des comptes pré-créés pour éviter
 *  que le rate limiting register (3/heure/IP) bloque le test.
 *
 *  Étape 1 : Lancer le setup une fois pour créer les comptes
 *    k6 run k6/setup.js -e BASE_URL=...
 *
 *  Étape 2 : Lancer ce test
 *    k6 run k6/load.js -e BASE_URL=...
 *
 *  Scénario :
 *    0→5min  : montée (0→50 VUs)
 *    5→15min : charge nominale (50 VUs)
 *    15→20min: pic (100 VUs)
 *    20→25min: retour (50 VUs)
 *    25→30min: descente (0)
 * ─────────────────────────────────────────────────────────────
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { BASE_URL } from './config.js';

// ── Métriques custom ──────────────────────────────────────────
const loginDuration    = new Trend('login_duration',    true);
const voteDuration     = new Trend('vote_duration',     true);
const resultsDuration  = new Trend('results_duration',  true);
const voteErrors       = new Rate('vote_errors');
const successfulVotes  = new Counter('successful_votes');
const loginErrors      = new Rate('login_errors');

export const options = {
  stages: [
    { duration: '5m',  target: 50  },
    { duration: '10m', target: 50  },
    { duration: '5m',  target: 100 },
    { duration: '5m',  target: 50  },
    { duration: '5m',  target: 0   },
  ],
  thresholds: {
    // Seuils réalistes pour Render free tier sous charge réelle
    http_req_duration: ['p(95)<5000', 'p(99)<10000'],
    login_duration:    ['p(95)<5000'],
    vote_duration:     ['p(95)<5000'],
    results_duration:  ['p(95)<3000'],
    // Moins de 20% d'erreurs (inclut les 429 normaux du rate limiting)
    http_req_failed:   ['rate<0.20'],
    vote_errors:       ['rate<0.05'],
    login_errors:      ['rate<0.20'],
  },
};

// Comptes pré-créés par setup.js (même email pattern, même password)
const LOAD_PASSWORD = 'LoadTest123!CTS';
const totalUsers    = 500;

function getEmail(vuIndex) {
  return `loadtest_${vuIndex}@uadb.edu.sn`;
}

const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };

export default function () {
  const vuIndex = __VU % totalUsers;
  const email   = getEmail(vuIndex);

  // ── Login (compte pré-existant) ───────────────────────────
  let token = null;
  group('01_login', () => {
    const start  = Date.now();
    const res    = http.post(`${BASE_URL}/login`,
      JSON.stringify({ email, password: LOAD_PASSWORD }),
      { headers });
    loginDuration.add(Date.now() - start);

    const ok = check(res, {
      'login: 200':        (r) => r.status === 200,
      'login: token reçu': (r) => Boolean(r.json('data.access_token')),
    });
    loginErrors.add(!ok);
    token = res.json('data.access_token');

    if (!ok) {
      // Si le compte n'existe pas encore, l'inscrire (une seule fois par VU)
      if (res.status === 401) {
        http.post(`${BASE_URL}/register`, JSON.stringify({
          first_name: 'Load', last_name:  `${vuIndex}`,
          email, password: LOAD_PASSWORD,
          password_confirmation: LOAD_PASSWORD,
          browserId: `k6-load-${__VU}`, website: '',
        }), { headers });
        // Réessayer le login
        const retry = http.post(`${BASE_URL}/login`,
          JSON.stringify({ email, password: LOAD_PASSWORD }), { headers });
        token = retry.json('data.access_token');
      }
    }
  });

  if (!token) { sleep(2); return; }

  const authH = { ...headers, Authorization: `Bearer ${token}` };

  sleep(0.5);

  // ── Navigation pré-vote ───────────────────────────────────
  group('02_navigation', () => {
    const pos = http.get(`${BASE_URL}/positions`, { headers: authH });
    check(pos, { 'positions: 200': (r) => r.status === 200 });
    sleep(0.3);

    const cand = http.get(`${BASE_URL}/candidates`, { headers: authH });
    check(cand, { 'candidates: 200': (r) => r.status === 200 });
    sleep(0.3);

    const myV = http.get(`${BASE_URL}/votes/my`, { headers: authH });
    check(myV, { 'votes/my: 200': (r) => r.status === 200 });
  });

  sleep(1);

  // ── Vote ──────────────────────────────────────────────────
  group('03_vote', () => {
    const posRes    = http.get(`${BASE_URL}/positions`, { headers: authH });
    const positions = posRes.json('data') || [];
    const activePos = positions.filter((p) => p.is_active);
    if (!activePos.length) return;

    const votes = activePos.slice(0, 1).map((p) => ({
      position_id: p.id, candidate_id: null,
    }));

    const start   = Date.now();
    const voteRes = http.post(
      `${BASE_URL}/votes/batch`,
      JSON.stringify({ votes }),
      { headers: authH, tags: { endpoint: 'vote' } }
    );
    voteDuration.add(Date.now() - start);

    check(voteRes, {
      'vote: 201 ou 409': (r) => r.status === 201 || r.status === 409,
      'vote: pas de 500': (r) => r.status !== 500,
    });

    if (voteRes.status === 201) successfulVotes.add(1);
    voteErrors.add(voteRes.status >= 500 ? 1 : 0);
  });

  sleep(0.5);

  // ── Résultats ─────────────────────────────────────────────
  group('04_resultats', () => {
    const start = Date.now();
    const res   = http.get(`${BASE_URL}/votes/results`, { headers: authH });
    resultsDuration.add(Date.now() - start);
    check(res, { 'results: 200': (r) => r.status === 200 });
  });

  sleep(1);

  // ── Logout ────────────────────────────────────────────────
  group('05_logout', () => {
    http.post(`${BASE_URL}/logout`, null, { headers: authH });
  });

  sleep(Math.random() * 2 + 1);
}

export function handleSummary(data) {
  const m   = data.metrics;
  const p95 = (k) => m[k] ? Math.round(m[k].values['p(95)']) + 'ms' : 'N/A';
  const rt  = (k) => m[k] ? (m[k].values.rate * 100).toFixed(1) + '%' : 'N/A';
  const cnt = (k) => m[k]?.values.count ?? 0;

  const passed = Object.values(data.metrics)
    .flatMap((m) => Object.values(m.thresholds || {}))
    .every((t) => t.ok);

  return {
    'k6/reports/load-summary.json': JSON.stringify(data, null, 2),
    stdout: `
╔══════════════════════════════════════════════════════════╗
║           CTS Vote — Rapport de charge k6                ║
╚══════════════════════════════════════════════════════════╝

📊 Requêtes totales   : ${m.http_reqs?.values.count ?? 'N/A'}
❌ Taux d'erreurs HTTP : ${rt('http_req_failed')}
⏱  Durée p(95)         : ${p95('http_req_duration')}

🔐 Login p(95)          : ${p95('login_duration')}
   Erreurs login         : ${rt('login_errors')}
🗳  Vote p(95)           : ${p95('vote_duration')}
📈 Résultats p(95)      : ${p95('results_duration')}

✅ Votes réussis         : ${cnt('successful_votes')}
⚠️  Erreurs votes        : ${rt('vote_errors')}

${passed ? '✅ TOUS LES SEUILS PASSÉS' : '❌ CERTAINS SEUILS DÉPASSÉS'}

NOTE: Les erreurs 429 (rate limiting) sont normales sur un
test depuis une seule IP. En production, chaque électeur
a sa propre IP — les 429 seront quasi-nuls.
`,
  };
}
