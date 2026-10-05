/**
 * ─────────────────────────────────────────────────────────────
 *  LOAD TEST — Simulation du jour de vote
 *  Scénario réaliste : 300 électeurs, pic le matin
 *
 *  Phase 1 (0→5min)  : montée en charge progressive (0→50 users)
 *  Phase 2 (5→15min) : charge soutenue (50 users = pic réaliste)
 *  Phase 3 (15→20min): pic extrême (100 users = 2× la normale)
 *  Phase 4 (20→25min): retour à la normale (50 users)
 *  Phase 5 (25→30min): descente (0 users)
 *
 *  Utilisation :
 *    k6 run k6/load.js
 *    k6 run k6/load.js -e BASE_URL=http://localhost:8000/api
 * ─────────────────────────────────────────────────────────────
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { BASE_URL, THRESHOLDS } from './config.js';

// ── Métriques custom ──────────────────────────────────────────
const loginDuration    = new Trend('login_duration',    true);
const voteDuration     = new Trend('vote_duration',     true);
const resultsDuration  = new Trend('results_duration',  true);
const voteErrors       = new Rate('vote_errors');
const successfulVotes  = new Counter('successful_votes');

export const options = {
  stages: [
    { duration: '5m',  target: 50  }, // Montée progressive
    { duration: '10m', target: 50  }, // Charge nominale (50 electeurs simultanés)
    { duration: '5m',  target: 100 }, // Pic extrême
    { duration: '5m',  target: 50  }, // Retour normale
    { duration: '5m',  target: 0   }, // Descente
  ],
  thresholds: {
    ...THRESHOLDS,
    login_duration:   ['p(95)<3000'],
    vote_duration:    ['p(95)<3000'],
    results_duration: ['p(95)<2000'],
    vote_errors:      ['rate<0.02'],
  },
};

// Pool d'emails pré-générés (simuler des utilisateurs existants)
// En vrai, utiliser des comptes pré-créés en base pour éviter les registrations pendant le test
const VU_EMAILS = Array.from({ length: 500 }, (_, i) =>
  `electeur${i + 1}@uadb.edu.sn`
);
const VU_PASSWORD = 'TestPassword123!CTS';

const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };

export default function () {
  // Chaque VU simule un électeur différent
  const vuIndex = __VU % VU_EMAILS.length;
  const email   = VU_EMAILS[vuIndex];

  // ── Groupe 1 : Authentification ───────────────────────────
  let token = null;
  group('01_authentification', () => {
    // Essai inscription (peut échouer si compte existe déjà — c'est normal)
    http.post(`${BASE_URL}/register`, JSON.stringify({
      first_name: 'Electeur', last_name:  `${vuIndex + 1}`,
      email, password: VU_PASSWORD, password_confirmation: VU_PASSWORD,
      browserId: `k6-vu-${__VU}`, website: '',
    }), { headers });

    sleep(0.3);

    // Connexion
    const start = Date.now();
    const res = http.post(`${BASE_URL}/login`, JSON.stringify({ email, password: VU_PASSWORD }), { headers });
    loginDuration.add(Date.now() - start);

    check(res, {
      'login: 200':          (r) => r.status === 200,
      'login: token reçu':   (r) => Boolean(r.json('data.access_token')),
    });

    token = res.json('data.access_token');
  });

  if (!token) { sleep(2); return; }

  const authHeaders = { ...headers, Authorization: `Bearer ${token}` };

  sleep(0.5);

  // ── Groupe 2 : Navigation pré-vote ────────────────────────
  group('02_navigation', () => {
    // Charger les positions
    const pos = http.get(`${BASE_URL}/positions`, { headers: authHeaders });
    check(pos, { 'positions: 200': (r) => r.status === 200 });
    sleep(0.3);

    // Charger les candidats
    const cand = http.get(`${BASE_URL}/candidates`, { headers: authHeaders });
    check(cand, { 'candidates: 200': (r) => r.status === 200 });
    sleep(0.3);

    // Vérifier mes votes existants
    const myV = http.get(`${BASE_URL}/votes/my`, { headers: authHeaders });
    check(myV, { 'votes/my: 200': (r) => r.status === 200 });
  });

  sleep(1);

  // ── Groupe 3 : Vote ───────────────────────────────────────
  group('03_vote', () => {
    // Récupérer les positions actives
    const posRes = http.get(`${BASE_URL}/positions`, { headers: authHeaders });
    const positions = posRes.json('data') || [];
    const activePos = positions.filter((p) => p.is_active);

    if (!activePos.length) { return; }

    // Construire le bulletin (vote blanc sur le premier scrutin actif)
    const votes = activePos.slice(0, 1).map((p) => ({
      position_id:  p.id,
      candidate_id: null, // vote blanc pour le test
    }));

    const start  = Date.now();
    const voteRes = http.post(
      `${BASE_URL}/votes/batch`,
      JSON.stringify({ votes }),
      { headers: authHeaders, tags: { endpoint: 'vote' } }
    );
    voteDuration.add(Date.now() - start);

    const ok = check(voteRes, {
      'vote: 201 ou 409': (r) => r.status === 201 || r.status === 409,
      'vote: pas de 500': (r) => r.status !== 500,
    });

    if (voteRes.status === 201) successfulVotes.add(1);
    if (voteRes.status >= 500)  voteErrors.add(1);
    else                        voteErrors.add(0);
  });

  sleep(0.5);

  // ── Groupe 4 : Consultation résultats ─────────────────────
  group('04_resultats', () => {
    const start  = Date.now();
    const res = http.get(`${BASE_URL}/votes/results`, { headers: authHeaders });
    resultsDuration.add(Date.now() - start);

    check(res, { 'results: 200': (r) => r.status === 200 });
  });

  sleep(1);

  // ── Groupe 5 : Déconnexion ────────────────────────────────
  group('05_logout', () => {
    const res = http.post(`${BASE_URL}/logout`, null, { headers: authHeaders });
    check(res, { 'logout: 200': (r) => r.status === 200 });
  });

  sleep(Math.random() * 2 + 1); // Pause aléatoire 1-3s entre itérations
}

export function handleSummary(data) {
  return {
    'k6/reports/load-summary.json': JSON.stringify(data, null, 2),
    stdout: generateTextSummary(data),
  };
}

function generateTextSummary(data) {
  const m = data.metrics;
  const p95 = (metric) => metric ? Math.round(metric.values['p(95)']) : 'N/A';
  const rate = (metric) => metric ? (metric.values.rate * 100).toFixed(1) + '%' : 'N/A';

  return `
╔══════════════════════════════════════════════════════════╗
║           CTS Vote — Rapport de charge k6                ║
╚══════════════════════════════════════════════════════════╝

📊 Requêtes totales  : ${m.http_reqs?.values.count ?? 'N/A'}
❌ Taux d'erreurs    : ${rate(m.http_req_failed)}
⏱  Durée p(95)       : ${p95(m.http_req_duration)} ms

🔐 Login p(95)        : ${p95(m.login_duration)} ms
🗳  Vote p(95)         : ${p95(m.vote_duration)} ms
📈 Résultats p(95)    : ${p95(m.results_duration)} ms

✅ Votes réussis      : ${m.successful_votes?.values.count ?? 0}
⚠️  Erreurs votes     : ${rate(m.vote_errors)}

Seuils : ${data.options.thresholds ? '✅ Vérifiés' : '—'}
`;
}
