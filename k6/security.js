/**
 * ─────────────────────────────────────────────────────────────
 *  SECURITY TEST — Vérifier que les protections tiennent
 *  sous charge (rate limiting, auth, double vote)
 *
 *  Utilisation :
 *    k6 run k6/security.js
 * ─────────────────────────────────────────────────────────────
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter } from 'k6/metrics';
import { BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD } from './config.js';

const rateLimitHits   = new Counter('rate_limit_hits');
const authBlockedReqs = new Counter('auth_blocked');
const doubleVoteBlock = new Counter('double_vote_blocked');

export const options = {
  vus:      5,
  duration: '3m',
  thresholds: {
    // Ces compteurs DOIVENT être > 0 pour valider que la protection fonctionne
    // (si rate_limit_hits=0, le rate limiting ne marche pas)
  },
};

const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };

export default function () {

  // ── Test 1 : Accès admin sans token ──────────────────────
  group('auth_protection', () => {
    const noToken = http.get(`${BASE_URL}/admin/stats-globales`, { headers });
    check(noToken, {
      'admin sans token → 401': (r) => r.status === 401,
    });
    if (noToken.status === 401) authBlockedReqs.add(1);

    // Tentative accès résultats complets sans auth
    const noTokenResults = http.get(`${BASE_URL}/votes/results/all`, { headers });
    check(noTokenResults, {
      'results/all sans token → 401': (r) => r.status === 401,
    });
    if (noTokenResults.status === 401) authBlockedReqs.add(1);

    // Tentative voter sans token
    const noTokenVote = http.post(`${BASE_URL}/votes/batch`,
      JSON.stringify({ votes: [{ position_id: 1, candidate_id: null }] }),
      { headers }
    );
    check(noTokenVote, {
      'vote sans token → 401': (r) => r.status === 401,
    });
    if (noTokenVote.status === 401) authBlockedReqs.add(1);

    sleep(0.2);
  });

  // ── Test 2 : Rate limiting login (5 tentatives/min) ──────
  group('rate_limiting', () => {
    // Bombarder le login avec de mauvais credentials
    for (let i = 0; i < 8; i++) {
      const res = http.post(`${BASE_URL}/login`,
        JSON.stringify({ email: 'attaquant@uadb.edu.sn', password: 'wrong' }),
        { headers }
      );
      if (res.status === 429) {
        rateLimitHits.add(1);
        check(res, { 'rate limit: 429 reçu': () => true });
        break; // Le rate limiting a fonctionné
      }
    }
    sleep(0.5);
  });

  // ── Test 3 : Tentative de double vote ─────────────────────
  group('double_vote_protection', () => {
    const email = `dv_${__VU}_${__ITER}@uadb.edu.sn`;
    const pwd   = 'DoubleVote123!CTS';

    // Créer un compte
    http.post(`${BASE_URL}/register`, JSON.stringify({
      first_name: 'DV', last_name: `${__VU}`,
      email, password: pwd, password_confirmation: pwd,
      browserId: `k6-dv-${__VU}-${__ITER}`, website: '',
    }), { headers });

    const login = http.post(`${BASE_URL}/login`,
      JSON.stringify({ email, password: pwd }), { headers });
    const token = login.json('data.access_token');
    if (!token) return;

    const authH = { ...headers, Authorization: `Bearer ${token}` };

    // Récupérer un scrutin actif
    const posRes = http.get(`${BASE_URL}/positions`, { headers: authH });
    const positions = posRes.json('data') || [];
    const activePos = positions.find((p) => p.is_active);
    if (!activePos) return;

    const votePayload = JSON.stringify({
      votes: [{ position_id: activePos.id, candidate_id: null }],
    });

    // Premier vote
    const vote1 = http.post(`${BASE_URL}/votes/batch`, votePayload, { headers: authH });
    check(vote1, { 'premier vote: 201': (r) => r.status === 201 });

    // Deuxième vote (doit être bloqué)
    const vote2 = http.post(`${BASE_URL}/votes/batch`, votePayload, { headers: authH });
    check(vote2, {
      'double vote → 409 bloqué': (r) => r.status === 409,
    });
    if (vote2.status === 409) doubleVoteBlock.add(1);

    sleep(0.5);
  });

  sleep(2);
}

export function handleSummary(data) {
  const m = data.metrics;
  const count = (k) => m[k]?.values.count ?? 0;

  const report = `
╔══════════════════════════════════════════════════════════╗
║         CTS Vote — Rapport de sécurité k6                ║
╚══════════════════════════════════════════════════════════╝

🔐 Requêtes bloquées sans auth : ${count('auth_blocked')}
   (doit être > 0 → protections actives)

🚦 Rate limit déclenché        : ${count('rate_limit_hits')}
   (doit être > 0 → rate limiting fonctionne)

🗳  Double votes bloqués        : ${count('double_vote_blocked')}
   (doit être > 0 → anti-double-vote actif)

❌ Requêtes échouées            : ${((m.http_req_failed?.values.rate ?? 0) * 100).toFixed(1)}%

${count('rate_limit_hits') === 0   ? '⚠️  ATTENTION: Rate limiting non déclenché !' : '✅ Rate limiting OK'}
${count('auth_blocked') === 0       ? '⚠️  ATTENTION: Pas de blocage sans auth !' : '✅ Authentification OK'}
${count('double_vote_blocked') === 0? '⚠️  ATTENTION: Double vote non bloqué !' : '✅ Anti double-vote OK'}
`;

  return {
    'k6/reports/security-summary.json': JSON.stringify(data, null, 2),
    stdout: report,
  };
}
