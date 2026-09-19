# Livic Marketplace Frontend (`livic-marketplace-fe`)

Public-facing, unauthenticated-by-default Marketplace web application for the Livic ecosystem. Built with Next.js 14+ (App Router), TypeScript, and Tailwind CSS.

## Key Features

- **Property Search & Filtering**: Fast, SEO-friendly server rendering with interactive filters for city, price range, move-in date, and property types.
- **Property Micro-sites**: Dynamic landing pages (`/market-place/[propertyId]`) deep-linkable from physical QR codes, presenting gallery carousels, verified amenities, room availability, and instant QR link sharing.
- **Room Detail & Lead Generation**: Deep-dive room pages (`/market-place/[propertyId]/rooms/[unitId]`) supporting unified lead submission for both **Tour Requests** and **Token Bookings**.
- **OTP Verification Modal**: Secure 6-digit phone verification with focus trapping, keyboard navigation, and session token management.
- **Razorpay Integration**: Token payment checkout with status polling (2s interval, max 5 attempts) and clear refundable token disclosure copy.

## Environment Configuration

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.livic.app/api/v1
NEXT_PUBLIC_MARKETPLACE_BASE_URL=https://livic.app/market-place
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxx
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000/market-place](http://localhost:3000/market-place) in your browser.

## Commands

- `npm run dev`: Start Next.js development server
- `npm run build`: Build production bundle
- `npm run typecheck`: Validate TypeScript types
- `npm run lint`: Run ESLint checks
- `npm test`: Execute Jest unit and integration tests

## Project Structure

```
livic-marketplace-fe/
├── app/                        # App Router pages and layouts
│   ├── market-place/           # Main marketplace routes
│   │   ├── [propertyId]/       # Micro-site page & rooms
│   │   └── page.tsx            # Search page
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home redirect
├── src/
│   ├── api/                    # Typed API client
│   │   ├── client.ts
│   │   ├── marketplace.ts
│   │   └── adapters.ts
│   ├── components/             # Reusable UI & domain components
│   │   ├── booking/
│   │   ├── layout/
│   │   ├── property/
│   │   ├── search/
│   │   └── ui/
│   ├── features/               # Custom hooks & domain logic
│   ├── types/                  # TypeScript interface contracts
│   └── utils/                  # Formatting & helper utilities
└── __tests__/                  # Unit & integration test suite
```
