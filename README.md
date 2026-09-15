# CTS Vote — Plateforme électorale du Cyber Tech Squad

> Application web de vote électronique développée pour les élections internes du **Cyber Tech Squad (CTS)**, club de cybersécurité de l'Université Alioune Diop de Bambey (UADB).

---

## Présentation

Le **Cyber Tech Squad** est un club étudiant spécialisé en cybersécurité à l'UADB. Cette plateforme permet d'organiser les élections du bureau du club de manière sécurisée, transparente et anonyme. Elle couvre l'ensemble du processus électoral : inscription des électeurs, dépôt de candidatures, vote en ligne et publication des résultats.

### Fonctionnalités principales

| Rôle | Fonctionnalités |
|---|---|
| **Électeur** | Créer un compte (email @uadb.edu.sn requis), se connecter, voter pour les candidats de son choix, déposer une candidature, consulter ses reçus de vote |
| **Administrateur** | Gérer les scrutins (créer, activer, clôturer), valider/refuser les candidatures, gérer les électeurs (statut, réinitialisation mdp), consulter les résultats en temps réel, exporter les résultats en PDF |

### Caractéristiques de sécurité

- Authentification par **JWT** (access token + refresh token 30 jours)
- Votes **anonymisés** via HMAC-SHA256 (jamais d'identifiant en clair dans la table `votes`)
- Inscription réservée aux adresses **@uadb.edu.sn**
- Protection anti-abus : fingerprinting navigateur (FingerprintJS), rate limiting par IP et par utilisateur
- Middleware de rôles (`admin` / `electeur`) côté serveur — jamais de confiance côté client
- Détection de double vote par contrainte d'unicité en base **et** vérification applicative
- Headers HTTP de sécurité (HSTS, X-Frame-Options, X-Content-Type-Options, etc.)

---

## Architecture technique

```
cts_renewal/
├── cts-backend/      Laravel 13 (PHP 8.3) — API REST
└── cts-frontend/     React 19 + Vite + Tailwind CSS v4
```

### Stack Backend (`cts-backend`)

| Technologie | Rôle |
|---|---|
| **Laravel 13** | Framework PHP — routing, middleware, validation |
| **JWT** (`php-open-source-saver/jwt-auth`) | Authentification stateless |
| **PostgreSQL** (Supabase/Render) | Base de données production |
| **SQLite** | Base de données développement local |
| **Cloudinary** | Stockage et optimisation des photos de candidats |
| **DomPDF** | Export PDF des résultats |
| **Docker + Nginx + PHP-FPM** | Conteneurisation pour Render |

### Stack Frontend (`cts-frontend`)

| Technologie | Rôle |
|---|---|
| **React 19** | Interface utilisateur |
| **Vite 6** | Build tool et dev server |
| **Tailwind CSS v4 + DaisyUI** | Styles |
| **React Router v7** | Navigation SPA |
| **Axios** | Requêtes HTTP |
| **Chart.js + react-chartjs-2** | Graphiques résultats |
| **FingerprintJS** | Empreinte navigateur (anti-abus inscription) |
| **Framer Motion** | Animations |

### Déploiement

| Service | Plateforme |
|---|---|
| Backend | [Render](https://render.com) — conteneur Docker |
| Frontend | [Vercel](https://vercel.com) — déploiement statique |
| Base de données | [Supabase](https://supabase.com) — PostgreSQL managé |
| Stockage photos | [Cloudinary](https://cloudinary.com) |

---

## Installation locale

### Prérequis

- PHP 8.3+ avec extensions : `mbstring`, `pdo_sqlite`, `intl`, `openssl`, `zip`, `gd`
- Composer 2+
- Node.js 20+ et npm
- Git

### Backend

```bash
cd cts-backend

# Installer les dépendances
composer install

# Copier et configurer l'environnement
cp .env.example .env

# Renseigner dans .env :
# APP_KEY (générer : php artisan key:generate)
# JWT_SECRET (générer : php -r "echo bin2hex(random_bytes(32));")
# VOTE_HASH_KEY (générer : php -r "echo bin2hex(random_bytes(32));")
# ADMIN_LOCAL_EMAIL et ADMIN_LOCAL_PASSWORD

# Générer la clé
php artisan key:generate

# Migrer la base
php artisan migrate

# Lancer le serveur
php artisan serve
```

### Frontend

```bash
cd cts-frontend

# Installer les dépendances
npm install

# Copier et configurer l'environnement
cp .env.example .env
# Renseigner VITE_API_URL=http://localhost:8000/api

# Lancer le dev server
npm run dev
```

L'application est accessible sur `http://localhost:5173`.

---

## Variables d'environnement

### Backend (`.env`)

| Variable | Description | Obligatoire |
|---|---|---|
| `APP_KEY` | Clé de chiffrement Laravel | ✅ |
| `APP_ENV` | `local` ou `production` | ✅ |
| `APP_DEBUG` | `true` en local, `false` en prod | ✅ |
| `DB_CONNECTION` | `sqlite` (local) ou `pgsql` (prod) | ✅ |
| `DATABASE_URL` | URL PostgreSQL complète (prod) | Prod |
| `JWT_SECRET` | Clé secrète JWT | ✅ |
| `VOTE_HASH_KEY` | Clé HMAC dédiée à l'anonymisation des votes | ✅ |
| `FRONTEND_URL` | URL du frontend Vercel (CORS) | Prod |
| `CLOUDINARY_URL` | URL Cloudinary `cloudinary://key:secret@cloud` | Prod |
| `CLOUDINARY_FOLDER` | Dossier Cloudinary (`cts/candidates`) | Prod |
| `CTS_ADMIN_EMAIL` | Email du compte admin initial (prod) | Prod |
| `CTS_ADMIN_PASSWORD` | Mot de passe admin initial (prod, min 12 car.) | Prod |
| `ADMIN_LOCAL_EMAIL` | Email admin local (dev) | Dev |
| `ADMIN_LOCAL_PASSWORD` | Mot de passe admin local (dev) | Dev |

### Frontend (`.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | URL de l'API backend (ex: `https://cts-backend-1.onrender.com/api`) |

---

## Structure de la base de données

```
users          — Électeurs et administrateurs
positions      — Postes à élire (scrutins)
candidates     — Candidatures soumises par les électeurs
votes          — Bulletins de vote anonymisés (hash_session = HMAC de l'id électeur)
cache          — Cache Laravel partagé (rate limiting, résultats)
```

### Règle d'anonymisation

Le vote ne stocke **jamais** l'identifiant ou l'email de l'électeur. Un hash HMAC-SHA256 est calculé à partir de l'ID utilisateur avec une clé dédiée (`VOTE_HASH_KEY`) et stocké dans `votes.hash_session`. Même les administrateurs ne peuvent pas relier un vote à un électeur.

---

## Endpoints API principaux

### Publics
| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/register` | Inscription électeur |
| `POST` | `/api/login` | Connexion |
| `GET` | `/api/positions` | Liste des scrutins |
| `GET` | `/api/candidates` | Liste des candidats |
| `GET` | `/api/votes/results` | Résultats publics |
| `GET` | `/api/votes/results/all` | Résultats complets |
| `GET` | `/api/health` | Health check |

### Électeur (JWT requis)
| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/votes` | Voter (scrutin unique) |
| `POST` | `/api/votes/batch` | Voter (multi-scrutins) |
| `GET` | `/api/votes/my` | Historique de mes votes |
| `POST` | `/api/apply` | Soumettre une candidature |

### Admin (JWT + rôle admin)
| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/admin/stats-globales` | Statistiques dashboard |
| `POST` | `/api/positions` | Créer un scrutin |
| `PUT` | `/api/positions/:id` | Modifier / activer / clôturer |
| `GET` | `/api/users` | Liste des électeurs |
| `PUT` | `/api/users/:id/status` | Suspendre / réactiver |
| `PUT` | `/api/candidates/:id/approve` | Valider une candidature |
| `PUT` | `/api/candidates/:id/reject` | Refuser une candidature |

---

## Équipe

**Cyber Tech Squad — UADB Bambey**

Projet développé dans le cadre du renouvellement du bureau du club CTS.

---

## Licence

Usage interne — Cyber Tech Squad · UADB Bambey · 2026
