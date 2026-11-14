Draft landing page and login-navbar components for review.

Files included:

- LandingPage.tsx — full-page React component using Tailwind classes.
- Navbar.tsx — lightweight navbar component intended for the login page (standalone).

Preview instructions:

1. Copy `LandingPage.tsx` and `Navbar.tsx` into `client/src/pages/` (or any components folder) and adjust the import path if needed.

2. To temporarily preview without touching routing, create a new file `client/src/main-preview.tsx` with:

```tsx
import React from "react";
import { createRoot } from "react-dom/client";
import LandingPage from "./pages/LandingPage";
import "./index.css"; // ensure Tailwind is loaded

createRoot(document.getElementById("root")!).render(<LandingPage />);
```

Then update `package.json` dev script to run Vite (or run `pnpm vite`), or simply replace `client/src/main.tsx` temporarily to mount the draft.

Integration notes:

- Components use Tailwind classes. If your project already has Tailwind configured, no extra CSS is required.
- The navbar is intentionally minimal and independent of the existing `Navbar.tsx`. Replace the login page's existing import with `import Navbar from '../path/to/drafts/landing/Navbar'` and render it at the top of the login page.
- After you review and confirm, I can move these files into `client/src/pages/` and wire up a route for `/`.

Tell me which parts you'd like to tweak (colors, copy, layout), and I will update the drafts accordingly.
