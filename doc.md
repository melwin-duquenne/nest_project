# Rapport technique — TaskFlow API

---

## Contexte

TaskFlow est une API REST de gestion de projets et de tâches, construite avec NestJS et TypeScript.
Elle couvre la gestion des utilisateurs, des équipes, des projets, des tâches et des commentaires, avec :

- Authentification JWT via Passport.js
- Autorisation par rôles (`admin`, `member`, `viewer`)
- Persistance PostgreSQL via TypeORM (principal) et Prisma (secondaire)
- Notifications temps réel via WebSocket (Socket.io)
- Documentation interactive Swagger
- Tests unitaires (Jest) et tests e2e (Supertest)
- CI GitHub Actions + Dockerfile multi-stage

---

## 1. Architecture générale

### Structure des modules

L'application suit l'architecture modulaire de NestJS : chaque domaine métier est encapsulé dans son propre module.

```
src/
├── auth/            → Authentification JWT + guards + stratégies Passport
├── users/           → CRUD utilisateurs + service Prisma alternatif
├── teams/           → CRUD équipes
├── projects/        → CRUD projets
├── tasks/           → CRUD tâches + intégration WebSocket
├── comments/        → CRUD commentaires
├── notifications/   → Gateway WebSocket Socket.io
├── health/          → Endpoint GET /api/health (vérification BDD)
├── prisma/          → Module PrismaService partagé
├── database/
│   ├── data-source.ts    → Configuration TypeORM pour les migrations CLI
│   ├── migrations/       → Fichiers de migration générés
│   └── seeds/            → Script de peuplement initial
└── common/
    ├── filters/     → GlobalExceptionFilter
    ├── interceptors/ → LoggingInterceptor
    └── helpers/     → createMockRepository (utilitaire de test)
```

Chaque module expose son service via `exports: []`, ce qui permet l'injection entre modules sans couplage direct. Par exemple, `NotificationsModule` exporte `NotificationsGateway` pour que `TasksService` puisse envoyer des événements WebSocket lors d'une assignation.

### Pipeline de la requête

Chaque requête HTTP traverse ces couches dans l'ordre :

```
Requête entrante
  → Helmet (headers de sécurité)
  → ValidationPipe global (validation + transformation des DTOs)
  → JwtAuthGuard global (vérification du token Bearer)
  → RolesGuard global (vérification du rôle si @Roles présent)
  → Contrôleur → Service → Repository
  → LoggingInterceptor (log de la réponse avec durée)
  → GlobalExceptionFilter (si exception non gérée)
```

---

## 2. Choix techniques

### Modèle de données et relations entre entités

Le schéma repose sur cinq entités principales :

```
User ──< team_members >── Team ──< Project ──< Task ──< Comment
                                                 └── assignee (User, nullable)
```

| Relation | Type | Comportement en cascade |
|---|---|---|
| User ↔ Team | Many-to-Many via `team_members` | — |
| Team → Project | One-to-Many | `CASCADE` (suppr. team = suppr. projets) |
| Project → Task | One-to-Many | `CASCADE` (suppr. projet = suppr. tâches) |
| Task → Assignee | Many-to-One nullable | `SET NULL` (suppr. user = assignee = null) |
| Task → Comment | One-to-Many | `CASCADE` |
| Comment → Author | Many-to-One | `CASCADE` |

Le choix de `SET NULL` sur l'assigné de tâche est délibéré : supprimer un utilisateur ne doit pas faire disparaître les tâches de l'historique du projet. À l'inverse, toutes les relations structurelles (team → project → task) sont en `CASCADE` pour maintenir la cohérence sans laisser d'enregistrements orphelins.

Les identifiants sont des UUID v4 générés automatiquement (`@PrimaryGeneratedColumn('uuid')`), ce qui évite les collisions en cas de distribution future et rend les IDs non-prédictibles par des tiers.

Les champs de statut et de priorité utilisent des types `ENUM` PostgreSQL natifs (au lieu de simples `VARCHAR`), ce qui garantit l'intégrité au niveau base de données.

**Double ORM — TypeORM + Prisma.** TypeORM est utilisé comme ORM principal pour toutes les opérations CRUD et pour les migrations. Prisma est configuré en parallèle sur le module `UsersPrismaService`, ce qui m'a permis de comparer concrètement les deux approches : la configuration déclarative de Prisma via `schema.prisma` versus les décorateurs TypeORM sur les classes d'entités.

### Stratégie d'authentification

L'authentification repose sur **Passport.js** avec deux stratégies enchaînées :

**1. LocalStrategy (`POST /api/auth/login`)**

Reçoit `email` + `password` en clair, appelle `AuthService.validateUser()` qui :
- Recherche l'utilisateur par email via une requête `QueryBuilder` avec `.addSelect('user.passwordHash')` — nécessaire car ce champ est marqué `select: false` sur l'entité, ce qui l'exclut de toutes les requêtes `find()` standard pour ne jamais l'exposer accidentellement dans une réponse.
- Compare le mot de passe en clair avec le hash bcrypt (coût 10) via `bcrypt.compare()`.
- Retourne `{ id, email, name, role }` sans jamais exposer le hash, ou `null` si les credentials sont invalides.

**2. JwtStrategy (toutes les routes protégées)**

Lit le token depuis le header `Authorization: Bearer <token>`, vérifie la signature HMAC-SHA256 avec `JWT_SECRET`, et rejette automatiquement les tokens expirés. Le payload décodé `{ sub, email, role }` est injecté dans `req.user` et accessible via le décorateur personnalisé `@CurrentUser()`.

Le token est émis par `AuthService.login()` avec `jwtService.sign(payload)`. La durée de validité est configurable via `JWT_EXPIRES_IN` (défaut : `1h`).

### Autorisation par rôles

Trois rôles sont définis : `admin`, `member`, `viewer`.

L'autorisation est implémentée avec deux guards appliqués **globalement** dans `AppModule` :

- **JwtAuthGuard** : vérifie le token sur toutes les routes. Les routes publiques (comme `POST /api/auth/login` ou `GET /api/health`) sont exemptées grâce au décorateur `@Public()`, qui pose une métadonnée lue par le guard.
- **RolesGuard** : lit les métadonnées posées par `@Roles(UserRole.ADMIN)` via le `Reflector` NestJS. Si aucun `@Roles()` n'est présent sur la route, tout utilisateur authentifié est autorisé. Sinon, le rôle extrait du token doit figurer dans la liste.

Cette approche "global guard + opt-in public" est plus sûre que l'inverse ("tout public + opt-in protégé") : une nouvelle route est protégée par défaut, même si on oublie d'ajouter le guard.

### Notifications temps réel (WebSocket)

Le module `NotificationsGateway` expose un namespace Socket.io sur `/notifications`.

À la connexion, le gateway vérifie le token JWT transmis dans `handshake.auth.token` (ou le header `Authorization`). Si le token est invalide ou absent, le client est immédiatement déconnecté. Si valide, le client rejoint sa room privée `user:<id>`.

Deux mécanismes de diffusion sont disponibles :

- `sendToUser(userId, event, data)` — notification individuelle dans la room `user:<id>`
- `sendToProject(projectId, event, data)` — broadcast à tous les membres connectés d'un projet

Le déclencheur principal est dans `TasksService.update()` : quand l'assigné d'une tâche change, une notification `task:assigned` est envoyée en temps réel à l'utilisateur nouvellement assigné, sans aucune action de sa part.

Les clients peuvent aussi s'abonner explicitement aux événements d'un projet via l'événement `join:project`.

### Validation et sécurité des entrées

Le `ValidationPipe` global est configuré avec :

- `whitelist: true` — supprime silencieusement tout champ non déclaré dans le DTO
- `forbidNonWhitelisted: true` — renvoie une erreur 400 si un champ inconnu est envoyé
- `transform: true` — convertit automatiquement les types (ex : query string `"5"` → nombre `5`)
- `enableImplicitConversion: true` — conversions implicites pour les types primitifs

Cela signifie que les DTOs servent de contrat strict : aucun champ inattendu ne peut traverser vers le service, ce qui évite des injections ou des modifications non autorisées de champs sensibles comme `role`.

**Helmet** est appliqué globalement et ajoute automatiquement les headers HTTP de sécurité : `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, etc.

### Gestion des erreurs

Le `GlobalExceptionFilter` intercepte toutes les exceptions non gérées et produit une réponse JSON uniforme :

```json
{
  "statusCode": 404,
  "timestamp": "2026-04-28T10:00:00.000Z",
  "path": "/api/tasks/uuid-inexistant",
  "message": "Task #uuid-inexistant not found"
}
```

Il gère trois cas :
- **`HttpException`** (NestJS standard) : extrait le status et le message, y compris les tableaux de messages de validation de `class-validator`.
- **`QueryFailedError`** (TypeORM) : détecte le code PostgreSQL `23505` (violation de contrainte unique) et retourne un 409 Conflict lisible, plutôt qu'une stack trace brute.
- **Toute autre erreur** : log en `ERROR` avec la stack trace, retourne un 500 générique sans exposer les détails internes.

### Observabilité

Le `LoggingInterceptor` est appliqué globalement via `app.useGlobalInterceptors()`. Il logue chaque requête HTTP avec : méthode, URL, code de statut et durée en millisecondes.

```
[HTTP] GET /api/tasks 200 [42ms]
[HTTP] POST /api/auth/login ERROR Unauthorized [8ms]
```

Le `HealthModule` expose `GET /api/health` (route `@Public()`) qui interroge la base de données via `TypeOrmHealthIndicator` et retourne `{ status: 'ok' }` si elle répond, ou `503 Service Unavailable` sinon. C'est cet endpoint qui est utilisé par le healthcheck Docker.

### Organisation des tests

**Tests unitaires (`*.spec.ts`)** — isolent la logique métier sans base de données :

- `UsersService` : couvre `findAll`, `findOne`, `create` (vérification doublon email, hash bcrypt), `remove`. Les repositories TypeORM sont remplacés par des mocks créés avec `createMockRepository` (helper interne qui génère un objet avec toutes les méthodes Jest mockées). `bcrypt` est mocké au niveau module (`jest.mock`) car c'est une extension native C++ qui ne peut pas être espionnée avec `jest.spyOn`.
- `RolesGuard` : vérifie les quatre cas — pas de `@Roles()`, rôle correspondant, rôle insuffisant, liste multi-rôles.

**Tests e2e (`test/*.e2e-spec.ts`)** — font tourner l'application complète :

- Une base `taskflow_test` est recréée depuis zéro à chaque lancement (`dropSchema: true` + `synchronize: true` en mode test).
- Un helper `seedTestUsers` insère des données prévisibles avant chaque test (`beforeEach`), garantissant l'isolation totale entre les cas.
- `auth.e2e-spec.ts` : login valide → token, mauvais mot de passe → 401, email inconnu → 401, `GET /api/auth/me` avec/sans token.
- `users.e2e-spec.ts` : CRUD utilisateurs avec vérification des permissions par rôle.

### Infrastructure

**Dockerfile multi-stage** : l'image de build (`builder`) installe toutes les dépendances et compile TypeScript. L'image de production (`runner`) ne contient que les `dependencies` (pas les `devDependencies`) et le dossier `dist/`. L'application tourne avec un utilisateur non-root (`appuser`) créé dans le Dockerfile, limitant les droits en cas de compromission.

**Docker Compose** : deux fichiers séparés — `docker-compose.yml` pour le développement (PostgreSQL seul, volumes persistants) et `docker-compose.prod.yml` pour la production (PostgreSQL + API dans le même réseau Docker `taskflow_net`).

**CI GitHub Actions** : pipeline déclenché sur `push` vers `main` et `develop`, avec trois étapes séquentielles :
1. Lint ESLint
2. Tests unitaires avec couverture
3. Tests e2e (contre un conteneur PostgreSQL éphémère)
4. Build Docker (sur `main` uniquement)

**Seed** : un script `src/database/seeds/seed.ts` peuple la base avec des données cohérentes — 3 utilisateurs (alice/admin, bob/member, charlie/viewer), 2 équipes, 2 projets, 3 tâches avec statuts et priorités variés, 2 commentaires — utile pour démontrer l'API sans partir de zéro.

---

## 3. Difficultés rencontrées

**Double ORM TypeORM + Prisma.** Faire cohabiter les deux ORMs sur le même projet a requis de maintenir deux sources de vérité du schéma : les entités TypeORM avec leurs décorateurs, et `prisma/schema.prisma`. La moindre divergence entre les deux casse les migrations ou le client Prisma généré. J'ai résolu cela en faisant de TypeORM la source principale pour les migrations et en utilisant Prisma uniquement en lecture sur quelques endpoints, les deux étant branchés sur la même base PostgreSQL.

**Authentification WebSocket.** Le protocole HTTP upgrade des WebSockets ne supporte pas le header `Authorization` standard. Il a fallu accepter le token JWT depuis deux sources : `handshake.auth.token` (mécanisme Socket.io) ET le header `Authorization` de la requête d'upgrade, pour rester compatible avec différents clients.

---

## 4. Ce que j'améliorerais avec plus de temps

**Choisir un seul ORM.** La cohabitation TypeORM + Prisma complexifie la maintenance sans apport réel en production. J'unifierais l'ensemble sur Prisma, qui offre une meilleure expérience développeur (types inférés automatiquement, Prisma Studio pour visualiser la BDD), une migration plus sûre et une sécurité de typage stricte sur les résultats de requête.

**Refresh tokens.** Le système actuel émet un token d'accès à durée fixe sans mécanisme de renouvellement. J'ajouterais un `refresh_token` opaque à longue durée de vie, stocké hashé en base avec la date d'expiration et un flag de révocation. Une route `POST /api/auth/refresh` permettrait d'obtenir un nouveau token d'accès sans ressaisir les credentials.

**Pagination sur toutes les listes.** Les endpoints `GET /api/tasks`, `GET /api/users`, etc., retournent actuellement l'intégralité des enregistrements. Sur un vrai volume de données c'est problématique. J'implémenterais une pagination offset avec `{ data: T[], total: number, page: number, limit: number }` ou une pagination cursor-based pour les flux temps réel.

**Couverture de tests plus large.** Seuls `UsersService` et `RolesGuard` ont des tests unitaires. J'étendrais la couverture à tous les services (`TasksService`, `ProjectsService`, `TeamsService`, `CommentsService`, `AuthService`) et j'ajouterais des tests e2e pour les modules projets, tâches et notifications, y compris les scénarios de permissions (un `viewer` ne peut pas créer un projet).

**Retirer les `console.log` de debug.** Quelques logs de debug ajoutés pendant le développement de l'authentification sont restés dans `AuthService.validateUser()`. En production ils exposeraient des informations sur les utilisateurs dans les logs. Ils doivent être remplacés par le `Logger` NestJS avec un niveau `debug` désactivé en production.

**Rate limiting.** L'endpoint `POST /api/auth/login` n'a aucune protection contre les attaques par force brute. J'ajouterais `@nestjs/throttler` pour limiter le nombre de tentatives par IP (ex : 5 requêtes / minute sur les routes d'auth).

**Autorisation fine sur les ressources.** Actuellement les rôles sont globaux : un `admin` peut tout faire sur toutes les équipes. Une vraie gestion multi-tenant nécessiterait de vérifier que l'utilisateur est bien membre de l'équipe propriétaire du projet avant d'autoriser l'accès, en plus du rôle.
