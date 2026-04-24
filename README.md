# VSN-CI Mobile Money

Plateforme de gestion Mobile Money pour VSN-CI — solution complète de gestion d'agences, agents, transactions et finances.

---

## Stack Technique

| Couche | Technologie |
|--------|-------------|
| **Frontend** | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| **UI** | shadcn/ui + Recharts + Lucide React |
| **State** | Zustand + TanStack Query |
| **Backend** | NestJS + TypeScript |
| **Base de données** | PostgreSQL + Prisma ORM |
| **Cache / OTP** | Redis + ioredis |
| **Auth** | JWT (Access + Refresh) + OTP SMS |
| **Infrastructure** | Docker + Docker Compose |

---

## Structure du Projet

```
vsn-ci-mobile-money/
├── backend/                  # API NestJS
│   ├── prisma/
│   │   ├── schema.prisma     # Schéma base de données
│   │   └── seed.ts           # Données de départ
│   ├── src/
│   │   ├── auth/             # Authentification JWT + OTP
│   │   ├── agences/          # Gestion des agences
│   │   ├── agents/           # Gestion des agents
│   │   ├── transactions/     # Transactions Mobile Money
│   │   ├── finance/          # Gestion des dépenses
│   │   ├── rh/               # Ressources humaines
│   │   ├── reseaux/          # Opérateurs (Wave, MTN, Orange...)
│   │   ├── dashboard/        # Statistiques & KPIs
│   │   ├── prisma/           # Service Prisma global
│   │   └── redis/            # Service Redis global
│   └── Dockerfile
├── frontend/                 # App Next.js 14
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/       # Login, OTP
│   │   │   └── (dashboard)/  # Dashboard, Agences, Agents...
│   │   ├── components/       # Composants réutilisables
│   │   ├── lib/              # axios, utils
│   │   ├── store/            # Zustand (auth)
│   │   └── types/            # TypeScript types
│   └── Dockerfile
├── docker-compose.yml
└── .env
```

---

## Démarrage Rapide

### Prérequis
- Docker & Docker Compose
- Node.js 20+

### 1. Cloner et configurer
```bash
cp .env.example .env
# Modifier les valeurs dans .env si nécessaire
```

### 2. Lancer avec Docker
```bash
docker-compose up -d
```

### 3. Initialiser la base de données
```bash
# Depuis le container backend
docker-compose exec backend npx prisma migrate dev
docker-compose exec backend npx ts-node prisma/seed.ts
```

### 4. Accès
| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **API Backend** | http://localhost:3001/api |
| **Swagger Docs** | http://localhost:3001/api/docs |
| **Prisma Studio** | `npx prisma studio` |

---

## Développement Local (sans Docker)

### Backend
```bash
cd backend
npm install
cp ../.env .env
# Modifier DATABASE_URL et REDIS_URL pour pointer vers localhost
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
# .env.local est déjà configuré
npm run dev
```

---

## Comptes de Test (après seed)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Super Admin | superadmin@vsn-ci.com | Admin@2024 |
| Admin Agence | admin.plateau@vsn-ci.com | Admin@2024 |
| Agent | agent1@vsn-ci.com | Agent@2024 |

---

## Fonctionnalités

### 🔐 Authentification
- Connexion email/mot de passe
- Vérification OTP par SMS (Africa's Talking)
- JWT Access Token (7j) + Refresh Token (30j)
- Gestion des rôles : Super Admin, Admin Agence, Agent, Caissier

### 🏢 Gestion des Agences
- CRUD complet des agences
- Approvisionnement de solde
- Statistiques par agence

### 👤 Gestion des Agents
- Création avec matricule automatique (AGT-AAAA-XXXX)
- Affectation aux agences
- Suivi des soldes et performances

### 💸 Transactions
- Dépôt, Retrait, Transfert, Paiement, Rechargement
- Calcul automatique des frais (2%, min 50 XOF)
- Validation manuelle pour les montants > 500 000 XOF
- Journal des transactions avec filtres avancés

### 📊 Dashboard
- KPIs en temps réel
- Graphique d'évolution 7 jours
- Top 5 agences par volume
- Répartition par réseau (Wave, MTN, Orange, Moov)

### 💼 Finance
- Gestion des dépenses par agence
- Workflow : En attente → Approuvée → Payée
- Résumé financier mensuel

### 👥 RH
- Gestion des utilisateurs et rôles
- Suspension/activation de comptes
- Reset de mots de passe

### 📡 Réseaux
- Gestion des opérateurs Mobile Money
- Suivi des soldes par réseau

---

## Variables d'Environnement

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL PostgreSQL |
| `REDIS_URL` | URL Redis |
| `JWT_SECRET` | Clé secrète JWT |
| `JWT_REFRESH_SECRET` | Clé refresh JWT |
| `AT_API_KEY` | Clé Africa's Talking (SMS OTP) |
| `AT_USERNAME` | Username Africa's Talking |
| `NEXT_PUBLIC_API_URL` | URL de l'API (frontend) |

---

## API Endpoints Principaux

```
POST   /api/auth/login              Connexion
POST   /api/auth/verify-otp         Vérification OTP
GET    /api/auth/me                 Profil connecté

GET    /api/agences                 Liste agences
POST   /api/agences                 Créer agence
POST   /api/agences/:id/approvisionner  Approvisionner

GET    /api/agents                  Liste agents
POST   /api/agents                  Créer agent

GET    /api/transactions            Liste transactions
POST   /api/transactions            Nouvelle transaction
GET    /api/transactions/stats      Statistiques

GET    /api/dashboard/overview      Vue d'ensemble
GET    /api/finance/depenses        Dépenses
GET    /api/rh/users                Utilisateurs RH
GET    /api/reseaux                 Réseaux mobiles
```

> Documentation Swagger complète : http://localhost:3001/api/docs
