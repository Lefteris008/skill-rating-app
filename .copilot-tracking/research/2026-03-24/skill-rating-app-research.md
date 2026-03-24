<!-- markdownlint-disable-file -->
# Task Research: Skill Rating App Analysis

A full-stack skill rating application for organizations, supporting employee self-assessment and manager evaluation workflows. Built with **NestJS** (backend) and **Angular 21** (frontend), using SQLite via TypeORM.

## Task Implementation Requests

* Analyze the repository structure, architecture, and key design decisions
* Document the backend API (NestJS/TypeORM) modules, entities, and endpoints
* Document the frontend (Angular) components, services, and routing
* Identify strengths, weaknesses, and potential improvements

## Scope and Success Criteria

* Scope: Full-stack skill rating application — backend (NestJS) and frontend (Angular)
* Assumptions: The app is intended for organizations to rate employee skills across roles
* Success Criteria:
  * Full module and entity inventory for the backend
  * Full component, service, and routing inventory for the frontend
  * Authentication and authorization flow documented
  * Data model relationships captured
  * Key architectural observations noted

## Outline

1. Project Overview
2. Backend Architecture (NestJS)
3. Frontend Architecture (Angular)
4. Authentication & Authorization
5. Data Model
6. API Endpoints
7. Key Discoveries
8. Security Observations
9. Gaps and Recommended Improvements

---

## Research Executed

### File Analysis

**Backend:**
* backend/src/users/user.entity.ts — User entity with self-referential manager hierarchy and role FKs
* backend/src/skills/skill.entity.ts — Skill entity with manager ownership and job-role scoping
* backend/src/ratings/rating.entity.ts — Rating entity with three rating fields and finalization gate
* backend/src/roles/job-role.entity.ts — Simple name-keyed lookup table
* backend/src/auth/* — Full JWT + Local strategy, RolesGuard, roles decorator
* backend/src/ratings/ratings.controller.ts + ratings.service.ts — Rating CRUD and finalize logic
* backend/src/skills/skills.controller.ts + skills.service.ts — Manager-owned skill CRUD
* backend/src/users/users.controller.ts + users.service.ts — User CRUD with team management
* backend/src/main.ts + seed.ts — App bootstrap and seed data
* backend/package.json — Dependencies

**Frontend:**
* frontend/src/app/app.routes.ts — All 10 routes
* frontend/src/app/app.config.ts + app.ts — App setup (standalone, Signals)
* frontend/src/app/auth.interceptor.ts — JWT Bearer injection
* frontend/src/app/guards/auth.guard.ts — LocalStorage-based route guard
* frontend/src/app/services/* — 5 services
* frontend/src/app/components/* — 10 components

### Project Conventions

* Backend: NestJS with TypeORM decorators, class-validator for DTOs, Passport for auth
* Frontend: Angular 21 standalone components, functional guards/interceptors, no NgModules, Signals used at root

---

## Key Discoveries

### Project Structure

```
skill-rating-app/
  backend/          NestJS API (port 3000)
    src/
      auth/         JWT + Local strategy, RolesGuard
      users/        User CRUD + team management
      skills/       Manager-owned skill definitions
      ratings/      Self + manager ratings, finalization gate
      roles/        JobRole lookup table
  frontend/         Angular 21 SPA (standalone, no NgModules)
    src/app/
      components/   10 page components
      services/     5 HTTP services
      guards/       Auth route guard
```

### Data Model

**User**
* Fields: `id`, `username`, `password` (bcrypt), `role` (enum: ADMIN | MANAGER | EMPLOYEE), `realName`, `email`, `currentRoleId`, `targetRoleId`
* Relations: `manager` (self-ref ManyToOne → User), `subordinates` (OneToMany → User), `currentRole` + `targetRole` (ManyToOne → JobRole)
* Skills and ratings link to User via manager ownership (Skills) and subject user (Ratings)

**Skill**
* Fields: `id`, `name`, `targetLevel` (0–100 int), `managerId`, `jobRoleId`
* Relations: ManyToOne → User (manager), ManyToOne → JobRole
* Manager-scoped: only the owning manager can update/delete

**Rating**
* Fields: `id`, `userId`, `skillId`, `selfRating`, `managerRating`, `targetRating`, `isFinalized`
* Upsert-style: one Rating record per (user, skill) pair
* `isFinalized` controls visibility: employee cannot see `managerRating` until manager calls finalize

**JobRole**
* Fields: `id`, `name` (unique)
* Simple lookup table for current/target role assignment

**Entity Relationships:**
```
User ──< User (manager/subordinates, self-ref)
User ──> JobRole (currentRole, targetRole)
Skill ──> User (manager), Skill ──> JobRole
Rating ──> User, Rating ──> Skill
```

### Authentication & Authorization Flow

1. `POST /auth/login` → validates credentials via Local strategy → returns JWT (60 min TTL)
2. JWT payload: `{ sub, username, role, realName, email }`
3. Protected routes use `AuthGuard('jwt')` + optional `@Roles(...)` + `RolesGuard`
4. Roles: `ADMIN`, `MANAGER`, `EMPLOYEE`
5. Frontend: `authInterceptor` injects `Authorization: Bearer <token>` on every request; `AuthGuard` checks `localStorage` for token presence; JWT decoded client-side via `jwt-decode`

### API Endpoints (27 total)

**Auth (public)**
| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/login | Issue JWT |
| POST | /auth/register | Create user (currently public) |

**Users**
| Method | Path | Guards | Description |
|--------|------|--------|-------------|
| GET | /users | JWT | List all users |
| POST | /users | JWT + ADMIN | Create user |
| PATCH | /users/:id | JWT | Update user |
| DELETE | /users/:id | JWT + ADMIN | Delete user |
| PATCH | /users/:id/details | JWT | Self-service profile update |
| PATCH | /users/:id/password | JWT | Change password |
| PATCH | /users/:id/assign-manager | JWT + ADMIN | Assign manager |
| PATCH | /users/:id/roles | JWT | Assign current/target role |
| GET | /users/my-team | JWT | List manager's subordinates |

**Skills**
| Method | Path | Guards | Description |
|--------|------|--------|-------------|
| GET | /skills | JWT | List skills (role-filtered) |
| POST | /skills | JWT | Create skill |
| PATCH | /skills/:id | JWT | Update skill (owner enforced) |
| DELETE | /skills/:id | JWT | Delete skill (owner enforced) |
| GET | /skills?userId= | JWT | Skills for a given employee's target role |

**Ratings**
| Method | Path | Guards | Description |
|--------|------|--------|-------------|
| GET | /ratings/:userId | JWT | Get all ratings for a user |
| POST | /ratings/self | JWT | Employee self-rates |
| POST | /ratings/manager/:userId | JWT | Manager rates employee |
| POST | /ratings/finalize/:userId | JWT | Finalize (reveal manager ratings) |
| GET | /ratings/finalized-users | JWT | List users whose ratings are finalized |
| GET | /ratings/target/:userId | JWT | Get target ratings |

**Job Roles**
| Method | Path | Guards | Description |
|--------|------|--------|-------------|
| GET | /job-roles | Public | List all job roles |
| POST | /job-roles | JWT + ADMIN | Create job role |
| DELETE | /job-roles/:id | JWT + ADMIN | Delete job role |

### Frontend Components

| Component | Route | Role |
|-----------|-------|------|
| LoginComponent | /login | Auth entry point |
| DashboardComponent | /dashboard | Role hub + employee self-assessment |
| AdminPanelComponent | /admin | Full user + job-role CRUD |
| ManagerRatingComponent | /manager-rating | Team list with finalization status |
| EmployeeRatingComponent | /employee-rating/:id | Manager rates a specific employee |
| RatingResultsComponent | /rating-results/:id | Read-only results view |
| SkillHeatmapComponent | /skill-heatmap | Reusable rating visual widget |
| SkillsManagementComponent | /skills-management | Manager skill CRUD |
| TeamRolesComponent | /team-roles | Assign current/target roles to team |
| ManageUserComponent | /manage-user | Self-service profile + password update |
| PageHeaderComponent | shared | Shared header across pages |

### Frontend Services

| Service | Endpoints Called |
|---------|-----------------|
| AuthService | POST /auth/login (decodes JWT client-side) |
| JobRolesService | GET/POST /job-roles, DELETE /job-roles/:id |
| RatingsService | GET /ratings/:id, POST /ratings/self, POST /ratings/manager/:id, POST /ratings/finalize/:id, GET /ratings/finalized-users |
| SkillsService | GET /skills, POST /skills, PATCH /skills/:id, DELETE /skills/:id |
| UsersService | GET/POST /users, PATCH /users/:id (multiple sub-paths), DELETE /users/:id, GET /users/my-team |

### Implementation Patterns

* Rating upsert (backend): `findOne` by (userId, skillId) + `save` = update or insert
* `forkJoin` (frontend): batch saves for self and manager ratings simultaneously
* Finalization gate: `isFinalized` flag on Rating; bulk UPDATE on finalize endpoint
* Skill ownership enforcement: service-level check (`skill.managerId !== requestingUser.id`) on update/delete

---

## Security Observations

**Critical**
* JWT secret hardcoded as `'secretKey'` in constants.ts — must be moved to environment variable
* `synchronize: true` in TypeORM config — dangerous in production (auto-migrates schema on startup)
* `/auth/register` is public with no role restriction — any anonymous user can self-register

**Moderate**
* `AuthGuard` on frontend only checks `localStorage` presence — no token expiry or integrity validation client-side
* JWT decoded client-side via `jwt-decode` — decoded data used for UI role checks (role-based rendering)

**Low**
* All services hardcode `http://localhost:3000` — no environment configuration or proxy

---

## Gaps and Recommended Improvements

### Architecture
* No `.env` / environment variable system — secrets and config are hardcoded
* No frontend environment abstraction (`environment.ts`) — API base URL hardcoded
* SQLite is used (`synchronize: true`) — not production-ready for concurrent load

### Missing Features
* `UsersService.delete()` exists with safe null-out logic but **no DELETE controller route** exposes it (or it exists but was not routed)
* No token refresh mechanism — 60 min hard expiry with no silent refresh
* No pagination on any list endpoint
* No frontend unit tests (no `.spec.ts` files found for components)
* `TeamRolesComponent` fetches all users (`GET /users`) and filters client-side instead of using `GET /users/my-team`

### Code Quality
* Angular 21 standalone + Signals partially adopted — Signals used only in root `App`, not in feature components
* No UI library — all custom CSS (can be intentional)

### Selected Approach for Improvements

Prioritized by impact:

1. **Security first**: Move JWT secret to `.env`, restrict `/auth/register`, disable `synchronize: true`
2. **Config abstraction**: Add `environment.ts` to frontend and `ConfigModule` to backend
3. **Database**: Migrate from SQLite to PostgreSQL with TypeORM migrations
4. **Testing**: Add `*.spec.ts` for key components and backend service unit tests
5. **Pagination**: Add cursor/page-based pagination to list endpoints

