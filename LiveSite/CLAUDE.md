# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FindersNotKeepers is a lost and found tracking web application built with React 19, Vite, and React Router. The application allows users to report lost items, browse found items, and manage their listings. The frontend is currently using mock data stored in localStorage (no backend integration yet).

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (with HMR)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Run all tests
npm test
# or
npx vitest

# Run tests in watch mode
npx vitest --watch

# Run specific test file
npx vitest CreateListing.test.tsx
```

## Architecture

### Routing Structure

The app uses React Router (v7) with routes defined in `src/WebRoute.jsx`:
- `/` - Landing page (marketing page)
- `/about` - About page
- `/login` & `/signup` - Authentication (UI only, no backend)
- `/listings` - Browse all listings
- `/listings/:id` - View detailed listing (currently inline state-based view, not route param based)
- `/create` - Create new listing
- `/mylistings` - User's archived listings
- `/profile` - User profile
- `/settings` - User settings
- `/notifications` - Notifications view
- `/messages` & `/messages/:id` - Messaging interface
- `/contact/:listingId` - Contact form for a listing

**Note:** The detailed listing view is currently rendered within the `Listings.jsx` component based on `selectedItem` state, not via the route param. Navigation happens via React Router's `Link` component throughout the app.

### Data Management

**Current State:** All data is stored in **localStorage** (no backend API yet).

- **Mock listings data:** `src/data/listings.js` contains 3 sample listings (not actively used)
- **Active mock data:** `src/Pages/Listings.jsx` contains 8 hardcoded ITEMS with imported images
- **User-created listings:** Stored in `localStorage` under the key `"listings"` as JSON array
- **Listing structure:** Each listing includes:
  - `id` (timestamp)
  - `title` (string)
  - `status` ("LOST" | "FOUND" | "RETURNED")
  - `categoryId` (number 1-8, maps to predefined categories)
  - `categoryLabel` (string, derived from CATEGORIES array)
  - `where` (location string)
  - `when` (date string, yyyy-mm-dd)
  - `description` (string, 30-300 chars)
  - `contactName`, `contactEmail`, `contactPhone` (contact info)
  - `img` (data URL from FileReader)

### Component Patterns

**Page Components:** Located in `src/Pages/`. Each page is a full-page component that typically includes:
- Header with logo
- Right rail icons (profile, notifications, settings, messages) as `Link` components
- Main content area
- Footer with links

**Shared Assets:**
- Logo: `/logo.svg` (imported from public directory)
- Icons: `src/assets/*.svg` (profile, notifications, settings, message icons)
- Photos: `src/photos/*.jpg` (sample item images)

**Form Validation:** Client-side validation in `CreateListing.jsx`:
- Required fields enforced
- Email format validation
- Image upload limited to JPEG/PNG, max 3MB
- Description length 30-300 characters

**No shared components yet:** Footer and header are duplicated across pages. Consider extracting these into reusable components in `src/components/` if needed.

## Testing

Tests use **Vitest** with React Testing Library and jsdom.

- **Setup file:** `src/setupTests.js` (imported by vite.config.js)
- **Test files:** Located in `src/tests/` with `.test.tsx` extension
- **Mocking patterns:**
  - Mock `useNavigate` from react-router-dom using `vi.mock()`
  - Wrap components in `<MemoryRouter>` for routing context
  - Use `userEvent` for simulating user interactions
  - Clear localStorage in `beforeEach`

**Example test structure:**
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

// Mock react-router-dom
let navigateMock: ReturnType<typeof vi.fn>;
vi.mock('react-router-dom', async (orig) => {
  const mod: any = await orig()
  return {
    ...mod,
    useNavigate: () => navigateMock,
  }
})

describe('ComponentName', () => {
  beforeEach(() => {
    localStorage.clear()
    navigateMock = vi.fn()
  })

  it('test description', async () => {
    render(
      <MemoryRouter>
        <ComponentName />
      </MemoryRouter>
    )
    // ... test logic
  })
})
```

## Code Style

- ESLint configured with React Hooks rules and React Refresh plugin
- Unused variables allowed if they match pattern `^[A-Z_]` (constants)
- JSX in `.jsx` files, TypeScript for test files (`.tsx`)
- ECMAScript 2020+ features enabled

## Working Directory

The actual project code is in the `findnotkeep/` subdirectory. Always run commands from `C:\Users\hanni\findnotkeepers-draft\Frontend\findnotkeep\`.

## Future Considerations

- Backend API integration needed (no endpoints implemented yet)
- Authentication system (currently UI-only)
- Replace localStorage with proper state management (Context API or Redux)
- Extract shared components (Header, Footer, IconRail)
- The route `/listings/:id` is defined but not actively used (detail view is state-based)
- Consider implementing proper image upload to backend (currently using data URLs)
