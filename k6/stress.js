/**
 * ─────────────────────────────────────────────────────────────
 *  STRESS TEST — Trouver le point de rupture
 *  Monte jusqu'à 200 VUs pour identifier à partir de combien
 *  l'application commence à dégrader.
 *
 *  Phase 1 (0→2min)  : 50 users (charge nominale)
 *  Phase 2 (2→4min)  : 100 users
 *  Phase 3 (4→6min)  : 150 users
 *  Phase 4 (6→8min)  : 200 users (stress max)
 *  Phase 5 (8→10min) : recovery à 0
 *
 *  Utilisation :
 *    k6 run k6/stress.js
 * ─────────────────────────────────────────────────────────────
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { BASE_URL } from './config.js';

const reqDuration = new Trend('req_duration', true);
const errorRate   = new Rate('error_rate');

export const options = {
  stages: [
    { duration: '2m', target: 50  },
    { duration: '2m', target: 100 },
    { duration: '2m', target: 150 },
    { duration: '2m', target: 200 },
    { duration: '2m', target: 0   },
  ],
  thresholds: {
    // Stress : on accepte jusqu'à 10% d'erreurs
    error_rate:      ['rate<0.10'],
    // On veut que p(99) reste sous 5s même sous stress
    req_duration:    ['p(99)<5000'],
    http_req_failed: ['rate<0.10'],
  },
};

const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
const VU_EMAILS  = Array.from({ length: 500 }, (_, i) => `stress${i}@uadb.edu.sn`);
const VU_PWD     = 'StressTest123!CTS';

export default function () {
  const email = VU_EMAILS[__VU % VU_EMAILS.length];

  // Inscription (ignorée si existe déjà)
  http.post(`${BASE_URL}/register`, JSON.stringify({
    first_name: 'Stress', last_name: `${__VU}`,
    email, password: VU_PWD, password_confirmation: VU_PWD,
    browserId: `stress_${__VU}`, website: '',
  }), { headers });

  // Login
  const start    = Date.now();
  const loginRes = http.post(`${BASE_URL}/login`,
    JSON.stringify({ email, password: VU_PWD }), { headers });
  reqDuration.add(Date.now() - start);

  const ok = check(loginRes, {
    'login: pas de 5xx': (r) => r.status < 500,
    'login: 200 ou 401': (r) => r.status === 200 || r.status === 401 || r.status === 422,
  });
  errorRate.add(!ok);

  const token = loginRes.json('data.access_token');
  if (!token) { sleep(1); return; }

  const authH = { ...headers, Authorization: `Bearer ${token}` };

  // Charger les positions (route la plus appelée)
  const posStart = Date.now();
  const posRes = http.get(`${BASE_URL}/positions`, { headers: authH });
  reqDuration.add(Date.now() - posStart);
  check(posRes, { 'positions: pas de 5xx': (r) => r.status < 500 });

  // Charger les résultats
  const resStart = Date.now();
  const resRes = http.get(`${BASE_URL}/votes/results`, { headers: authH });
  reqDuration.add(Date.now() - resStart);
  check(resRes, { 'results: pas de 5xx': (r) => r.status < 500 });

  sleep(0.5);
}
