/**
 * ─────────────────────────────────────────────────────────────
 *  SMOKE TEST — 1 utilisateur, 1 minute
 *  Objectif : vérifier que les routes principales répondent
 *  correctement sans charge. À lancer avant tout autre test.
 *
 *  Utilisation :
 *    k6 run k6/smoke.js
 *    k6 run k6/smoke.js -e BASE_URL=http://localhost:8000/api
 * ─────────────────────────────────────────────────────────────
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, THRESHOLDS } from './config.js';

export const options = {
  vus:      1,
  duration: '1m',
  thresholds: THRESHOLDS,
};

// Génère un email unique par VU et par itération — garantit unicité entre runs k6
const testEmail = () =>
  `k6_${__VU}_${__ITER}_${Date.now()}@uadb.edu.sn`;

export default function () {
  const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };

  // ── 1. Health check ───────────────────────────────────────
  const health = http.get(`${BASE_URL}/health`);
  check(health, {
    'health: status 200':  (r) => r.status === 200,
    'health: status ok':   (r) => r.json('status') === 'ok',
    'health: db connected':(r) => r.json('database') === 'connected',
  });
  sleep(0.5);

  // ── 2. Routes publiques ───────────────────────────────────
  const positions = http.get(`${BASE_URL}/positions`, { headers });
  check(positions, {
    'positions: status 200': (r) => r.status === 200,
    'positions: has data':   (r) => r.json('success') === true,
  });
  sleep(0.5);

  const candidates = http.get(`${BASE_URL}/candidates`, { headers });
  check(candidates, {
    'candidates: status 200': (r) => r.status === 200,
  });
  sleep(0.5);

  const results = http.get(`${BASE_URL}/votes/results`, { headers });
  check(results, {
    'results publics: status 200': (r) => r.status === 200,
  });
  sleep(0.5);

  // ── 3. Inscription ────────────────────────────────────────
  const email = testEmail();
  const pwd   = 'TestPassword123!CTS';
  const reg   = http.post(`${BASE_URL}/register`, JSON.stringify({
    first_name: 'Test', last_name: 'User',
    email, password: pwd, password_confirmation: pwd,
    browserId: '', website: '',
  }), { headers });
  check(reg, {
    // Accepter 201 (créé) OU 409 (email déjà existant entre runs)
    'register: 201 ou 409': (r) => r.status === 201 || r.status === 409,
    'register: pas de 5xx': (r) => r.status < 500,
  });

  // Si 409 (compte déjà créé lors d'un run précédent), on utilise le même mdp
  // Le mot de passe est identique donc le login fonctionnera quand même
  sleep(0.5);

  // ── 4. Login électeur ─────────────────────────────────────
  const login = http.post(`${BASE_URL}/login`, JSON.stringify({ email, password: pwd }), { headers });
  check(login, {
    'login: status 200':        (r) => r.status === 200,
    'login: access_token reçu': (r) => Boolean(r.json('data.access_token')),
  });
  if (login.status !== 200) {
    console.log(`Login failed (${login.status}): ${login.body.substring(0, 200)}`);
  }
  const token = login.json('data.access_token');
  sleep(0.5);

  if (!token) return;

  // ── 5. Routes protégées électeur ─────────────────────────
  const authHeaders = { ...headers, Authorization: `Bearer ${token}` };

  const me = http.get(`${BASE_URL}/auth/me`, { headers: authHeaders });
  check(me, { 'auth/me: status 200': (r) => r.status === 200 });
  sleep(0.5);

  const myVotes = http.get(`${BASE_URL}/votes/my`, { headers: authHeaders });
  check(myVotes, { 'votes/my: status 200': (r) => r.status === 200 });
  sleep(0.5);

  // ── 6. Login admin + routes admin ─────────────────────────
  const adminLogin = http.post(`${BASE_URL}/login`, JSON.stringify({
    email: ADMIN_EMAIL, password: ADMIN_PASSWORD,
  }), { headers });
  check(adminLogin, {
    'admin login: status 200': (r) => r.status === 200,
  });
  const adminToken = adminLogin.json('data.access_token');
  sleep(0.5);

  if (adminToken) {
    const adminHeaders = { ...headers, Authorization: `Bearer ${adminToken}` };

    const stats = http.get(`${BASE_URL}/admin/stats-globales`, { headers: adminHeaders });
    check(stats, {
      'admin stats: status 200':   (r) => r.status === 200,
      'admin stats: has data':     (r) => r.json('success') === true,
    });
    sleep(0.5);

    // Résultats complets — admin only
    const allResults = http.get(`${BASE_URL}/votes/results/all`, { headers: adminHeaders });
    check(allResults, {
      'results/all admin: status 200': (r) => r.status === 200,
    });
    sleep(0.5);
  }

  sleep(1);
}
