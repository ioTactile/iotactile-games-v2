# IoTactile Games

Plateforme de jeux multijoueurs en ligne, conçue pour l’auto-hébergement.  
Le cœur actuel est un **jeu de dés temps réel** (sessions, invités, WebSocket) ; d’autres jeux (ex. démineur) coexistent dans le même monorepo.

---

## Fonctionnalités

- **Authentification** — inscription / connexion, JWT (access + refresh), cookies sécurisés
- **Mode invité** — rejoindre une partie sans compte
- **Jeu de dés** — sessions publiques ou privées (code), tours, scores, diffusion WebSocket
- **Liste des parties** — sessions publiques en attente, avec cache Redis
- **i18n** — interface FR / EN côté application
- **Déploiement Docker** — stack complète via Compose (dev et prod)

---

## Stack

| Couche | Technologies |
|--------|----------------|
| **API** | Fastify 5, TypeScript (ESM), Zod, Prisma 7, PostgreSQL, Redis, Vitest, Biome |
| **App** | Next.js 16 (App Router), React 19, Tailwind CSS 4, TanStack Query, Zustand, Vitest |
| **Infra** | Docker Compose, PostgreSQL 16, Redis 7 |

**Architecture API** : Clean Architecture + DDD (domain → application → adapters), ports hexagonaux (`Result<T, E>`), repositories domaine, adapters Prisma / JWT / bcrypt / Redis / WebSocket.

---

## Prérequis

- [Docker](https://docs.docker.com/get-docker/) et Docker Compose
- [Node.js](https://nodejs.org/) **≥ 22** et [pnpm](https://pnpm.io/) (développement local hors Docker)
- Un fichier `.env` à la racine (modèle fourni)

---

## Démarrage rapide

### 1. Configuration

```bash
cp .env.example .env
```

En production, remplacer au minimum `POSTGRES_PASSWORD`, `COOKIE_SECRET` et `JWT_SECRET` par des valeurs fortes et uniques.

### 2. Production (API + frontend + Postgres + Redis)

```bash
pnpm docker:prod
# équivalent : docker compose -f docker-compose.prod.yml up -d --build
```

| Service   | URL |
|-----------|-----|
| Frontend  | http://localhost:3001 |
| API       | http://localhost:3000 |

Arrêt :

```bash
pnpm docker:prod:down
```

### 3. Développement (Postgres + Redis + API hot-reload)

```bash
pnpm docker:dev
# équivalent : docker compose -f docker-compose.dev.yml up -d --build
```

L’API est disponible sur http://localhost:3000.  
Lancer le frontend à part :

```bash
cd app && pnpm install && pnpm dev
```

Par défaut Next.js écoute sur http://localhost:3000 ; si l’API occupe déjà ce port, utilisez par exemple `pnpm dev -- -p 3001` et alignez `BASE_URL_APP` / `NEXT_PUBLIC_API_URL` dans `.env`.

---

## Développement local (sans Docker pour l’API / l’app)

Les services **PostgreSQL** et **Redis** restent nécessaires (Compose dev ou instances locales).

```bash
# Dépendances racine (Husky) + packages
pnpm install
cd api && pnpm install
cd ../app && pnpm install

# Migrations & client Prisma
cd ../api
pnpm db:migrate:deploy   # ou pnpm db:migrate en local
pnpm db:generate

# API
pnpm dev

# Frontend (autre terminal)
cd ../app && pnpm dev
```

Le fichier `.env` à la **racine du monorepo** est partagé par l’API et l’app.

---

## Variables d’environnement

| Variable | Rôle |
|----------|------|
| `POSTGRES_*` | Identifiants PostgreSQL |
| `DATABASE_URL` | Connexion Prisma (souvent injectée par Compose) |
| `BASE_URL_API` / `BASE_URL_APP` | Origines CORS / cookies (vues par le navigateur) |
| `NEXT_PUBLIC_API_URL` | URL de l’API côté client (fixée au **build** Next.js) |
| `COOKIE_SECRET` / `JWT_SECRET` | Secrets crypto (obligatoires en prod) |
| `JWT_ACCESS_TTL_SECONDS` / `JWT_REFRESH_TTL_SECONDS` | Durées de vie des tokens |
| `REDIS_URL` | Cache (sessions publiques dés) |
| `DICE_PUBLIC_SESSIONS_CACHE_TTL_SECONDS` | TTL du cache liste publique |

Référence complète : [`.env.example`](.env.example).

---

## Structure du dépôt

```
.
├── api/                 # Backend Fastify (Clean Architecture)
│   ├── prisma/          # Schéma & migrations
│   ├── src/
│   │   ├── domain/      # Entités, VO, interfaces repositories
│   │   ├── application/ # Use cases (command / query) & ports
│   │   ├── adapters/    # HTTP, Prisma, JWT, Redis, realtime
│   │   └── pkg/         # Config, logger, cache, sécurité
│   └── tests/           # Tests unitaires Vitest
├── app/                 # Frontend Next.js
│   └── src/
│       ├── app/         # Pages (App Router)
│       ├── components/  # UI (dés, démineur, formulaires…)
│       ├── hooks/       # Auth, WebSocket dés, etc.
│       └── lib/         # Clients API, utilitaires
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── DEPLOY.md            # Guide de déploiement détaillé
└── .env.example
```

---

## Scripts principaux

### Racine

| Commande | Description |
|----------|-------------|
| `pnpm docker:dev` | Stack dev (Postgres, Redis, API) |
| `pnpm docker:dev:down` | Arrêt stack dev |
| `pnpm docker:prod` | Stack prod complète |
| `pnpm docker:prod:down` | Arrêt stack prod |
| `pnpm docker:prod:delete` | Arrêt prod + volumes |
| `pnpm audit` | Audit sécurité (api + app) |

### API (`api/`)

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Serveur avec rechargement |
| `pnpm check` | Biome + typecheck |
| `pnpm test` | Tests Vitest |
| `pnpm test:coverage` | Couverture |
| `pnpm db:migrate` / `db:migrate:deploy` | Migrations Prisma |
| `pnpm db:studio` | Prisma Studio |

### App (`app/`)

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Next.js en développement |
| `pnpm build` / `pnpm start` | Build & serveur de production |
| `pnpm lint` | ESLint |
| `pnpm test` | Tests Vitest |

---

## Tests

La politique du projet : **toute évolution de logique métier s’accompagne de tests** (création ou mise à jour).

- **API** : use cases, schemas Zod, adapters (JWT, bcrypt, cache Redis, broadcaster…), domaine (`diceInputs`), utilitaires — `api/tests/`
- **App** : lib, hooks, composants — fichiers `*.test.ts(x)` colocalisés

```bash
cd api && pnpm test
cd app && pnpm test
```

---

## Déploiement

Pour le déploiement sur VPS, tunnels (Cloudflare / ngrok), reverse proxy, Dokploy et la configuration HTTPS / domaines, voir **[DEPLOY.md](DEPLOY.md)**.

Rappel : après modification de `NEXT_PUBLIC_API_URL`, **reconstruire** l’image frontend (`docker compose -f docker-compose.prod.yml build --no-cache app`).

---

## Licence

MIT — © ioTactile Games
