# Frontend Documentation - Flayou3756 (Chnouwa Rayek?)

This document provides a comprehensive overview of the frontend architecture, components, and pages of the "Chnouwa Rayek?" application.

## Tech Stack
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS 4.0
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query)
- **API**: tRPC
- **UI Components**: Radix UI + Custom Shadcn-like system
- **Animations**: Framer Motion

---

## Core Directory Structure (`client/src`)

- `components/`: Reusable business logic components (Cards, Layouts, etc.)
- `components/ui/`: Atomic UI components (Buttons, Inputs, Dialogs, etc.)
- `pages/`: Top-level page views
- `contexts/`: React Context providers (Theme, Auth, etc.)
- `hooks/`: Custom React hooks
- `locales/`: Translation files (Tunisian Arabic / English)
- `lib/`: Utility functions and configuration (tRPC client, etc.)

---

## Main Components

### Business Components (`src/components`)
- **`Navigation.tsx`**: The persistent bottom navigation bar for mobile-first user experience.
- **`QuestionCard.tsx`**: The core interactive card used for behavioral questions and surveys.
- **`WheelOfFortune.tsx`**: A gamified component for the "Roue El Hadh" feature.
- **`DashboardLayout.tsx`**: A standard layout wrapper for admin/dashboard views.
- **`AIChatBox.tsx`**: An integrated AI assistant interface.
- **`Map.tsx`**: Interactive map component for location-based behavioral insights.

### UI Library (`src/components/ui`)
A robust set of 50+ accessible components including:
- **Buttons & Forms**: `button.tsx`, `input.tsx`, `checkbox.tsx`, `select.tsx`.
- **Feedback**: `alert.tsx`, `sonner.tsx` (toast notifications), `progress.tsx`.
- **Layout**: `card.tsx`, `accordion.tsx`, `tabs.tsx`, `scroll-area.tsx`.
- **Overlays**: `dialog.tsx`, `sheet.tsx`, `popover.tsx`, `drawer.tsx`.

---

## Pages (`src/pages`)

| Page | Route | Description |
| :--- | :--- | :--- |
| **Home** | `/` | Main dashboard with quick access cards and welcome message. |
| **QuizPage** | `/quiz` | Behavioral intelligence questions and data collection interface. |
| **ElMarchi** | `/marchi` | The rewards marketplace where users spend earned points. |
| **RoueElHadh** | `/roue` | "Wheel of Luck" gamification feature for winning prizes. |
| **ProfilePage** | `/profile` | User stats, trust scores, and account settings. |
| **ComponentShowcase** | (Dev) | Internal page for previewing and testing UI components. |

---

## Key Features

1. **Gamification**: Users earn points by answering questions and can spend them in "El Marchi" or on the "Roue El Hadh".
2. **Behavioral Intelligence**: The platform collects and analyzes response patterns (via `behavioralMetrics` in the backend).
3. **Responsive Design**: Mobile-first layout optimized for all screen sizes using a bottom navigation pattern.
4. **Theming**: Integrated light/dark mode support via `ThemeContext`.
5. **Robust Error Handling**: Wrapped in an `ErrorBoundary` with a custom `NotFound` fallback.

---

## How to Run
```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev
```
