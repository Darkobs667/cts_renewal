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
| `load.js`     | Simulation jour de vote (flux complet) | 30 min | 100 |
| `stress.js`   | Trouver le point de rupture | 10 min | 200 |
| `spike.js`    | Pic d'ouverture soudain | ~4 min | 100 |
| `security.js` | Valider les protections sécurité | 3 min | 5 |

---

## Utilisation

### Tester en local (backend doit tourner)
```bash
# Démarrer le backend
cd cts-backend && php artisan serve

# Dans un autre terminal
k6 run k6/smoke.js -e BASE_URL=http://localhost:8000/api
```

### Tester en production
```bash
# Smoke test d'abord (toujours commencer par là)
k6 run k6/smoke.js \
  -e BASE_URL=https://cts-backend-1.onrender.com/api \
  -e ADMIN_EMAIL=admin@uadb.edu.sn \
  -e ADMIN_PASSWORD=VotreMotDePasse

# Si smoke OK → load test
k6 run k6/load.js \
  -e BASE_URL=https://cts-backend-1.onrender.com/api

# Test sécurité
k6 run k6/security.js \
  -e BASE_URL=https://cts-backend-1.onrender.com/api \
  -e ADMIN_EMAIL=admin@uadb.edu.sn \
  -e ADMIN_PASSWORD=VotreMotDePasse
```

### Avec sortie HTML (nécessite k6-reporter)
```bash
k6 run k6/load.js --out json=k6/reports/load-raw.json
```

---

## Ordre recommandé

```
1. smoke.js    → valider que l'app répond
2. security.js → valider que les protections fonctionnent  
3. load.js     → simuler le jour de vote
4. stress.js   → trouver le point de rupture
5. spike.js    → tester la résistance aux pics
```

**Ne jamais lancer stress.js ou spike.js en production sans prévenir.** Ces tests peuvent déclencher le rate limiting sur les vraies adresses IP.

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
