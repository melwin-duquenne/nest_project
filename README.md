# TaskFlow API

API RESTful de gestion de projets et tâches (NestJS + PostgreSQL + Prisma + TypeORM).

---

## Prérequis

- [Node.js](https://nodejs.org/) >= 20
- [Docker](https://www.docker.com/) + Docker Compose
- `npm`

---

## 1. Installation

```bash
git clone <url-du-repo>
cd trello
npm install
```

---

## 2. Variables d'environnement

```bash
cp .env.example .env
```

Ouvrez `.env` et remplissez les deux champs obligatoires :

| Variable | Description |
|---|---|
| `DB_PASSWORD` | Mot de passe PostgreSQL |
| `JWT_SECRET` | Clé secrète JWT (voir section suivante) |

---

## 3. Générer la clé secrète JWT

Le projet utilise JWT avec une clé symétrique (HMAC-SHA256). Générez-en une forte :

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copiez le résultat dans `JWT_SECRET` de votre `.env`.

---

## 4. Base de données avec Docker

### Lancer uniquement PostgreSQL (développement local)

```bash
docker compose up -d
```

Cela démarre un conteneur PostgreSQL sur le port défini dans `.env` (`DB_PORT`, défaut : `5432`).

Pour arrêter :

```bash
docker compose down
```

Pour arrêter et supprimer les volumes (repart de zéro) :

```bash
docker compose down -v
```

---

## 5. Migrations TypeORM

Les migrations gèrent le schéma de la base de données.

```bash
# Appliquer toutes les migrations en attente
npm run migration:run

# Générer une nouvelle migration depuis les changements d'entités
npm run migration:generate src/database/migrations/NomDeLaMigration

# Annuler la dernière migration
npm run migration:revert

# Voir l'état des migrations
npm run migration:show
```

> Les migrations utilisent la connexion définie dans `src/database/data-source.ts` (variables `DB_*` du `.env`).

---

## 6. Prisma

Prisma est utilisé en parallèle de TypeORM pour certaines requêtes.

```bash
# Générer le client Prisma (à faire après chaque modification de schema.prisma)
npx prisma generate

# Appliquer le schéma Prisma à la base (dev uniquement — crée les tables si absentes)
npx prisma db push

# Ouvrir Prisma Studio (interface visuelle de la BDD)
npx prisma studio
```

> Prisma utilise `DATABASE_URL` depuis le `.env` (format : `postgresql://user:password@host:port/dbname`).

---

## 7. Données de test (seed)

Peuple la base avec des utilisateurs et données de démonstration :

```bash
npm run seed
```

---

## 8. Lancer l'application

```bash
# Développement avec rechargement automatique
npm run start:dev

# Développement sans rechargement
npm run start

# Production (nécessite un build préalable)
npm run build
npm run start:prod
```

L'API est accessible sur `http://localhost:3000/api`.
La documentation Swagger est disponible sur `http://localhost:3000/docs` (hors production).

---

## 9. Tests

### Tests unitaires

```bash
npm run test
```

### Tests unitaires avec couverture

```bash
npm run test:cov
```

### Tests end-to-end (e2e)

Les tests e2e utilisent une base de données dédiée (`taskflow_test`) avec les variables de `.env.test`.

```bash
# S'assurer que PostgreSQL tourne (docker compose up -d)
npm run test:e2e
```

### Mode watch (relance automatique à chaque modification)

```bash
npm run test:watch
```

---

## 10. Docker Compose — stack complète (production)

Lance l'API et PostgreSQL ensemble via le `Dockerfile` multi-stage :

```bash
# Créer le fichier d'environnement de production
cp .env.example .env.production
# Remplir .env.production avec les vraies valeurs

docker compose -f docker-compose.prod.yml up -d
```

Pour voir les logs :

```bash
docker compose -f docker-compose.prod.yml logs -f api
```

Pour arrêter :

```bash
docker compose -f docker-compose.prod.yml down
```

---

## Récapitulatif — démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env
# → Remplir DB_PASSWORD et JWT_SECRET dans .env

# 3. Démarrer PostgreSQL
docker compose up -d

# 4. Appliquer les migrations
npm run migration:run

# 5. Générer le client Prisma
npx prisma generate

# 6. (Optionnel) Insérer des données de test
npm run seed

# 7. Lancer l'API
npm run start:dev
```

API : `http://localhost:3000/api`
Swagger : `http://localhost:3000/docs`
