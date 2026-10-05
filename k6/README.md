# Tests de charge k6 — CTS Vote

Scripts de tests de performance et de sécurité pour la plateforme électorale du Cyber Tech Squad.

## Installation k6

### Windows
```powershell
# Via winget
winget install k6.k6

# Via choco
choco install k6

# Ou télécharger directement
# https://github.com/grafana/k6/releases/latest
```

### Linux / macOS
```bash
# macOS
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
     --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
     | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

---

## Scripts disponibles

| Script | Objectif | Durée | VUs max |
|---|---|---|---|
| `smoke.js`    | Vérifier que tout fonctionne (1 user) | 1 min | 1 |
| `setup.js`    | Pré-créer les comptes de test | ~35 min | 1 |
| `load.js`     | Simulation jour de vote (flux complet) | 30 min | 100 |
| `stress.js`   | Trouver le point de rupture | 10 min | 200 |
| `spike.js`    | Pic d'ouverture soudain | ~4 min | 100 |
| `security.js` | Valider les protections sécurité | 3 min | 5 |

---

## Utilisation

### Ordre recommandé

```
1. smoke.js    → valider que l'app répond
2. security.js → valider que les protections fonctionnent
3. setup.js    → pré-créer les comptes de test (fait une seule fois)
4. load.js     → simuler le jour de vote
5. stress.js   → trouver le point de rupture
6. spike.js    → tester la résistance aux pics
```

### Pourquoi setup.js est nécessaire ?

Le rate limiting protège `/register` à **3 inscriptions/heure/IP**.
Avec 100 VUs depuis la même machine → bloqué après 3 requêtes.
`setup.js` crée les comptes lentement (1 toutes les 22s) pour rester
sous la limite, puis `load.js` réutilise ces comptes existants.

### Version rapide (3 comptes seulement)
```bash
k6 run k6/setup.js -e BASE_URL=https://cts-backend-1.onrender.com/api -e TOTAL=3
# Attendre 1h puis relancer avec les 3 suivants
k6 run k6/setup.js -e BASE_URL=... -e TOTAL=3 --env-file offset=3
```

### Tester en local (backend doit tourner)
```bash
cd cts-backend && php artisan serve

# Smoke
k6 run k6/smoke.js -e BASE_URL=http://localhost:8000/api

# Setup rapide en local (pas de rate limit sur localhost)
k6 run k6/setup.js -e BASE_URL=http://localhost:8000/api -e TOTAL=100
# Puis load test
k6 run k6/load.js  -e BASE_URL=http://localhost:8000/api
```

### Tester en production
```bash
# Smoke
k6 run k6/smoke.js \
  -e BASE_URL=https://cts-backend-1.onrender.com/api \
  -e ADMIN_EMAIL=admin@uadb.edu.sn \
  -e ADMIN_PASSWORD=VotreMotDePasse

# Security
k6 run k6/security.js -e BASE_URL=https://cts-backend-1.onrender.com/api

# Setup (une seule fois, ~35min pour 100 comptes)
k6 run k6/setup.js -e BASE_URL=https://cts-backend-1.onrender.com/api

# Load (après setup)
k6 run k6/load.js -e BASE_URL=https://cts-backend-1.onrender.com/api
```

---

## Interpréter les résultats

### Métriques clés à surveiller

| Métrique | Seuil acceptable | Signification |
|---|---|---|
| `http_req_duration p(95)` | < 2000ms | 95% des requêtes sous 2s |
| `http_req_failed rate` | < 5% | Moins de 5% d'erreurs |
| `login_duration p(95)` | < 3000ms | Login sous 3s |
| `vote_duration p(95)` | < 3000ms | Vote sous 3s |
| `vote_errors rate` | < 1% | Quasi-zéro erreur sur les votes |

### Statuts HTTP attendus

| Code | Signification | Normal ? |
|---|---|---|
| 201 | Vote créé avec succès | ✅ |
| 409 | Double vote bloqué | ✅ Normal |
| 422 | Validation échouée | ✅ Normal (données invalides) |
| 429 | Rate limit déclenché | ✅ Protection active |
| 401 | Non authentifié | ✅ Protection active |
| 500 | Erreur serveur | ❌ Problème |
| 0   | Timeout / pas de réponse | ❌ Serveur saturé |

---

## Résultats attendus sur Render free tier

Basés sur la config actuelle (15 workers FPM, OPcache, gzip) :

| Scénario | Résultat attendu |
|---|---|
| Smoke (1 user) | p(95) < 500ms, 0% erreurs |
| Load (50 users) | p(95) < 2000ms, < 2% erreurs |
| Load pic (100 users) | p(95) < 3000ms, < 5% erreurs |
| Stress (200 users) | p(95) < 5000ms, < 10% erreurs |
| Spike (100 users instantanés) | quelques 429, pas de 500 |

Si tu constates des 500 en load test → scale vers Render Starter + `numInstances: 2`.
