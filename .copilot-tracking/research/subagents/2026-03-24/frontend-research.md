# Frontend Research — Skill Rating App Angular Frontend

**Date:** 2026-03-24
**Status:** Complete
**Scope:** frontend/src/app — routing, configuration, services, components, guards, interceptors

---

## Research Topics

1. Routing and app configuration
2. All components (purpose, features, APIs called)
3. All services (methods, endpoints)
4. Auth interceptor and guard
5. Package dependencies

---

## 1. Routing & App Configuration

### app.routes.ts

| Route | Component | Guard |
|---|---|---|
| `` (empty) | Redirects to `/login` | None |
| `/login` | `LoginComponent` | None |
| `/dashboard` | `DashboardComponent` | `AuthGuard` |
| `/admin` | `AdminPanelComponent` | `AuthGuard` |
| `/skills-management` | `SkillsManagementComponent` | `AuthGuard` |
| `/manager-rating` | `ManagerRatingComponent` | `AuthGuard` |
| `/team-roles` | `TeamRolesComponent` | `AuthGuard` |
| `/employee-rating/:id` | `EmployeeRatingComponent` | `AuthGuard` |
| `/rating-results/:id` | `RatingResultsComponent` | `AuthGuard` |
| `/manage-user` | `ManageUserComponent` | `AuthGuard` |

All authenticated routes use the functional `AuthGuard`.

### app.config.ts

Uses Angular standalone API (`ApplicationConfig`):
- `provideZoneChangeDetection({ eventCoalescing: true })`
- `provideRouter(routes)`
- `provideHttpClient(withInterceptors([authInterceptor]))` — registers the JWT auth interceptor globally

### app.ts (Root Component)

- `selector: app-root`
- Uses `RouterOutlet` only; acts as the shell
- `title` is a `signal('frontend')` — uses Angular signals

---

## 2. Auth Interceptor & Guard

### auth.interceptor.ts (`authInterceptor`)

Functional HTTP interceptor (`HttpInterceptorFn`):
- Reads JWT token from `localStorage` key `auth_token`
- If token exists, clones the request and appends `Authorization: Bearer <token>` header
- Applied globally via `provideHttpClient(withInterceptors([...]))`

### guards/auth.guard.ts (`AuthGuard`)

Functional guard (not a class):
- Injects `AuthService` and `Router`
- Calls `authService.isAuthenticated()` (checks for token in localStorage)
- Returns `true` if authenticated; otherwise redirects to `/login` and returns `false`

---

## 3. Services

### AuthService (`services/auth.service.ts`)

Base URL: `http://localhost:3000`

| Method | Endpoint | Description |
|---|---|---|
| `login(credentials)` | `POST /auth/login` | Authenticates user; saves returned `access_token` to localStorage |
| `saveToken(token)` | — | Stores token in `localStorage` under key `auth_token` |
| `getToken()` | — | Retrieves token from `localStorage` |
| `logout()` | — | Removes token from `localStorage` |
| `isAuthenticated()` | — | Returns `true` if token exists |
| `getUser()` | — | Decodes the JWT using `jwtDecode` (library: `jwt-decode`) and returns the payload |

**Note:** `getUser()` returns the decoded JWT payload — includes fields like `sub` (userId), `username`, `role`, `realName`, `email`, `iat`, `exp`.

---

### JobRolesService (`services/job-roles.service.ts`)

Base URL: `http://localhost:3000/job-roles`

Exports interface `JobRole { id: number; name: string }`.

| Method | Endpoint | Description |
|---|---|---|
| `getRoles()` | `GET /job-roles` | Returns all job roles |
| `createRole(name)` | `POST /job-roles` | Creates a new role with `{ name }` |
| `deleteRole(id)` | `DELETE /job-roles/:id` | Deletes a role by ID |

---

### RatingsService (`services/ratings.service.ts`)

Base URL: `http://localhost:3000/ratings`

| Method | Endpoint | Description |
|---|---|---|
| `getRatings(userId)` | `GET /ratings/:userId` | Returns ratings for a user; maps backend format to `{ id, skillId, userId, selfRating, managerRating, targetRating }` |
| `saveRating(rating)` | `POST /ratings/self` | Saves self-rating with `{ skillId, rating: value }` |
| `saveManagerRating(userId, skillId, rating)` | `POST /ratings/manager/:userId` | Saves manager rating with `{ skillId, rating }` for a specific employee |
| `finalizeRatings(userId)` | `POST /ratings/finalize/:userId` | Finalizes ratings for a user (makes them visible to employee) |
| `getFinalizedUserIds()` | `GET /ratings/finalized-users` | Returns array of user IDs who have been fully rated |

---

### SkillsService (`services/skills.service.ts`)

Base URL: `http://localhost:3000/skills`

| Method | Endpoint | Description |
|---|---|---|
| `getSkills(jobRoleId?, userId?)` | `GET /skills?jobRoleId=&userId=` | Fetches skills filtered by optional `jobRoleId` and `userId` query params |
| `createSkill(skill, jobRoleId?)` | `POST /skills` | Creates a skill with `{ name, description, targetLevel, jobRoleId }` |
| `deleteSkill(id)` | `DELETE /skills/:id` | Deletes skill by ID |
| `updateSkill(id, skill)` | `PATCH /skills/:id` | Updates skill name/description/targetLevel |

---

### UsersService (`services/users.service.ts`)

Base URL: `http://localhost:3000/users`

| Method | Endpoint | Description |
|---|---|---|
| `getUsers()` | `GET /users` | Returns all users with role, manager relationship, etc. |
| `createUser(user)` | `POST /users` | Creates a user with `{ realName, email, username, password, role }` |
| `updateUser(userId, userData)` | `PATCH /users/:userId` | Full user update (admin-level: role, username, etc.) |
| `deleteUser(userId)` | `DELETE /users/:userId` | Deletes a user |
| `updateUserDetails(userId, data)` | `PATCH /users/:userId/details` | Updates `realName` and `email` (self-service) |
| `updateUserPassword(userId, data)` | `PATCH /users/:userId/password` | Changes password with `{ currentPass, newPass }` |
| `assignManager(employeeId, managerId)` | `PATCH /users/:employeeId/assign-manager` | Assigns or removes a manager from an employee |
| `assignRoles(userId, currentRoleId, targetRoleId)` | `PATCH /users/:userId/roles` | Sets current and target job roles for a user |
| `getMyTeam()` | `GET /users/my-team` | Returns employees assigned to the currently authenticated manager |

---

## 4. Components

### LoginComponent (`components/login/`)

**Purpose:** Renders the login form. The entry point of the app.

**Features:**
- `ReactiveFormsModule` — uses `FormBuilder` to build a reactive form with `username` and `password` fields, both required
- On submit calls `AuthService.login()`, stores token, navigates to `/dashboard`
- Shows `errorMessage` on failed login
- Standalone component

**APIs called:** `POST /auth/login` (via `AuthService.login()`)

---

### DashboardComponent (`components/dashboard/`)

**Purpose:** Role-aware home screen after login. Displays role-specific action buttons and triggers the employee self-assessment flow.

**Features:**
- `OnInit` — reads current user from JWT (`AuthService.getUser()`)
- Conditionally shows different action groups based on `user.role`: `admin`, `manager`, `employee`
- For employees: shows/hides the `SkillHeatmapComponent` for self-assessment
- Uses `@ViewChild(SkillHeatmapComponent)` to call `getSelfAssessmentPayload()` before submitting
- Uses `forkJoin` to submit all skill ratings in parallel via `RatingsService.saveRating()`
- Tracks self-assessment completion in `localStorage` with key `selfAssessmentCompleted:<userId>`
- Confirmation modal before submit
- Uses `SkillHeatmapComponent` (embedded, `showValues=false`)
- Uses `PageHeaderComponent`

**APIs called:**
- `GET /ratings/:userId` — checks if user has existing self-ratings on init
- `POST /ratings/self` (×N via `forkJoin`) — saves each skill rating

---

### AdminPanelComponent (`components/admin-panel/`)

**Purpose:** Admin-only view for managing all users and job roles.

**Features:**
- `FormsModule` — template-driven forms (`ngModel`) for creating users and roles
- Loads and groups users by role: `admins`, `managers`, `employees`, `unassignedEmployees`
- Expandable sections for each manager's team using a `Set<string | number>` (`expandedSections`)
- CRUD operations on users: create, edit, delete
- Manager reassignment modal using `select`
- CRUD operations on job roles

**APIs called:**
- `GET /users`
- `POST /users`
- `PATCH /users/:id`
- `DELETE /users/:id`
- `PATCH /users/:id/assign-manager`
- `GET /job-roles`
- `POST /job-roles`
- `DELETE /job-roles/:id`

---

### ManagerRatingComponent (`components/manager-rating/`)

**Purpose:** Lists the manager's team members and allows navigating to rate each employee.

**Features:**
- `OnInit` — loads team via `UsersService.getMyTeam()` and finalized user IDs via `RatingsService.getFinalizedUserIds()`
- Clicking an employee navigates to `/employee-rating/:id` (if not yet rated) or `/rating-results/:id` (if finalized)
- Visual badge: "Rated" (✅) or "Not yet rated" (ℹ️)

**APIs called:**
- `GET /users/my-team`
- `GET /ratings/finalized-users`

---

### EmployeeRatingComponent (`components/employee-rating/`)

**Purpose:** Allows a manager to rate a specific employee using the `SkillHeatmapComponent` in manager view mode.

**Features:**
- Route param `:id` read via `ActivatedRoute`
- Embeds `SkillHeatmapComponent` with `[userId]`, `[readOnly]="false"`, `[isManagerView]="true"`, `[employeeName]`
- Uses `@ViewChild(SkillHeatmapComponent)` to call `getManagerRatings()` on submit
- Submits all manager ratings via `forkJoin(ratingRequests)`, then calls `finalizeRatings(employeeId)` to lock them in
- Navigates to `/rating-results/:id` on success
- Confirmation modal before submit

**APIs called:**
- `GET /users` (to resolve employee name by ID)
- `POST /ratings/manager/:userId` (×N via `forkJoin`)
- `POST /ratings/finalize/:userId`

---

### RatingResultsComponent (`components/rating-results/`)

**Purpose:** Read-only view showing self, manager, and target ratings for each skill using custom CSS markers on a disabled range slider.

**Features:**
- Route param `:id` for employee ID
- Determines user role (`employee` vs `manager`) to adjust back navigation and messaging
- Dynamic label placement (`getLabelTop()`) to avoid collision between Target, Employee, and Manager markers on the slider
- Shows warning if employee is viewing but manager has not yet rated (`showManagerPendingMessage`)
- Shows legend (Target / Self Rating / Manager Rating)

**APIs called:**
- `GET /users` (to resolve employee + manager names)
- `GET /skills?userId=` (to get skills relevant to the employee)
- `GET /ratings/:userId`

---

### SkillHeatmapComponent (`components/skill-heatmap/`)

**Purpose:** Reusable component that renders skills as a heat-map-style rating grid (10 clickable boxes per skill). Supports self-rating, manager-rating, and read-only modes.

**Inputs:**

| Input | Type | Default | Description |
|---|---|---|---|
| `userId` | `number \| null` | `null` | The employee whose skills/ratings are shown |
| `readOnly` | `boolean` | `false` | If true, clicks are disabled |
| `employeeName` | `string` | `''` | Employee name for marker label; also signals manager view context |
| `isManagerView` | `boolean` | `false` | If true, ratings are stored locally (`managerRatings` Map) rather than auto-saved |
| `showValues` | `boolean` | `true` | Whether to show numeric rating labels |

**Public Methods (called by parent via @ViewChild):**
- `getManagerRatings(): Map<number, number>` — returns local manager rating map
- `getSelfAssessmentPayload(): { skillId, value }[]` — returns self-assessment entries with `value > 0`

**Features:**
- `OnInit` + `OnChanges` — reacts to `userId` changes
- Loads skills via `SkillsService.getSkills()` and ratings via `RatingsService.getRatings()`
- Tracks employee self-ratings (`employeeSelfRatings`) separately when in manager view
- `ratingSteps = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]` — 10-step discrete values
- Target level marker shown in manager view via CSS positioning

**APIs called:**
- `GET /skills?userId=`
- `GET /ratings/:userId`

---

### SkillsManagementComponent (`components/skills-management/`)

**Purpose:** Manager view to manage (CRUD) skills scoped to a specific job role.

**Features:**
- `FormsModule` — template-driven (`ngModel`) for inputs and sliders
- Loads roles on init, auto-selects the first role, and loads its skills
- Skills can be created with `name`, `description`, `targetLevel` (range slider 0–100, step 10)
- Inline edit via a modal overlay
- Delete operations
- Role selector dropdown (changing role reloads skills)

**APIs called:**
- `GET /job-roles`
- `GET /skills?jobRoleId=`
- `POST /skills`
- `PATCH /skills/:id`
- `DELETE /skills/:id`

---

### TeamRolesComponent (`components/team-roles/`)

**Purpose:** Manager view to assign current and target job roles to each team member.

**Features:**
- `FormsModule` — template-driven (`ngModel`) for role dropdowns
- Loads roles and filters team members from `getUsers()` where `manager.id === currentUser.sub`
- Two dropdowns per employee (current role, target role); submits on `(change)` event
- Calls `usersService.assignRoles()` automatically when a dropdown value changes

**APIs called:**
- `GET /job-roles`
- `GET /users` (filters client-side to manager's team)
- `PATCH /users/:userId/roles`

---

### ManageUserComponent (`components/manage-user/`)

**Purpose:** Self-service profile management for any logged-in user (update name/email, change password).

**Features:**
- `FormsModule` — template-driven (`ngModel`)
- Reads current user from JWT; adapts back navigation link based on role (admin → `/admin`, manager → `/manager-rating`, employee → `/dashboard`)
- Details section: `realName` + `email`; Save button only enabled when at least one field changed
- Password section: current password, new password (with complexity validation: 8+ chars, upper, lower, number, symbol), repeat password
- Inline success/error messaging for both sections

**APIs called:**
- `PATCH /users/:userId/details`
- `PATCH /users/:userId/password`

---

### PageHeaderComponent (`components/shared/page-header/`)

**Purpose:** Shared layout header used by all authenticated pages.

**Inputs:**

| Input | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | `''` | Page title displayed as `<h2>` |
| `backLink` | `string \| null` | `'/dashboard'` | RouterLink for back button; `null` hides the button |
| `backLabel` | `string` | `'← Dashboard'` | Label for back button |
| `showLogout` | `boolean` | `true` | Shows Logout and Manage User buttons |

**Features:**
- Always renders a header with the page title
- Conditionally renders back button, Manage User button (`/manage-user`), and Logout button
- `logout()` calls `AuthService.logout()` then navigates to `/login`

---

## 5. Dependencies (package.json)

| Package | Version | Purpose |
|---|---|---|
| `@angular/common` | ^21.0.0 | Core Angular utilities (`NgIf`, `NgFor`, etc.) |
| `@angular/core` | ^21.0.0 | Core Angular framework (signals, DI) |
| `@angular/forms` | ^21.0.0 | Reactive and template-driven forms |
| `@angular/platform-browser` | ^21.0.0 | Browser rendering |
| `@angular/router` | ^21.0.0 | Client-side routing |
| `jwt-decode` | ^4.0.0 | Decodes JWT payload client-side (no verification) |
| `rxjs` | ~7.8.0 | Reactive streams (`forkJoin`, `map`, `tap`, `Observable`) |
| `zone.js` | ^0.15.1 | Angular change detection |

**Angular Version:** 21 (standalone component API, functional guards/interceptors, signals).
**No UI component library** — all styling is custom CSS per component.
**No state management library** — state is local to components + `localStorage`.

---

## 6. Key Architectural Observations

1. **Standalone component architecture** — no NgModules. All components declared with `standalone: true` and import their own dependencies.
2. **Functional guards and interceptors** — `AuthGuard` and `authInterceptor` are plain functions; no class-based guards.
3. **JWT decoded client-side** — `AuthService.getUser()` uses `jwtDecode` to extract user identity. The `sub` field serves as the user ID.
4. **Self-assessment localStorage caching** — `DashboardComponent` caches whether an employee completed self-assessment under `selfAssessmentCompleted:<userId>`.
5. **`SkillHeatmapComponent` dual-mode** — same component used for self-rating (dashboard) and manager-rating (employee-rating page), differentiated by `isManagerView` input.
6. **Ratings finalization** — manager ratings are submitted then explicitly finalized via `POST /ratings/finalize/:userId`, which presumably gates employee visibility.
7. **`forkJoin` for batch saves** — both self-assessment and manager ratings are saved in parallel using `forkJoin`.
8. **Hardcoded API base URL** — all services point to `http://localhost:3000`. No environment file abstraction observed.
9. **`TeamRolesComponent`** filters team members client-side from the full users list (`GET /users`) by comparing `manager.id === currentUser.sub`. This is wasteful — `GET /users/my-team` exists and is already used in `ManagerRatingComponent` but not here.
10. **Rating scale** — 0–100, discrete 10-step increments in the heatmap.

---

## 7. Gaps / Open Questions

1. **No `environment.ts` abstraction** — hardcoded `http://localhost:3000` in every service. Production/staging configs are absent.
2. **`skill-heatmap.css` not read** — functional details were fully captured from `.ts` and `.html`; CSS is cosmetic.
3. **No unit tests** observed in the frontend (only `src/app/` files were reviewed — no `.spec.ts` files found in component folders).
4. **TeamRolesComponent** loads all users and filters client-side, while `getMyTeam()` endpoint exists — potential optimization opportunity.
5. **JWT payload fields** — the exact shape of the decoded JWT (all fields) was not confirmed from a backend call; fields inferred from usage (`sub`, `role`, `username`, `realName`, `email`).
6. **`rating-results` `targetRating` field** — the results page reads `targetRating` from ratings API but also reads `skill.targetLevel` directly from the skills response for marker placement; the relationship between these is unclear.
7. **`SkillHeatmapComponent` in dashboard** — loaded with `showValues=false` and no `userId` (defaults to current user); the component auto-assigns `userId = user.sub` on `ngOnInit` when not in manager view.
