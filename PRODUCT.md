# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Diners and restaurant partners are co-equal primary audiences. Design and product work must serve both sides of the marketplace, not treat one as a footnote.

**Diners** book and fulfill meals: they reserve a table, reserve a table and pre-order food, or pre-order for pickup. Typical situation: urban dining in India (city list and rupee prices in the current app), where time and plans are uncertain.

**Restaurant partners** need more orders, faster table turns from guests who have already ordered, timed pickup that fills quieter hours without crowding the floor, and a way for guests to change plans without a cancellation.

## Product Purpose

FlexiDine is a real startup product for completing dining bookings, not a throwaway concept mock. Success is a diner finishing one of three jobs and the restaurant receiving that demand:

1. Reserve a table.
2. Pre-order with a table reservation.
3. Pre-order for pickup.

The product exists so diners skip wait-and-guess dining, and restaurants know what is coming.

## Positioning

One booking surface that holds a table, a kitchen ticket, or both — and lets the diner choose dine-in or pickup as the fulfillment, rather than splitting reservation apps from takeout apps.

## Operating Context

- Web app (Next.js) used in a browser.
- City-scoped discovery (Indian cities in the current product).
- Prices in Indian rupees.
- Restaurant partners are invited via `partners@flexidine.com` in the current site.
- Terminology in use: FlexiDine / Flexidine, FlexiSwitch / Flex Switch, Prebook, Pre-Order, Pickup.

## Capabilities and Constraints

Confirmed diner flows:

- Table reservation (no menu required).
- Table reservation plus pre-order.
- Pickup-only pre-order.

Currently in the product, and not contradicted: **FlexiSwitch** converts a reserved dine-in visit into pickup without cancelling the kitchen order. Treat it as part of the diner experience unless a later decision drops it.

Current implementation constraints (the live product must not pretend these are already solved):

- Restaurant catalog, menus, ratings, offers, and availability are static demo data (`lib/restaurant-data.ts`).
- “Placed” bookings are client-side UI state, not a reservation or order backend.
- Sign-in / sign-up persist a username in `localStorage` only.

Open: payment, real restaurant onboarding, kitchen/POS integration, account identity, and which cities launch first beyond the current list.

## Brand Commitments

- Product name: **FlexiDine** (wordmark also appears as Flexidine).
- Line in use: reserve, pre-order, dine or pickup.
- Do not invent a different product name or a competing dining-flexibility claim.

## Evidence on Hand

- Marketing and flow copy, demo restaurants, and images under `public/images/`.
- On-site testimonials, star ratings, and review counts are **illustrative demo content**. Future work must not present them as real customers, press, or measured results.

## Product Principles

- Optimize for both diner completion and restaurant operations on the same booking.
- The three intents (reserve, reserve + pre-order, pickup) are the product, not optional chrome.
- Do not claim a live reservation network the current stack cannot fulfill.
- Keep India city + rupee context unless the product explicitly expands.
- Do not fabricate social proof; demo quotes stay labeled as demo or are replaced with real evidence.
