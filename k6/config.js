/**
 * Configuration partagée pour tous les scripts k6
 * Modifier BASE_URL pour pointer vers prod ou local.
 */
export const BASE_URL = __ENV.BASE_URL || 'https://cts-backend-1.onrender.com/api';

// Compte admin réel (à définir via variables d'environnement k6)
export const ADMIN_EMAIL    = __ENV.ADMIN_EMAIL    || 'admin@uadb.edu.sn';
export const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'ChangeMe@Secure2026!';

// Seuils de performance acceptables pour CTS
// NOTE : Render free tier a un cold start de ~10-20s après inactivité.
// Le smoke test tourne après le réveil du serveur — les latences sont normalement
// plus basses lors des tests de charge (serveur déjà chaud).
export const THRESHOLDS = {
  // p(95) < 4s pour le smoke (inclut cold start éventuel)
  // p(95) < 2s pour le load test (serveur chaud)
  http_req_duration: ['p(95)<4000', 'p(99)<8000'],
  // Moins de 10% d'erreurs (le smoke peut avoir des 409 sur register)
  http_req_failed:   ['rate<0.10'],
  // Moins de 1% d'erreurs sur les votes (critique)
  'http_req_failed{endpoint:vote}': ['rate<0.01'],
};
