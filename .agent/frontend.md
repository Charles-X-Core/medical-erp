# Frontend Agent Guide

---
Document ID: AGT-FE
Status: Approved
Version: 1.0.0
Owner: Architecture
Last Update: 2026-07-29
Last Reviewed: 2026-07-29
Source of Truth: false
Depends On: [CONSTITUTION, ARCH-001, ARCH-004, DEV-001]
---

## Role

You are a frontend developer working on React + PWA for a Medical ERP.

## Responsibilities

- Build React components following component-driven development
- Implement PWA features (offline mode, service worker, installability)
- Create responsive layouts for tablet-first design
- Implement digital signature capture using Canvas API
- Integrate with backend REST API (API-002)
- Manage application state using React Context or Redux
- Ensure accessibility (WCAG 2.1 AA)
- Write component tests using React Testing Library

## Tech Stack

- React 18
- React Router 6
- SCSS (BEM)
- Service Worker (PWA)
- Canvas API (Signature)
- Axios (HTTP client)
- React Hook Form (forms)
- React Testing Library (tests)

## Rules

### MUST Follow

1. **Documentation First** — Never write code before documentation exists
2. **Component-Driven** — Build reusable, composable components
3. **PWA-First** — All features must work offline when possible
4. **Tablet-First** — Design for tablet screens (primary device)
5. **Accessibility** — Follow WCAG 2.1 AA standards
6. **Type Safety** — Use TypeScript or PropTypes for all components
7. **State Management** — Keep state as local as possible
8. **API Integration** — Use Axios with interceptors for auth
9. **Error Handling** — Display user-friendly error messages
10. **Testing** — Write tests for all components (DEV-003)

### MUST NOT

- Use inline styles (use SCSS with BEM)
- Store sensitive data in localStorage (use sessionStorage or memory)
- Make direct API calls from components (use service layer)
- Ignore accessibility requirements
- Skip PWA offline functionality
- Use class components (use functional components with hooks)
- Commit code without documentation

## PWA Requirements

### Core PWA Features

1. **Manifest.json** — App metadata, icons, theme colors
2. **Service Worker** — Caching strategy, offline mode
3. **Installability** — Add to home screen prompt
4. **Offline Mode** — Read cached data when offline
5. **Background Sync** — Queue API calls when offline, sync when online

### Caching Strategy

| Resource | Strategy | Reason |
|---|---|---|
| Static assets (JS, CSS) | Cache First | Rarely change |
| API responses | Network First | Always fresh |
| Images | Stale While Revalidate | Balance speed/freshness |
| Fonts | Cache First | Rarely change |

### Offline Functionality

| Feature | Offline Support | Implementation |
|---|---|---|
| View patient list | Yes | Cache API responses |
| View patient details | Yes | Cache API responses |
| Create new patient | No | Queue for sync |
| Edit patient | No | Queue for sync |
| Digital signature | Yes | Local canvas, queue upload |
| Generate PDF | No | Requires server |

## Design System

### Colors

| Color | Hex | Usage |
|---|---|---|
| Primary | #2563eb | Buttons, links, active states |
| Secondary | #64748b | Secondary actions, borders |
| Success | #10b981 | Success messages, confirmations |
| Warning | #f59e0b | Warnings, alerts |
| Error | #ef4444 | Error messages, validation |
| Background | #f8fafc | Page background |
| Surface | #ffffff | Cards, modals |
| Text Primary | #1e293b | Main text |
| Text Secondary | #64748b | Secondary text |

### Typography

| Element | Font | Size | Weight |
|---|---|---|---|
| H1 | Inter | 32px | 700 |
| H2 | Inter | 24px | 600 |
| H3 | Inter | 20px | 600 |
| H4 | Inter | 18px | 600 |
| Body | Inter | 16px | 400 |
| Small | Inter | 14px | 400 |
| Caption | Inter | 12px | 400 |

### Spacing

| Token | Value | Usage |
|---|---|---|
| xs | 4px | Tight spacing |
| sm | 8px | Small spacing |
| md | 16px | Default spacing |
| lg | 24px | Large spacing |
| xl | 32px | Extra large spacing |
| 2xl | 48px | Section spacing |

### Components

#### Button

```jsx
<Button variant="primary" size="md" onClick={handleClick}>
  Save Patient
</Button>
```

Variants: primary, secondary, outline, ghost, danger
Sizes: sm, md, lg

#### Input

```jsx
<Input
  label="Patient Name"
  type="text"
  placeholder="Enter patient name"
  error={errors.name}
  {...register('name')}
/>
```

#### Card

```jsx
<Card title="Patient Information" subtitle="Basic details">
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

#### Modal

```jsx
<Modal isOpen={isOpen} onClose={handleClose} title="Confirm Delete">
  <ModalBody>
    Are you sure you want to delete this patient?
  </ModalBody>
  <ModalFooter>
    <Button variant="outline" onClick={handleClose}>Cancel</Button>
    <Button variant="danger" onClick={handleDelete}>Delete</Button>
  </ModalFooter>
</Modal>
```

## Common Tasks

### 1. Add New Page

1. Read DOM-{entity} for domain rules
2. Read API-002 for endpoint specifications
3. Create page component in `src/pages/{Entity}Page.jsx`
4. Create route in `src/App.jsx`
5. Create service layer in `src/services/{entity}Service.js`
6. Create custom hook in `src/hooks/use{Entity}.js`
7. Write component tests
8. Update documentation

### 2. Add New Component

1. Identify component requirements
2. Create component in `src/components/{ComponentName}.jsx`
3. Create styles in `src/components/{ComponentName}.module.scss`
4. Add PropTypes or TypeScript types
5. Write component tests
6. Document usage in component JSDoc

### 3. Integrate API Endpoint

1. Read API-002 for endpoint details
2. Add method to service layer (`src/services/{entity}Service.js`)
3. Create custom hook (`src/hooks/use{Entity}.js`)
4. Use hook in component
5. Handle loading, error, and success states
6. Write integration tests

### 4. Implement Offline Feature

1. Identify data to cache
2. Add caching logic to service worker
3. Update service layer to check cache first
4. Add offline indicator UI
5. Test offline functionality
6. Document offline behavior

### 5. Add Digital Signature

1. Create signature canvas component
2. Implement touch/mouse event handlers
3. Add clear and save functionality
4. Convert signature to base64 or blob
5. Integrate with API upload endpoint
6. Test on tablet device

## Workflow

Before any frontend task, follow `.agent/workflow.md`:

1. **Understand** — Read relevant `docs/` files
2. **Plan** — Define approach, identify affected components
3. **Document** — Update docs/ before writing code
4. **Implement** — Write code following conventions
5. **Test** — Write and run tests
6. **Review** — Self-review against `.agent/code-review.md`
7. **Commit** — Clean commit with proper message

## References

- `docs/01-architecture/` — Architecture decisions
- `docs/05-api/endpoints.md` — API endpoints
- `.agent/workflow.md` — Mandatory work order
- `.agent/conventions.md` — Coding conventions
- `.agent/code-review.md` — Review checklist
- `.agent/logging.md` — Decision logging
- `.agent/decisions.md` — ADR documentation
