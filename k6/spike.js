/**
 * ─────────────────────────────────────────────────────────────
 *  SPIKE TEST — Pic soudain (ex: tous les électeurs arrivent
 *  au même moment à l'ouverture des votes à 8h00)
 *
 *  Phase 1 (0→10s)  : 0 → 100 users instantanément
 *  Phase 2 (10s→3m) : maintien 100 users
 *  Phase 3 (3m→3m30): retour à 0 instantanément
 *
 *  Utilisation :
 *    k6 run k6/spike.js
 * ─────────────────────────────────────────────────────────────
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { BASE_URL } from './config.js';

const errorRate = new Rate('spike_errors');

export const options = {
  stages: [
    { duration: '10s', target: 100 }, // Pic instantané
    { duration: '3m',  target: 100 }, // Maintien
    { duration: '30s', target: 0   }, // Retour immédiat
  ],
  thresholds: {
    spike_errors:    ['rate<0.15'],   // Max 15% d'erreurs sur un spike
    http_req_failed: ['rate<0.15'],
    http_req_duration: ['p(95)<5000'],
  },
};

const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
const EMAILS = Array.from({ length: 300 }, (_, i) => `spike${i}@uadb.edu.sn`);
const PWD    = 'SpikeTest123!CTS';

export default function () {
  const email = EMAILS[__VU % EMAILS.length];

  http.post(`${BASE_URL}/register`, JSON.stringify({
    first_name: 'Spike', last_name: `${__VU}`,
    email, password: PWD, password_confirmation: PWD,
    browserId: `k6-spike-${__VU}`, website: '',
  }), { headers });

  const res = http.post(`${BASE_URL}/login`,
    JSON.stringify({ email, password: PWD }), { headers });

  const ok = check(res, {
    'spike login: réponse reçue': (r) => r.status !== 0,
    'spike login: pas de 5xx':    (r) => r.status < 500,
  });
  errorRate.add(!ok);

  const token = res.json('data.access_token');
  if (!token) { sleep(0.5); return; }

  const authH = { ...headers, Authorization: `Bearer ${token}` };

  // Simulation consultation bulletin au pic d'ouverture
  const posRes = http.get(`${BASE_URL}/positions`, { headers: authH });
  check(posRes, { 'positions spike: réponse': (r) => r.status < 500 });

  const candRes = http.get(`${BASE_URL}/candidates`, { headers: authH });
  check(candRes, { 'candidates spike: réponse': (r) => r.status < 500 });

  sleep(1);
}
