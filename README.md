# Skill Rating App

A comprehensive full-stack application for managing employee skill ratings, roles, and team performance.

## 🚀 Overview

The Skill Rating App enables organizations to:
- **Define Skills & Roles**: Create customized skill sets and assign them to specific job roles.
- **Rate Performance**: Managers and employees can perform self and manager assessments using a visual 10-box rating system.
- **Analyze Gaps**: Visualize skill gaps between current proficiency and target levels for specific roles.
- **Manage Teams**: Managers can oversee their direct reports and track their development.
- **User Management**: Users can securely manage their profiles and passwords.

## 🛠️ Technology Stack

### Backend
- **Framework**: [NestJS](https://nestjs.com/)
- **Database**: SQLite (with TypeORM)
- **Authentication**: JWT-based (Passport) with bcrypt for security.

### Frontend
- **Framework**: [Angular](https://angular.io/) (Standalone Components)
- **Styling**: Vanilla CSS for custom, responsive designs.
- **Visualization**: Custom-built heatmap and rating visualization components.

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd skill-rating-app
    ```

2.  **Setup Backend**:
    ```bash
    cd backend
    npm install
    ```

3.  **Setup Frontend**:
    ```bash
    cd frontend
    npm install
    ```


### Running the Application

**1. Start the Backend Server:**
The backend runs on `http://localhost:3000`.
```bash
cd backend
npm run start:dev
```

**2. Start the Frontend Application:**
The frontend runs on `http://localhost:4200`.
```bash
cd frontend
npm start
```

### 🔑 Default Users
The application comes with seeded data. You can log in with the following credentials:
> **Note:** Initial passwords match the username.

| Role | Username | Password | Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin` | Full system access |
| **Manager** | `manager1` | `manager1` | Team management & ratings |
| **Employee** | `employee1` | `employee1` | Self-ratings only |

## 📸 Screenshots

### Skill Heatmap
*Interactive 10-box rating system for visual skill assessment.*
![Skill Heatmap](/Users/lefterisparaskevas/.gemini/antigravity/brain/d3f897ec-a115-4b60-8288-9b4610ed4083/verify_ui_refinements_1767557576882.webp)

### User Management
*Secure profile updates and password management.*
![User Management](/Users/lefterisparaskevas/.gemini/antigravity/brain/d3f897ec-a115-4b60-8288-9b4610ed4083/verify_user_management_final_1767560780840.webp)

## ✨ Key Features

-   **Interactive Skill Heatmap**: A visual, interactive 10-box rating interface (10-100 scale) replacing traditional sliders.
-   **Smart Label Positioning**: Rating markers (Employee, Manager, Target) intelligently adjust positions to prevent overlap.
-   **Role-Based Access Control**:
    -   **Admin**: Full system access, role management, and user administration.
    -   **Manager**: Rate subordinates, view team dashboards.
    -   **Employee**: Self-rating and view personal progress.
-   **User Management**: Secure profile updates and password management with strict complexity policies.

## 📁 Project Structure

-   `backend/`: NestJS server application.
    -   `src/users/`: User management and authentication.
    -   `src/skills/`: Skill definitions and management.
    -   `src/ratings/`: Rating logic and storage.
-   `frontend/`: Angular client application.
    -   `src/app/components/`: Feature-specific components (e.g., `skill-heatmap`, `manage-user`).
    -   `src/app/services/`: API integration services.
