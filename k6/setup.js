/**
 * ─────────────────────────────────────────────────────────────
 *  SETUP — Pré-créer les comptes de test pour load.js
 *
 *  Crée 100 comptes électeurs espacés dans le temps
 *  pour éviter le rate limiting (3 inscriptions/heure/IP).
 *
 *  ⚠️  À lancer UNE SEULE FOIS avant load.js.
 *  Les comptes persistent en base entre les runs.
 *
 *  Utilisation :
 *    k6 run k6/setup.js -e BASE_URL=https://cts-backend-1.onrender.com/api
 *
 *  Durée estimée : ~35 minutes pour 100 comptes
 *  (1 inscription toutes les 20s pour rester sous le rate limit)
 *
 *  Alternative rapide : utiliser l'admin pour créer les comptes
 *  en masse depuis l'interface, ou ajouter un endpoint admin
 *  dédié aux tests qui bypass le rate limiting.
 * ─────────────────────────────────────────────────────────────
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import { BASE_URL } from './config.js';

const created = new Counter('accounts_created');
const failed  = new Counter('accounts_failed');

// Nombre de comptes à créer — ajuster selon besoin
const TOTAL   = __ENV.TOTAL ? parseInt(__ENV.TOTAL) : 20;
const PASSWORD = 'LoadTest123!CTS';

export const options = {
  vus:      1,          // 1 seul VU pour rester sous le rate limit
  iterations: TOTAL,    // 1 iteration = 1 compte
  // Espacer les inscriptions : rate limit = 3/heure → 1 toutes les 21s
  // Pour aller plus vite : utiliser --env TOTAL=3 et relancer après 1h
};

const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };

export default function () {
  const idx   = __ITER;
  const email = `loadtest_${idx}@uadb.edu.sn`;

  console.log(`[${idx + 1}/${TOTAL}] Création : ${email}`);

  const res = http.post(`${BASE_URL}/register`, JSON.stringify({
    first_name: 'Load',
    last_name:  `${idx}`,
    email,
    password:              PASSWORD,
    password_confirmation: PASSWORD,
    browserId: `setup-${idx}`,
    website:   '',
  }), { headers });

  if (res.status === 201) {
    created.add(1);
    console.log(`  ✅ Créé (${res.status})`);
  } else if (res.status === 409) {
    console.log(`  ℹ️  Déjà existant (409)`);
  } else if (res.status === 429) {
    console.log(`  ⏳ Rate limit (429) — pause 65s...`);
    sleep(65); // Attendre que la fenêtre se réinitialise
    // Réessayer
    const retry = http.post(`${BASE_URL}/register`, JSON.stringify({
      first_name: 'Load', last_name: `${idx}`,
      email, password: PASSWORD, password_confirmation: PASSWORD,
      browserId: `setup-retry-${idx}`, website: '',
    }), { headers });
    if (retry.status === 201) created.add(1);
    else failed.add(1);
  } else {
    failed.add(1);
    console.log(`  ❌ Échec (${res.status}): ${res.body.substring(0, 150)}`);
  }

  // Pause entre chaque inscription pour rester sous le rate limit
  // rate limit = 3/heure/IP → 1 toutes les 22s = ~2.7/heure (safe)
  if (res.status !== 429) sleep(22);
}

export function handleSummary(data) {
  const c = data.metrics['accounts_created']?.values.count ?? 0;
  const f = data.metrics['accounts_failed']?.values.count ?? 0;

  return {
    stdout: `
╔══════════════════════════════════════════════════════════╗
║              CTS Vote — Setup k6 terminé                 ║
╚══════════════════════════════════════════════════════════╝

✅ Comptes créés  : ${c}
❌ Échecs          : ${f}

${c > 0
  ? `Vous pouvez maintenant lancer le load test :\nk6 run k6/load.js -e BASE_URL=${BASE_URL}`
  : 'Aucun compte créé. Vérifiez les logs ci-dessus.'}
`,
  };
}
