# Backend Research: Skill Rating App — NestJS API

**Date:** 2026-03-24
**Status:** Complete
**Scope:** Full backend audit — entities, modules, services, controllers, auth system, configuration

---

## Research Topics

1. Data model — all entities, fields, relations, decorators
2. Module composition and dependency graph
3. Business logic per service
4. API surface — every route with method, path, guards, input, output
5. Auth system — JWT config, strategies, roles/permissions model
6. Bootstrap configuration (main.ts, seed.ts)
7. Dependencies (package.json)

---

## 1. Technology Stack

| Concern | Technology |
|---|---|
| Framework | NestJS 11 |
| ORM | TypeORM 0.3.27 |
| Database | SQLite (file: `db.sqlite`) |
| Auth | Passport.js — passport-local + passport-jwt |
| Password hashing | bcrypt 6 |
| Token format | JWT (HS256) |
| Language | TypeScript 5.7 |
| Port | 3000 (or `process.env.PORT`) |
| CORS | Enabled globally (all origins) |

---

## 2. Data Model

### 2.1 `User` entity

File: `backend/src/users/user.entity.ts`

**Enum `UserRole`:**
- `ADMIN = 'admin'`
- `MANAGER = 'manager'`
- `EMPLOYEE = 'employee'`

**Columns:**

| Field | Type / Decorator | Notes |
|---|---|---|
| `id` | `@PrimaryGeneratedColumn()` number | Auto-increment PK |
| `username` | `@Column({ unique: true })` string | Login identifier |
| `realName` | `@Column()` string | Display name |
| `email` | `@Column({ unique: true })` string | Unique email |
| `password` | `@Column()` string | bcrypt-hashed at creation |
| `role` | `@Column({ type: 'simple-enum', default: 'employee' })` UserRole | Role enum |

**Relations:**

| Relation | Decorator | Target | Notes |
|---|---|---|---|
| `manager` | `@ManyToOne(User)` | User (self-ref) | nullable, onDelete: SET NULL |
| `subordinates` | `@OneToMany(User)` | User (self-ref) | Inverse of manager |
| `currentRole` | `@ManyToOne(JobRole)` | JobRole | nullable |
| `targetRole` | `@ManyToOne(JobRole)` | JobRole | nullable |

**Note:** User has no explicit `@OneToMany` to `Rating`. Rating uses `onDelete: CASCADE` on its side, so deleting a user cascades rating deletions.

---

### 2.2 `Skill` entity

File: `backend/src/skills/skill.entity.ts`

**Columns:**

| Field | Type / Decorator | Notes |
|---|---|---|
| `id` | `@PrimaryGeneratedColumn()` number | Auto-increment PK |
| `name` | `@Column()` string | Skill name |
| `description` | `@Column({ nullable: true })` string | Optional description |
| `targetLevel` | `@Column({ type: 'integer', default: 0 })` number | Target proficiency 0–100 |
| `jobRoleId` | `@Column({ nullable: true })` number | Explicit FK column for query workaround |

**Relations:**

| Relation | Decorator | Target | Notes |
|---|---|---|---|
| `manager` | `@ManyToOne(User)` | User | NOT nullable — skills are owned by a manager |
| `jobRole` | `@ManyToOne(JobRole)` | JobRole | nullable — optional role scoping |

**Note:** Skills are manager-owned. An employee sees skills filtered by their manager + their `targetRole`.

---

### 2.3 `Rating` entity

File: `backend/src/ratings/rating.entity.ts`

**Columns:**

| Field | Type / Decorator | Notes |
|---|---|---|
| `id` | `@PrimaryGeneratedColumn()` number | Auto-increment PK |
| `selfRating` | `@Column({ type: 'int', nullable: true })` number | Employee self-assessment |
| `managerRating` | `@Column({ type: 'int', nullable: true })` number | Manager's rating; hidden until finalized |
| `targetRating` | `@Column({ type: 'int', nullable: true })` number | Target level set by manager/admin |
| `isFinalized` | `@Column({ default: false })` boolean | Controls visibility of managerRating |

**Relations:**

| Relation | Decorator | Target | Notes |
|---|---|---|---|
| `user` | `@ManyToOne(User)` | User | onDelete: CASCADE |
| `skill` | `@ManyToOne(Skill)` | Skill | onDelete: CASCADE |

**Business rule:** When `isFinalized = false`, the `managerRating` field is stripped from the response before being returned to the employee (`getRatingsForUser`).

---

### 2.4 `JobRole` entity

File: `backend/src/roles/job-role.entity.ts`

**Columns:**

| Field | Type / Decorator | Notes |
|---|---|---|
| `id` | `@PrimaryGeneratedColumn()` number | Auto-increment PK |
| `name` | `@Column({ unique: true })` string | Unique role name |

No relations defined on this entity (relations are on User and Skill pointing to it).

---

## 3. Module Composition

```
AppModule
├── TypeOrmModule (SQLite, entities: User, Skill, Rating, JobRole, synchronize: true)
├── AuthModule
│   ├── UsersModule (imported)
│   ├── PassportModule
│   ├── JwtModule (secret: 'secretKey', expiresIn: '60m')
│   ├── providers: AuthService, LocalStrategy, JwtStrategy
│   └── exports: AuthService
├── UsersModule
│   ├── TypeOrmModule.forFeature([User])
│   ├── providers: UsersService
│   ├── controllers: UsersController
│   └── exports: UsersService
├── SkillsModule
│   ├── TypeOrmModule.forFeature([Skill, User])
│   ├── providers: SkillsService
│   ├── controllers: SkillsController
│   └── exports: SkillsService
├── RatingsModule
│   ├── TypeOrmModule.forFeature([Rating])
│   ├── providers: RatingsService
│   └── controllers: RatingsController
└── JobRolesModule
    ├── TypeOrmModule.forFeature([JobRole])
    ├── providers: JobRolesService
    └── controllers: JobRolesController
```

---

## 4. Auth System

### 4.1 Constants

File: `backend/src/auth/constants.ts`

```ts
export const jwtConstants = { secret: 'secretKey' };
```

**Security gap:** Hardcoded secret. No environment variable fallback. In production this is a critical vulnerability.

---

### 4.2 Local Strategy

File: `backend/src/auth/local.strategy.ts`

- Uses `passport-local` (username + password fields)
- Calls `AuthService.validateUser(username, pass)`
- `validateUser` looks up user by username, then `bcrypt.compare` against stored hash
- Returns user object minus password on success; throws `UnauthorizedException` on failure

---

### 4.3 JWT Strategy

File: `backend/src/auth/jwt.strategy.ts`

- Extracts JWT from `Authorization: Bearer <token>` header
- Validates with `secretOrKey: jwtConstants.secret`
- `ignoreExpiration: false` (tokens expire after 60 min)
- Transforms payload to request user object:

```ts
{
  userId: payload.sub,
  username: payload.username,
  role: payload.role,
  realName: payload.realName,
  email: payload.email
}
```

---

### 4.4 JWT Payload (issued at login)

```ts
{
  username: user.username,
  sub: user.id,
  role: user.role,
  realName: user.realName,
  email: user.email
}
```

Token TTL: 60 minutes.

---

### 4.5 Roles System

File: `backend/src/auth/roles.decorator.ts`

```ts
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

File: `backend/src/auth/roles.guard.ts`

- `RolesGuard implements CanActivate`
- Reads `ROLES_KEY` metadata from handler or class
- If no roles metadata: access allowed
- Checks `user.role` (from JWT) against required roles using `Array.some()`
- Must be used after `AuthGuard('jwt')` since it depends on `req.user` being populated

**Guard combination pattern across all controllers:**
```ts
@UseGuards(AuthGuard('jwt'), RolesGuard)
```

---

## 5. API Endpoints

All controllers use `@UseGuards(AuthGuard('jwt'), RolesGuard)` at class level unless noted.

### 5.1 Auth Controller — `POST /auth/*`

| Method | Path | Guards | Input Body | Output |
|---|---|---|---|---|
| POST | `/auth/login` | LocalStrategy (`AuthGuard('local')`) | `{ username, password }` (form fields) | `{ access_token: string }` |
| POST | `/auth/register` | None | `{ username, password, role?, realName, email }` | Created `User` object |

**Note:** `/auth/register` is publicly accessible — no JWT guard. The `register` endpoint calls `UsersService.create()` directly, so it creates a user with any role including admin (no server-side restriction).

---

### 5.2 Users Controller — `GET|POST|PATCH /users/*`

Class-level guards: `AuthGuard('jwt')`, `RolesGuard`

| Method | Path | Roles Required | Input | Output |
|---|---|---|---|---|
| GET | `/users` | Any authenticated | — | `User[]` with relations: manager, currentRole, targetRole |
| POST | `/users` | ADMIN | `Partial<User>` body | Created `User` |
| GET | `/users/my-team` | MANAGER, ADMIN | — (uses JWT userId) | `User[]` (subordinates of current user) |
| PATCH | `/users/:id/assign-manager` | ADMIN | `{ managerId: number \| null }` | Updated `User` |
| PATCH | `/users/:id/roles` | MANAGER, ADMIN | `{ currentRoleId: number, targetRoleId: number }` | Updated `User` |
| PATCH | `/users/:id/details` | Any authenticated (self) or ADMIN | `{ realName: string, email: string }` | Updated `User` (password excluded) |
| PATCH | `/users/:id/password` | Any authenticated (self only) | `{ currentPass: string, newPass: string }` | void |
| PATCH | `/users/:id` | ADMIN | `Partial<User>` | Updated `User` |

**Notes:**
- `PATCH /users/:id/details` — enforces self-update via manual check in handler (`req.user.userId !== userId`). Throws generic `Error` (not `HttpException`) so NestJS returns 500 instead of 403.
- `PATCH /users/:id/password` — same self-only enforcement pattern, same error issue.
- `DELETE` users endpoint exists in `UsersService.delete()` but is **NOT exposed** via a controller route.
- `findAll` fetches all users regardless of role — any authenticated user can see all user data.

---

### 5.3 Skills Controller — `GET|POST|PATCH|DELETE /skills/*`

Class-level guards: `AuthGuard('jwt')`, `RolesGuard`

| Method | Path | Roles Required | Input | Output |
|---|---|---|---|---|
| POST | `/skills` | MANAGER, ADMIN | `{ skill: Partial<Skill>, jobRoleId?: number }` | Created `Skill` |
| GET | `/skills` | Any authenticated | Query: `?jobRoleId=<id>`, `?userId=<id>` | `Skill[]` (filtered by caller role/context) |
| GET | `/skills/:id` | Any authenticated | — | Single `Skill` |
| PATCH | `/skills/:id` | MANAGER, ADMIN | `Partial<Skill>` | Updated `Skill` |
| DELETE | `/skills/:id` | MANAGER, ADMIN | — | void |

**Skill retrieval logic (`GET /skills`):**
1. If requester is a **manager** AND `jobRoleId` query param is passed AND `userId` param is absent (targetUser defaults to self): calls `findAllForManager(managerId, jobRoleId)` — returns manager's skills optionally filtered by job role.
2. Otherwise: calls `findAllForUser(targetUserId, jobRoleId)`.
   - If target is an **employee** with a manager: returns manager's skills filtered by employee's `targetRole`.
   - If target is a **manager**: delegates to `findAllForManager`.

**Ownership:** Skills are owned per manager — CRUD operations verify `manager.id` matches requester's `userId`.

---

### 5.4 Ratings Controller — `GET|POST /ratings/*`

Class-level guards: `AuthGuard('jwt')`, `RolesGuard`

| Method | Path | Roles Required | Input | Output |
|---|---|---|---|---|
| POST | `/ratings/self` | Any authenticated | `{ skillId: number, rating: number }` | Created/updated `Rating` |
| POST | `/ratings/manager/:subordinateId` | MANAGER, ADMIN | `{ skillId: number, rating: number }` | Created/updated `Rating` |
| POST | `/ratings/target/:userId` | ADMIN, MANAGER | `{ skillId: number, rating: number }` | Created/updated `Rating` |
| POST | `/ratings/finalize/:subordinateId` | MANAGER, ADMIN | — | void |
| GET | `/ratings/finalized-users` | MANAGER, ADMIN | — | `number[]` (user IDs) |
| GET | `/ratings/my-ratings` | Any authenticated | — | `Rating[]` (managerRating hidden if not finalized) |
| GET | `/ratings/subordinate/:subordinateId` | MANAGER, ADMIN | — | `Rating[]` (all fields visible) |
| GET | `/ratings/:userId` | Any authenticated | — | `Rating[]` (managerRating hidden if not finalized) |

**Business rules:**
- `createOrUpdateSelfRating` / `createOrUpdateManagerRating` / `setTargetRating` use upsert logic (find existing by user+skill, update or create).
- `finalizeRatings` bulk-sets `isFinalized = true` for all ratings of a given subordinate.
- `getRatingsForUser` strips `managerRating` from responses where `isFinalized = false`.
- `getRatingsForManager` always returns all fields (manager can see their own ratings).
- **Gap:** `POST /ratings/ratings/manager/:subordinateId` does not verify the manager actually manages the subordinate — any MANAGER can rate any user.

---

### 5.5 Job Roles Controller — `GET|POST|DELETE /job-roles/*`

Class-level guards: `AuthGuard('jwt')`, `RolesGuard`

| Method | Path | Roles Required | Input | Output |
|---|---|---|---|---|
| POST | `/job-roles` | ADMIN | `name: string` (body field) | Created `JobRole` |
| GET | `/job-roles` | Any authenticated | — | `JobRole[]` |
| DELETE | `/job-roles/:id` | ADMIN | — | void |

---

## 6. Service Business Logic Summary

### UsersService

- `create` — hashes password via bcrypt before persisting
- `findAll` — eager-loads manager, currentRole, targetRole relations
- `findOne(username)` — used by auth strategy only
- `assignManager` — validates manager exists and has `role === 'manager'` (string comparison, not enum)
- `getTeamMembers` — finds users where `manager.id = managerId`
- `update` — general PATCH, also hashes password if included (not exposed via DELETE route)
- `delete` — first nullifies all subordinate `managerId` references, then removes user
- `assignRoles` — sets currentRole and targetRole by entity reference ID
- `updateDetails` — checks email uniqueness before update; returns user without password
- `updatePassword` — verifies current password via bcrypt before updating

### SkillsService

- `create` — associates skill with manager and optional jobRole
- `findAllForUser` — role-aware: employee sees manager's skills filtered by their targetRole; manager sees own skills
- `findAllForManager` — optional `jobRoleId` filter using QueryBuilder; handles `jobRoleId = null` (General Skills — no role)
- `findOne` — scoped to manager ownership
- `update` / `remove` — verifies ownership before mutating

### RatingsService

- All three create methods (self, manager, target) use upsert pattern
- `finalizeRatings` — bulk update via TypeORM `update()` with `where` clause
- `getRatingsForUser` — strips `managerRating` from non-finalized ratings (privacy enforcement)
- `getFinalizedUserIds` — returns deduplicated user ID list using `Set`

### AuthService

- `validateUser` — safe bcrypt compare; returns user without password on success
- `login` — signs JWT with username, sub (id), role, realName, email
- `register` — thin wrapper over `UsersService.create()`

### JobRolesService

- Simple CRUD — create (unique name), findAll, remove by ID

---

## 7. Bootstrap (main.ts & seed.ts)

### main.ts

```ts
app.enableCors();           // All origins allowed
app.listen(PORT ?? 3000);   // PORT from env or 3000
```

No global pipes, no global validation, no Swagger setup.

### seed.ts

Creates the following seed data:

**Users:**
- `admin` / role: ADMIN
- `manager1`, `manager2` / role: MANAGER
- `employee1` (assigned to manager1), `employee2` (assigned to manager2) / role: EMPLOYEE

**Skills (all without jobRole):**
- manager1: Angular (75), TypeScript (80), RxJS (70)
- manager2: NestJS (85), Node.js (80), PostgreSQL (75)

No ratings or job roles seeded. `jobRoleId` not set on any seed skill.

---

## 8. Key Security Observations

| Issue | Severity | Location |
|---|---|---|
| Hardcoded JWT secret (`'secretKey'`) | Critical | `auth/constants.ts` |
| `synchronize: true` in TypeORM config | High (prod) | `app.module.ts` |
| CORS unrestricted (`enableCors()`) | Medium | `main.ts` |
| `/auth/register` accepts any role including ADMIN | High | `auth.controller.ts` |
| Any MANAGER can rate any subordinate (no ownership check) | Medium | `ratings.service.ts` |
| `PATCH /users/:id/details` throws generic `Error` (500) instead of 403 | Low | `users.controller.ts` |
| No global `ValidationPipe` — no input validation/sanitization | High | `main.ts` |
| `DELETE /users/:id` not exposed (service exists, no route) | Info | `users.controller.ts` |
| `findAll` (users) returns all users to any authenticated user | Low | `users.service.ts` |

---

## 9. Dependencies Summary

**Runtime:**
- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` — ^11
- `@nestjs/jwt` ^11, `@nestjs/passport` ^11
- `@nestjs/typeorm` ^11
- `passport`, `passport-local`, `passport-jwt`
- `bcrypt` ^6
- `sqlite3` ^5.1.7
- `typeorm` ^0.3.27
- `rxjs` ^7.8.1, `reflect-metadata` ^0.2.2

**Dev:**
- `@nestjs/testing`, `jest` ^30, `ts-jest`, `supertest`
- `typescript` ^5.7, `ts-node`, `tsconfig-paths`
- `eslint` ^9 + `typescript-eslint`, `prettier`

---

## 10. Gaps and Outstanding Questions

1. **No DTOs / class-validator** — All endpoints accept raw `Partial<User>` / `any` bodies. No input validation enforced. A `ValidationPipe` with class-validator DTOs is missing entirely.
2. **No Swagger / OpenAPI setup** — API is undocumented programmatically.
3. **No DELETE user route** — `UsersService.delete()` is implemented but has no controller route (intentional or not?).
4. **No pagination** — All list endpoints return full result sets; could be a performance issue at scale.
5. **Manager rating ownership** — No verification that a manager manages the target subordinate when posting manager ratings.
6. **Register endpoint role escalation** — Any client can register an ADMIN account.
7. **JWT secret rotation** — No mechanism to handle secret rotation or revoke tokens.
8. **E2E tests** — `test/app.e2e-spec.ts` exists but its coverage scope is unknown (not read).
9. **`app.controller.ts` / `app.service.ts`** — Not yet read; likely minimal but may contain health check or root route.

---

## References

- `backend/src/app.module.ts`
- `backend/src/main.ts`
- `backend/src/seed.ts`
- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/auth.module.ts`
- `backend/src/auth/jwt.strategy.ts`
- `backend/src/auth/local.strategy.ts`
- `backend/src/auth/constants.ts`
- `backend/src/auth/roles.decorator.ts`
- `backend/src/auth/roles.guard.ts`
- `backend/src/users/user.entity.ts`
- `backend/src/users/users.module.ts`
- `backend/src/users/users.service.ts`
- `backend/src/users/users.controller.ts`
- `backend/src/skills/skill.entity.ts`
- `backend/src/skills/skills.module.ts`
- `backend/src/skills/skills.service.ts`
- `backend/src/skills/skills.controller.ts`
- `backend/src/ratings/rating.entity.ts`
- `backend/src/ratings/ratings.module.ts`
- `backend/src/ratings/ratings.service.ts`
- `backend/src/ratings/ratings.controller.ts`
- `backend/src/roles/job-role.entity.ts`
- `backend/src/roles/job-roles.module.ts`
- `backend/src/roles/job-roles.service.ts`
- `backend/src/roles/job-roles.controller.ts`
- `backend/package.json`
