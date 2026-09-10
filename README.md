# E-Commerce Frontend

Next.js 14 storefront (App Router, TypeScript, Tailwind CSS, shadcn/ui) for the e-commerce platform.

## Stack

- Next.js 14 (App Router), React 18, TypeScript 5
- Tailwind CSS 3 + shadcn/ui (design tokens in `tailwind.config.ts`)
- API client: `src/lib/api.ts` (JWT + automatic token refresh)

## Pages

Home, Product Listing, Product Detail, Cart, Checkout (address/payment/review/confirmation), Login, Register, Order History, Order Detail, Admin Dashboard, Admin Orders, Admin Products.

See SDLC plan section 7 for wireframes and specs: `/Users/sushant/Projects/Library/sdlc/planning/SDLC-PLAN-v2.0.md`

## Development

```bash
npm install
npm run dev
# http://localhost:3000  (expects API at http://localhost:8080)
```

## Scripts

```bash
npm run dev       # dev server
npm run build     # production build
npm run lint      # ESLint
npm test          # Vitest unit tests
npx playwright test  # E2E tests
```