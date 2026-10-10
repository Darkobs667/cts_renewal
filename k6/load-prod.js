/**
 * ─────────────────────────────────────────────────────────────
 *  LOAD TEST PRODUCTION — Utilise les vrais comptes existants
 *
 *  Contrairement à load.js, ce script utilise les comptes
 *  RÉELS déjà en base Supabase (loadtest_X + vrais électeurs).
 *  Pas de register → pas de rate limiting.
 *
 *  Pré-requis : avoir lancé setup-prod.js au moins une fois
 *  OU utiliser directement les vrais comptes électeurs.
 *
 *  Utilisation :
 *    k6 run k6/load-prod.js \
 *      -e BASE_URL=https://cts-backend-1.onrender.com/api \
 *      -e LOAD_PWD=LoadTest123!CTS
 * ─────────────────────────────────────────────────────────────
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { BASE_URL } from './config.js';

// ── Métriques ─────────────────────────────────────────────────
const loginDuration   = new Trend('login_duration',   true);
const voteDuration    = new Trend('vote_duration',    true);
const resultsDuration = new Trend('results_duration', true);
const navDuration     = new Trend('nav_duration',     true);
const voteErrors      = new Rate('vote_errors');
const loginErrors     = new Rate('login_errors');
const successfulVotes = new Counter('successful_votes');
const totalLogins     = new Counter('total_logins');

export const options = {
  stages: [
    { duration: '2m',  target: 20  }, // Montée douce
    { duration: '5m',  target: 50  }, // Charge nominale
    { duration: '3m',  target: 100 }, // Pic
    { duration: '3m',  target: 50  }, // Retour
    { duration: '2m',  target: 0   }, // Descente
  ],
  thresholds: {
    // Seuils pour Render free tier + Supabase (latence réseau réelle)
    http_req_duration:      ['p(95)<4000', 'p(99)<8000'],
    login_duration:         ['p(95)<4000'],
    vote_duration:          ['p(95)<4000'],
    results_duration:       ['p(95)<3000'],
    nav_duration:           ['p(95)<3000'],
    http_req_failed:        ['rate<0.15'],  // 429 login attendus
    vote_errors:            ['rate<0.02'],  // Quasi-zéro sur les votes
    login_errors:           ['rate<0.15'],  // 429 possible sur login
  },
};

const LOAD_PASSWORD = __ENV.LOAD_PWD || 'LoadTest123!CTS';
const TOTAL_ACCOUNTS = 100; // comptes loadtest_0 à loadtest_99

const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };

export default function () {
  // Chaque VU utilise son propre compte pour éviter les conflits JWT
  const idx   = (__VU - 1) % TOTAL_ACCOUNTS;
  const email = `loadtest_${idx}@uadb.edu.sn`;

  // ── 1. Login ──────────────────────────────────────────────
  let token = null;
  group('01_login', () => {
    const start = Date.now();
    const res   = http.post(`${BASE_URL}/login`,
      JSON.stringify({ email, password: LOAD_PASSWORD }),
      { headers });
    loginDuration.add(Date.now() - start);
    totalLogins.add(1);

    const ok = check(res, {
      'login: 200':        (r) => r.status === 200,
      'login: token reçu': (r) => Boolean(r.json('data.access_token')),
    });
    loginErrors.add(!ok ? 1 : 0);
    token = res.json('data.access_token');

    if (res.status === 429) {
      // Rate limit login → pause et skip itération
      sleep(3);
    }
  });

  if (!token) { sleep(2); return; }

  const authH = { ...headers, Authorization: `Bearer ${token}` };
  sleep(0.3);

  // ── 2. Navigation (simule un électeur qui consulte) ───────
  group('02_navigation', () => {
    const start = Date.now();

    const pos  = http.get(`${BASE_URL}/positions`,  { headers: authH });
    check(pos, { 'positions: 200': (r) => r.status === 200 });
    sleep(0.2);

    const cand = http.get(`${BASE_URL}/candidates`, { headers: authH });
    check(cand, { 'candidates: 200': (r) => r.status === 200 });
    sleep(0.2);

    const myV  = http.get(`${BASE_URL}/votes/my`,   { headers: authH });
    check(myV, { 'votes/my: 200': (r) => r.status === 200 });

    navDuration.add(Date.now() - start);
  });

  // Simule le temps de lecture / réflexion de l'électeur
  sleep(Math.random() * 2 + 1);

  // ── 3. Vote ───────────────────────────────────────────────
  group('03_vote', () => {
    // Charger les positions actives
    const posRes    = http.get(`${BASE_URL}/positions`, { headers: authH });
    const positions = posRes.json('data') || [];
    const active    = positions.filter((p) => p.is_active);

    if (!active.length) {
      // Aucun scrutin actif — comportement normal hors période de vote
      return;
    }

    // Voter sur le premier scrutin actif (vote blanc pour les tests)
    const votes = [{ position_id: active[0].id, candidate_id: null }];

    const start   = Date.now();
    const voteRes = http.post(
      `${BASE_URL}/votes/batch`,
      JSON.stringify({ votes }),
      { headers: authH, tags: { endpoint: 'vote' } }
    );
    voteDuration.add(Date.now() - start);

    check(voteRes, {
      // 201 = nouveau vote, 409 = déjà voté (normal sur itérations suivantes)
      'vote: 201 ou 409': (r) => r.status === 201 || r.status === 409,
      'vote: pas de 5xx': (r) => r.status < 500,
    });

    if (voteRes.status === 201)   successfulVotes.add(1);
    if (voteRes.status >= 500)    voteErrors.add(1);
    else                          voteErrors.add(0);
  });

  sleep(0.5);

  // ── 4. Consultation résultats ─────────────────────────────
  group('04_resultats', () => {
    const start = Date.now();
    const res   = http.get(`${BASE_URL}/votes/results`, { headers: authH });
    resultsDuration.add(Date.now() - start);
    check(res, { 'results: 200': (r) => r.status === 200 });
  });

  sleep(0.5);

  // ── 5. Logout ─────────────────────────────────────────────
  group('05_logout', () => {
    http.post(`${BASE_URL}/logout`, null, { headers: authH });
  });

  // Pause variable entre itérations (simule comportement humain)
  sleep(Math.random() * 3 + 1);
}

export function handleSummary(data) {
  const m   = data.metrics;
  const p95 = (k) => m[k] ? Math.round(m[k].values['p(95)']) + 'ms' : 'N/A';
  const p99 = (k) => m[k] ? Math.round(m[k].values['p(99)']) + 'ms' : 'N/A';
  const avg = (k) => m[k] ? Math.round(m[k].values.avg)         + 'ms' : 'N/A';
  const rt  = (k) => m[k] ? (m[k].values.rate * 100).toFixed(1) + '%'  : 'N/A';
  const cnt = (k) => m[k]?.values.count ?? 0;

  const allOk = Object.entries(data.thresholds || {}).every(([, t]) => t.ok);

  return {
    'k6/reports/load-prod-summary.json': JSON.stringify(data, null, 2),
    stdout: `
╔══════════════════════════════════════════════════════════════╗
║      CTS Vote — Rapport de charge PRODUCTION (Render)       ║
╚══════════════════════════════════════════════════════════════╝

🌐 Backend : ${BASE_URL}

📊 Requêtes totales      : ${m.http_reqs?.values.count ?? 'N/A'}
   Débit (req/s)          : ${m.http_reqs?.values.rate?.toFixed(2) ?? 'N/A'}

⏱  Durée globale
   avg                    : ${avg('http_req_duration')}
   p(95)                  : ${p95('http_req_duration')}
   p(99)                  : ${p99('http_req_duration')}

❌ Taux d'erreurs HTTP    : ${rt('http_req_failed')}

🔐 Login
   p(95)                  : ${p95('login_duration')}
   Erreurs                : ${rt('login_errors')}
   Total logins           : ${cnt('total_logins')}

🧭 Navigation p(95)       : ${p95('nav_duration')}

🗳  Vote
   p(95)                  : ${p95('vote_duration')}
   Erreurs                : ${rt('vote_errors')}
   ✅ Votes réussis        : ${cnt('successful_votes')}

📈 Résultats p(95)        : ${p95('results_duration')}

── Seuils ──────────────────────────────────────────────────────
${allOk
  ? '✅ TOUS LES SEUILS PASSÉS — Application prête pour la production'
  : '⚠️  CERTAINS SEUILS DÉPASSÉS — Voir détails ci-dessus'}

── Interprétation ──────────────────────────────────────────────
• 429 sur login = rate limiting actif (normal si même IP)
• 409 sur vote  = double vote bloqué (comportement attendu)
• 0 vote réussi = aucun scrutin actif (activer dans l'admin)
`,
  };
}
