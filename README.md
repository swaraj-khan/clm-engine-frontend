# CLM Engine Platform Frontend

A modular, multi-engine React-based platform for managing candidate lifecycle and automated workflows.

## Engines

1. **Cohort Engine** – View and manage users by cohort/stage (Registered, Profile Incomplete, Deployed, etc.) and explore all applied job applications.
2. **Workflow Orchestration Engine** – Coming soon.
3. **Multi-Channel Communication Layer** – Coming soon.
4. **Template Management System** – Coming soon.
5. **A/B Testing Engine** – Coming soon.
6. **Audit & Behavior Tracking Engine** – Coming soon.
7. **Admin Dashboard** – Coming soon.
8. **Event Listener & Real-time Reassignment Engine** – Coming soon.

## Features

- **Clean Navigation Bar** – Easily switch between engines.
- **Welcome Screen** – User-friendly landing page.
- **Pagination** – Seamless browsing of large datasets.
- **Modular Architecture** – Each engine in its own component file.
- **Responsive Design** – Works on desktop and mobile.

## Setup

```bash
cd frontned
npm install
npm run dev
```

The app runs on `http://localhost:5173` and proxies API requests to the FastAPI backend at `http://localhost:8000`.

## Project Structure

```
src/
├── App.jsx
├── index.css
├── main.jsx
└── components/
    ├── Navigation.jsx
    ├── Welcome.jsx
    ├── CohortEngine.jsx
    ├── StageSelector.jsx
    ├── UserTable.jsx
    ├── WorkflowOrchestrationEngine.jsx
    ├── MultiChannelCommunicationLayer.jsx
    ├── TemplateManagementSystem.jsx
    ├── ABTestingEngine.jsx
    ├── AuditBehaviorTrackingEngine.jsx
    ├── AdminDashboard.jsx
    └── EventListenerReassignmentEngine.jsx
```

## Key Components

- **Navigation** – Sticky navbar with 8 engine buttons.
- **Welcome** – Landing page seen on first load.
- **CohortEngine** – Main dashboard for user segmentation and job applications.
- **Engine Stubs** – Placeholder components for future features.

## Notes

- All engine components follow a consistent, modular pattern.
- Extend each engine by adding state, API calls, and UI components as needed.
- Styling is centralized in `index.css` for easy theming.