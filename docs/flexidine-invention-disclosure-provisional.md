# FlexiDine — Invention Disclosure and Provisional Patent Brief

**Document type:** Internal invention disclosure for a first (provisional) patent filing  
**Product:** FlexiDine  
**Status of the product:** Prototype / development (client-side web app)  
**Document date:** 5 September 2026  
**Classification:** Confidential — attorney work product once shared with counsel  

---

## 0. Read this first

This is **not** a filed patent and **not** legal advice. It is a development-stage disclosure so a registered patent agent or attorney can file a **provisional specification** (India) and/or a **provisional application** (United States), then convert it within 12 months.

Until counsel files:

- Treat this document as confidential.
- Do not publish a public “patent pending” claim.
- Prefer filing **before** a public launch, investor deck, or academic paper that describes the method in detail. India and the US have different grace-period rules; do not rely on them without counsel.

Inventorship is a legal question: list every person who contributed a claimed inventive concept, not only the company founder. Addresses and citizenship should be completed with counsel before filing.


| Field                            | Value                                                                                    |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| Working title                    | System and method for a unified dining booking with FlexiSwitch fulfillment conversion among dine-in, pickup, and delivery |
| Applicant (individual)           | Mamidala Hari Teja                                                                       |
| Founder                          | Mamidala Hari Teja                                                                       |
| Inventors (full legal names)     | Mamidala Hari Teja                                                                       |
| Inventor addresses / citizenship | *[to be completed with counsel]*                                                         |
| Priority / first-to-file target  | India provisional and/or USPTO provisional                                               |
| Related trademarks               | FlexiDine, FlexiSwitch (consider separate trademark filings)                             |


---



## 1. Field of the invention

The invention relates to computer-implemented systems for restaurant demand: table reservations, pre-ordered meals, pickup (including buy-online-pickup-in-store / BOPIS), **on-the-way reserve-and-pre-order**, and last-mile **delivery**, and in particular to a **single booking record** whose **fulfillment mode** (dine-in, pickup, or delivery) can change after placement **through a conversion engine (FlexiSwitch)** **without cancelling the kitchen work**. All fulfillment conversions in the system are effected by FlexiSwitch.

---



## 2. Background and problem

Existing products split the diner’s job across silos:


| Category                | Typical products                 | What they do well    | What they lose                                                |
| ----------------------- | -------------------------------- | -------------------- | ------------------------------------------------------------- |
| Reservation networks    | OpenTable, Resy, local waitlists | Hold a table         | No kitchen ticket; a plan change is a cancellation            |
| Food delivery / takeout | Zomato, Swiggy, DoorDash         | Paid kitchen tickets | Rider last-mile; no table; “switch to dine-in” is a new order |
| Restaurant POS / KDS    | Toast, Petpooja, POSIST          | In-house tickets     | Not a diner-facing marketplace with convertible fulfillment   |
| Hybrid “order ahead”    | Some brand apps                  | Timed pickup         | Usually one fulfillment; conversion cancels and rebooks       |


When a diner’s evening changes, the industry default is **cancel**. Cancellation wastes:

1. **Kitchen work** already queued or in progress.
2. **Table inventory** that could have been released or reassigned.
3. **Paid demand** (the restaurant loses the ticket or refunds).
4. **Diner intent** (they still want the same dishes, just a different fulfillment).

There is a further need for a diner who is **already travelling** to hold a table and send the kitchen ticket **on the way**, with fire time driven by arrival estimate rather than a static slot alone.

There is also a need to convert **pickup ↔ delivery** on the same ticket, subject to **timeline precautions** (prep remaining, rider dispatch window, food-hold limits), rather than cancelling pickup and opening a new delivery cart.

There is a need for a method in which one prepaid or pre-authorized booking can be **table-only**, **kitchen-only**, **table plus kitchen**, or **delivery**, and later converted among dine-in, pickup, and delivery **via FlexiSwitch** while **preserving the same order identity, line items, and kitchen queue position**.

---



## 3. Objects of the invention

1. Provide one booking surface that can represent a table hold, a kitchen ticket, both, or a delivery dispatch.
2. Provide **Reserve a table and pre-order on the way** as a FlexiDine service: while the diner is travelling, the system holds a table and attaches a kitchen ticket whose fire time follows the diner’s arrival timeline.
3. Effect **all order conversions through FlexiSwitch**, including dine-in → pickup, pickup → dine-in, pickup → delivery, and delivery → pickup, without deleting the kitchen ticket.
4. On conversion, automatically **release or assign table inventory** and/or **attach or cancel a delivery dispatch**, and mark the kitchen ticket as fulfillment-changed.
5. Enforce **timeline precautions** on conversion (especially pickup ↔ delivery): refuse or delay a switch when remaining prep, rider SLA, or food-hold window cannot be met.
6. Fire kitchen tickets on **restaurant-configured lead time** (scheduled visit or live ETA minus prep and buffer), distinct from ASAP pickup.
7. Gate kitchen work on **restaurant approval**, then keep diner, front-of-house, and kitchen displays on one status pipeline.
8. Apply a **restaurant-selected conversion price policy** so a mode switch does not require a new cart.

---



## 4. Summary of the invention

A computer system stores a **unified booking / order object** with at least:

- restaurant identifier;  
- diner identifier;  
- booking kind: reservation-only, reservation-plus-preorder, **reserve-and-preorder-on-the-way**, pickup (ASAP or scheduled), or delivery;  
- fulfillment type: `DINE_IN`, `PICKUP`, or `DELIVERY`;  
- optional table identifier;  
- optional delivery address, dispatch id, and rider ETA;  
- optional diner location / travel ETA (for on-the-way bookings);  
- optional line items and payment state;  
- scheduled visit time or live arrival estimate;  
- derived kitchen start time and estimated ready time;  
- approval state and kitchen stage;  
- an optional **fulfillment-conversion history**.

A **conversion engine** (FlexiSwitch) is the **sole path** for changing fulfillment type after the booking exists. If restaurant policy allows the direction of conversion **and timeline precautions pass**:

- **Dine-in → pickup:** fulfillment becomes pickup; any assigned table is released to available; the same kitchen ticket is updated in place and flagged as converted.  
- **Pickup → dine-in:** the system searches live table inventory for a seat that meets party size; on success it assigns the table, updates the same ticket, and records table assignment; on failure the pickup ticket is left unchanged.  
- **Pickup → delivery:** a delivery dispatch is attached to the same ticket; pickup collection is cancelled; kitchen pack-out and ready time are re-checked against rider timeline.  
- **Delivery → pickup:** dispatch is cancelled or recalled if still within a recall window; fulfillment becomes pickup; the diner is directed to collect at the counter.

**Reserve a table and pre-order on the way** (planned commercial service): the diner, while travelling to the restaurant, creates or continues a booking that both holds a table and sends line items to the kitchen. Kitchen fire and table hold follow a **live or periodically refreshed ETA**, with the same FlexiSwitch engine available if the diner’s plan changes to pickup or delivery before arrival.

Kitchen timing is computed from restaurant settings (`asapPrepMinutes`, `prepBufferMinutes`, `preOrderCutoffMinutes`, `preparationLeadTimeMinutes`). Scheduled tickets remain in an **upcoming** hold until the fire window opens, then promote into the active kitchen board. Kitchen stage transitions (upcoming → new → preparing → ready → completed) are synchronized to front-of-house order state and to the diner’s status view (waiting / accepted / preparing / ready / collected or served).

Partner onboarding captures prep rules and a **conversion policy** (same price; pickup offset collected at table; or listed conversion charge), so the economic identity of the ticket can survive a mode switch.

---



## 5. Brief description of drawings (to be prepared)

Counsel should commission formal figures. The following are the intended sheets.

**FIG. 1** — System architecture: diner client, partner (FOH) client, kitchen display client, booking store, order store, reservation/table store, kitchen-ticket store, event log, conversion engine, scheduling engine.

**FIG. 2** — Unified booking object and relationships: booking kind, fulfillment type, reservation, table, order line items, kitchen ticket, event history.

**FIG. 3** — Diner flow: discover restaurant → choose intent (reserve / reserve+preorder / **reserve and pre-order on the way** / pickup / delivery) → slot or live ETA → optional menu → restaurant approval → live status.

**FIG. 4** — FlexiSwitch dine-in → pickup: request, policy check, timeline check, table release, ticket update, events `FLEXISWITCH_APPROVED` and `FULFILLMENT_CHANGED`.

**FIG. 5** — FlexiSwitch pickup → dine-in: policy flags `allowFlexiSwitch` and `allowPickupToDineIn`, table search by capacity, assign or fail-closed (pickup unchanged).

**FIG. 6** — Kitchen fire timing: `kitchenStartAt = scheduledFor − prep − buffer`; `estimatedReadyAt = scheduledFor − buffer`; ASAP path starts immediately; **on-the-way path uses arrival ETA in place of or in addition to scheduledFor**.

**FIG. 7** — Kitchen board state machine and promotion of scheduled tickets when the lead window opens.

**FIG. 8** — Status projection: kitchen ticket status → FOH stage → diner-facing labels (Ready for pickup vs Ready for the table vs Out for delivery; Collected vs Served vs Delivered).

**FIG. 9** — Conversion price policies A / B / C applied to the same ticket identity.

**FIG. 10** — Partner onboarding: restaurant profile, prep minutes, fire-ticket minutes, POS type, conversion policy, delivery enablement, approval to go live.

**FIG. 11** — Reserve a table and pre-order on the way: diner location / ETA → table hold + kitchen ticket → fire window tied to arrival; optional FlexiSwitch before arrival.

**FIG. 12** — FlexiSwitch pickup ↔ delivery with **timeline precaution**: remaining prep, rider SLA, food-hold limit; fail-closed if the new mode cannot be completed in time.

---



## 6. Detailed description



### 6.1 Actors and clients

The system has two primary audiences on one booking:

- **Diner:** reserves a table, reserves and pre-orders, **reserves and pre-orders on the way**, pre-orders for pickup, or orders for delivery; later may request fulfillment conversion **only through FlexiSwitch**.  
- **Restaurant partner:** front-of-house (dashboard, orders, reservations, tables) and kitchen display (KDS). Staff approve or reject incoming demand, then advance kitchen stages.

Optional third actor: **platform admin**, who reviews restaurant onboarding before the kitchen is published to diners.

### 6.2 Unified demand object

A booking is one of:

| Kind | Table hold | Kitchen ticket | Typical fulfillment |
| --- | --- | --- | --- |
| `reserve` | Yes | No (or seating-only) | Dine-in |
| `reserve-preorder` | Yes | Yes | Dine-in (convertible via FlexiSwitch) |
| `reserve-preorder-on-the-way` | Yes | Yes | Dine-in, fire time from travel ETA (planned service) |
| `pickup` | No | Yes | Pickup ASAP or scheduled |
| `delivery` | No | Yes | Last-mile delivery (planned fulfillment) |

An order record may further type the ticket as `RESERVATION_ONLY`, `PREORDER_DINE_IN`, `PREORDER_ON_THE_WAY`, `PICKUP_ASAP`, `PICKUP_SCHEDULED`, `DELIVERY`, or generic `DINE_IN`, while a separate **fulfillment type** (`DINE_IN` | `PICKUP` | `DELIVERY`) is the field the conversion engine mutates.

This split is material: **order type** describes how the ticket was created; **fulfillment type** describes how it will be completed *now*. Conversion changes fulfillment (and table or dispatch binding) without minting a new order id. **Every such conversion is a FlexiSwitch operation.**

### 6.3 Approval gate

Restaurant settings may require approval. New bookings enter `pending`. Front-of-house may **approve** (kitchen stage starts at queued / upcoming) or **reject**. Rejected bookings never enter active kitchen work. Approved bookings with food items become kitchen tickets.

Diners see “Waiting for restaurant” until approval, then the live pipeline. Reservation-only bookings skip food stages and show accepted / seated-complete.

### 6.4 Scheduling and kitchen fire

Restaurant-configurable integers include:

- ASAP prep minutes;  
- reservation duration;  
- pre-order cutoff minutes (block edits or new pre-orders too close to the slot);  
- prep buffer minutes;  
- preparation lead time (when an upcoming ticket becomes fireable).

For a **scheduled** visit at time T:

- kitchen start ≈ T − prep − buffer;  
- estimated ready ≈ T − buffer.

For **ASAP pickup**, kitchen start is now and ready is now + prep.

For **on-the-way reserve and pre-order**, T is the diner’s estimated arrival (from location, declared travel time, or a hybrid). The fire window is recomputed when ETA changes by more than a configured threshold, so the kitchen does not fire too early (food holding) or too late (empty table).

A background or on-access promoter moves tickets from `UPCOMING` to `NEW` when the lead window opens. This keeps the KDS from showing distant tickets as live fire work.

Kitchen transitions are constrained, for example:

`UPCOMING → NEW | PREPARING`  
`NEW → PREPARING`  
`PREPARING → READY`  
`READY → COMPLETED`

Each transition writes the same stage onto the order (and the diner booking), so FOH and diner do not maintain a second source of truth.

### 6.5 Fulfillment conversion (FlexiSwitch)

FlexiSwitch is the conversion layer for the booking. A diner or staff request to change how an existing order is completed **does not create a second cart**. The engine mutates fulfillment type on the same order id and kitchen ticket.

Supported conversion directions (built or planned as embodiments of the same engine):

| From | To | Table | Dispatch | Notes |
| --- | --- | --- | --- | --- |
| Dine-in | Pickup | Release | — | Built in the development engine |
| Pickup | Dine-in | Assign if available | — | Built; fail-closed if no table |
| Pickup | Delivery | — | Create dispatch | Planned; **timeline precaution required** |
| Delivery | Pickup | — | Cancel / recall if allowed | Planned; **timeline precaution required** |

Optional further hops (claim breadth): dine-in ↔ delivery; on-the-way dine-in → pickup or delivery if the diner will not arrive.

Every hop appends to `flexiSwitchHistory` and emits `FLEXISWITCH_APPROVED` / `FULFILLMENT_CHANGED` (or `FLEXISWITCH_REJECTED` when policy or timeline fails).



#### 6.5.1 Dine-in to pickup

Preconditions: order exists, belongs to the restaurant, current fulfillment is dine-in.

Actions (atomic from the diner’s point of view):

1. Append current fulfillment to `flexiSwitchHistory`.
2. Set fulfillment to `PICKUP`; clear `tableId` on the order.
3. If a table was assigned, set that table `AVAILABLE` and clear its current reservation pointer.
4. Update the kitchen ticket in place: fulfillment `PICKUP`, `flexiSwitched = true`, clear table.
5. Append events: `FLEXISWITCH_APPROVED` (note `DINE_IN → PICKUP`), `FULFILLMENT_CHANGED`.

The line items, payment identity, and kitchen queue identity remain the same. The restaurant does not receive a cancellation; the diner does not rebuild a cart.

#### 6.5.2 Pickup to dine-in

Preconditions: restaurant `allowFlexiSwitch` and `allowPickupToDineIn` are true; order is pickup.

Actions:

1. Search tables for the restaurant: prefer `AVAILABLE` with `capacity >= guestCount`; else any available table.
2. If none, **fail closed**: return an error; pickup order and ticket unchanged.
3. If found: append history; set fulfillment `DINE_IN` and `tableId`; mark table `RESERVED` with pointer to the order; update ticket (`DINE_IN`, `flexiSwitched`, table id).
4. Events: `FLEXISWITCH_APPROVED` (`PICKUP → DINE_IN`), `FULFILLMENT_CHANGED`, `TABLE_ASSIGNED`.

Optional embodiments (described for claim breadth, some not yet built): diner-initiated request (`FLEXISWITCH_REQUESTED`) with staff approve/reject; cutoff minutes before slot; conversion charge authorization; recompute `kitchenStartAt` / `estimatedReadyAt` when fulfillment changes (pickup may need a new ready time).

#### 6.5.3 Pickup to delivery and delivery to pickup (planned feature)

These conversions are FlexiSwitch operations on the **same** kitchen-backed booking. They are not a new delivery checkout.

**Pickup → delivery**

1. Receive conversion request (diner or staff) with a delivery address (or a stored address).
2. Run **timeline precaution** (section 6.5.4). If it fails, reject FlexiSwitch; pickup remains collectable.
3. If it passes: append history; set fulfillment `DELIVERY`; attach dispatch metadata (address, promised window, rider assignment when available); update the kitchen ticket in place (`DELIVERY`, `flexiSwitched = true`); change diner labels from collection to out-for-delivery / delivered.
4. Events: `FLEXISWITCH_APPROVED` (`PICKUP → DELIVERY`), `FULFILLMENT_CHANGED`, optional `DISPATCH_ASSIGNED`.

**Delivery → pickup**

1. Receive conversion request.
2. Run timeline precaution: if the rider has already collected or is beyond a recall radius/time, **fail closed** (delivery continues). If the kitchen is already packed for a bag-out that cannot be held at the counter, refuse or require staff override.
3. If it passes: cancel or recall dispatch; set fulfillment `PICKUP`; clear dispatch id; ticket remains the same identity; diner is instructed to collect.
4. Events: `FLEXISWITCH_APPROVED` (`DELIVERY → PICKUP`), `FULFILLMENT_CHANGED`, optional `DISPATCH_CANCELLED`.

#### 6.5.4 Timeline precaution (required for pickup ↔ delivery; applicable to all FlexiSwitch hops)

Before mutating fulfillment, the engine compares **time remaining to complete the new mode** against **time the food and the operation can still support**. Illustrative checks (restaurant-configurable):

1. **Prep remaining:** if kitchen stage is `PREPARING` or earlier, new ready time = now + remaining prep + mode-specific buffer (counter handoff vs rider travel). If the diner’s new promise (pickup window or delivery SLA) is earlier than that ready time, refuse.
2. **Food-hold limit:** if kitchen stage is `READY`, conversion is allowed only while elapsed ready time is within a hold-minutes cap (quality / food-safety). Beyond the cap, refuse or require a remake (which is a different ticket and outside this conversion claim).
3. **Rider window:** pickup → delivery requires a dispatch ETA such that `estimatedReadyAt` and rider arrival at the pass overlap within a configured slack. If no rider can reach the restaurant before hold expiry, refuse.
4. **Recall window:** delivery → pickup is allowed only before rider pickup or within a short post-dispatch cancel window.
5. **Table / arrival window (dine-in hops and on-the-way):** pickup or delivery → dine-in also checks that a table can be held until the diner’s ETA; on-the-way bookings re-run the same precaution if the diner FlexiSwitches while travelling.
6. **Cutoff:** restaurant `preOrderCutoffMinutes` (and a delivery-specific cutoff) may block conversion too close to the original slot.

Fail-closed is the preferred embodiment: a failed precaution leaves the **current** fulfillment and kitchen work intact. Success may **recompute** `kitchenStartAt` and `estimatedReadyAt` for the new mode without changing line items.

### 6.6 Conversion price policies

At partner onboarding the restaurant selects one of:

- **Policy A — One price.** Dine-in and pickup share menu price. Conversion keeps the original ticket total.  
- **Policy B — Pickup offset.** Pickup is priced below dine-in. Switching to dine-in collects the difference at the table (or via a second authorization).  
- **Policy C — Conversion hold.** Pre-order is locked at pickup price. Switching to dine-in adds a listed conversion charge.

The inventive point is that **price policy is bound to the convertible ticket**, not to a new checkout. Implementation may settle immediately, at the table, or as an authorization hold.

### 6.7 Dual projection of status

A kitchen ticket status maps to a front-of-house stage (`pending`, `rejected`, `queued`, `preparing`, `ready`, `completed`) and to diner labels that depend on fulfillment:

- ready → “Ready for pickup” vs “Ready for the table” vs “Ready for dispatch”;  
- completed → “Collected” vs “Served” vs “Delivered”.

Diner notifications (in-app and optional OS notification) fire on those transitions so the guest is pulled to the door or the table when food is actually ready.

### 6.8 Partner onboarding as configuration of the method

Onboarding captures identity and compliance data (illustratively FSSAI, GSTIN, bank rails for an India deployment) **and** operational parameters that drive the engines above: dine-in prep, pickup prep, delivery enablement, fire-ticket minutes, seating capacity, POS type, conversion policy, hold-minutes for FlexiSwitch. Admin approval publishes the restaurant to diner discovery and issues kitchen credentials.

This is claimed as a **configuration embodiment** of the method, not as a business-form patent.

### 6.9 Reserve a table and pre-order on the way (planned FlexiDine service)

This is a first-class booking kind and a stated future commercial service, disclosed now so the provisional covers it.

The diner is **in transit** to the restaurant. In one session the system:

1. Holds a table for the party (capacity and duration as for dine-in).
2. Accepts a pre-order (line items) on that same booking.
3. Derives kitchen fire time from **arrival timeline** (device location, user-entered “I’m X minutes away”, maps ETA, or a combination), not only from a static slot picker.
4. Shows the diner a single status pipeline (waiting / accepted / preparing / ready for the table).
5. If plans change before arrival, **FlexiSwitch** converts the same ticket to pickup or to delivery, subject to timeline precaution (for example: too late to seat, convert to pickup; diner cannot reach the restaurant, convert to delivery).

Unlike a classic reservation (table only) or a classic pre-order (fixed slot), on-the-way demand **couples seating inventory to a moving ETA**. The kitchen is not fired at booking time; it is fired when the ETA enters the restaurant’s lead window. If the diner is delayed, fire is deferred; if they accelerate, fire is advanced, within max-hold and min-prep constraints.

Embodiments include: periodic ETA refresh; geofence (“X km from restaurant → fire”); diner pause (“stuck in traffic” → hold fire and optionally offer FlexiSwitch to pickup).

### 6.10 Implementation notes (do not limit the claims)

The current development build is a Next.js web client using browser storage and local events. The invention is the **method and data model**, not the storage medium. Production embodiments include a server, database, authenticated APIs, POS/KDS adapters, and payment processors. Claims should be written as computer-implemented methods, systems, and computer-readable media.

---



## 7. Advantages

- Plans can change without a cancellation, so kitchen labor is not thrown away.  
- **All conversions run through FlexiSwitch**, so dine-in, pickup, and delivery stay one ticket identity.  
- Table inventory is released or captured as part of the same transaction as fulfillment change.  
- Pickup ↔ delivery is allowed only when **timeline precaution** says the new mode can still be fulfilled.  
- **On-the-way reserve and pre-order** lets a travelling diner send the kitchen ticket without a separate app hop.  
- Pickup / BOPIS avoids rider commission while still using the same paid ticket; delivery remains an optional hop rather than a new order.  
- Restaurants control whether reverse conversion (pickup → table) and delivery hops are allowed.  
- One status pipeline reduces “FOH said ready / diner still waiting” mismatch.  
- Scheduled and ETA-based fire times fill quiet hours without crowding the pass with distant tickets.

---



## 8. Alternative embodiments (for claim breadth)

1. Conversion requested by diner, staff, or automatically (e.g. diner is late beyond a threshold → offer pickup; diner ETA exceeds table hold → offer pickup or delivery).
2. Multi-hop history: dine-in → pickup → delivery, or pickup → dine-in, each hop logged on the same booking.
3. Party split: some guests dine, remainder pickup, same parent booking.
4. FlexiSwitch after kitchen is already `PREPARING` or `READY` (pack-out vs plate vs dispatch bag), gated by hold-minutes.
5. Integration adapters: write converted fulfillment into Toast / Petpooja / POSIST without new SKU.
6. Geographic and currency variants beyond India / INR.
7. Native mobile clients; SMS/WhatsApp as thin clients to the same booking id.
8. Marketplace of multiple restaurants with a diner-level “switch this evening” across venues (narrower, more aggressive claim — discuss with counsel).
9. **Reserve and pre-order on the way** as described in §6.10 (planned service; include in the first provisional).
10. **Pickup ↔ delivery FlexiSwitch** with timeline precaution as described in §6.5.3–6.5.4 (planned feature; include in the first provisional).

---



## 9. What is probably *not* the invention

Do not rest the application on these alone; they are crowded prior art:

- A website that lists restaurants.  
- A generic reservation calendar.  
- A generic kitchen display with columns.  
- Delivery checkout **as a separate cancelled-and-recreated order**.  
- “Log in / log out” UI.  
- Static demo menus or marketing copy.

The likely inventive core is **FlexiSwitch: convertible fulfillment (dine-in, pickup, and delivery) on a single kitchen-backed booking, with table or dispatch inventory and ticket identity preserved, timeline precaution on mode change, timed or ETA-based fire, approval, and on-the-way reserve-plus-pre-order**.

---



## 10. Illustrative claim set (for counsel — not for self-filing)

These are working claims to show scope. A patent agent must rewrite them for the chosen office (India Patents Act / 35 U.S.C.).

### Independent method claim (illustrative)

1. A computer-implemented method comprising:
  receiving a dining booking associated with a restaurant, a diner, a set of line items, a time basis (scheduled slot or travel ETA), and a fulfillment type selected from dine-in, pickup, and delivery;  
   creating or linking a kitchen ticket that shares an identity with the booking;  
   if the fulfillment type is dine-in, associating a table resource with the booking;  
   if the fulfillment type is delivery, associating a dispatch resource with the booking;  
   receiving a FlexiSwitch conversion request to change the fulfillment type to another of dine-in, pickup, and delivery;  
   evaluating a timeline precaution using remaining preparation time, a food-hold limit, and, when the target type is delivery or pickup, a rider or collection window;  
   if the timeline precaution fails, leaving the kitchen ticket and current fulfillment unchanged;  
   if the timeline precaution passes, without cancelling the kitchen ticket or recreating the line items, updating the fulfillment type, updating the kitchen ticket in place, and either releasing or assigning a table resource and/or attaching or cancelling a dispatch resource; and  
   recording a fulfillment-conversion event on the booking.



### Dependent claims (illustrative)

1. The method of claim 1, wherein converting to dine-in is refused and the pickup ticket is left unchanged when no table satisfying the party size is available.
2. The method of claim 1, further comprising computing a kitchen start time as the scheduled time or arrival ETA minus a preparation duration minus a buffer duration.
3. The method of claim 3, further comprising holding the kitchen ticket in an upcoming state until a lead window opens, then promoting the ticket onto an active kitchen board.
4. The method of claim 1, further comprising requiring restaurant approval before the kitchen ticket becomes active.
5. The method of claim 1, further comprising projecting kitchen ticket state to a diner status label that differs for pickup versus dine-in versus delivery completion.
6. The method of claim 1, further comprising applying a restaurant-selected conversion price policy chosen from: unchanged ticket price; collect a dine-in minus pickup difference; or add a listed conversion charge.
7. The method of claim 1, wherein the booking kind is one of reservation-only, reservation-plus-preorder, reserve-and-preorder-on-the-way, pickup, and delivery.
8. The method of claim 1, wherein pickup is ASAP or scheduled, and ASAP uses an immediate kitchen start.
9. The method of claim 1, wherein FlexiSwitch converts pickup to delivery or delivery to pickup only when a rider window and a food-hold limit are both satisfied.
10. The method of claim 1, wherein the booking is created while the diner is travelling and the time basis is a live or periodically refreshed arrival estimate that drives kitchen fire and table hold.
11. A system comprising one or more processors and memory storing instructions that, when executed, perform the method of any of claims 1–11.
12. A computer-readable medium storing instructions that, when executed, perform the method of any of claims 1–11.

---



## 11. Prior-art landscape (for the search memo)

Counsel should run a formal novelty search. Starting queries:

- fulfillment conversion dine-in pickup delivery same order kitchen ticket FlexiSwitch  
- reservation to takeout without cancellation  
- pickup to delivery same ticket timeline / food hold  
- dine-in pre-order while in transit ETA kitchen fire  
- BOPIS restaurant table release on mode switch  
- kitchen display fire time from reservation slot or live ETA  
- “order ahead” switch dining mode

Known adjacent art to distinguish in the specification:

- Delivery apps that cancel and recreate.  
- Reservation apps with no ticket.  
- POS “change order type” used only by staff inside one restaurant, not a diner marketplace with approval, diner-visible pipeline, conversion policy, and timeline-gated pickup ↔ delivery.  
- Grocery BOPIS (no table inventory).  
- Generic “order from the car” without table hold plus ETA-driven fire plus FlexiSwitch.

Record any paper, pitch, or repo README that already disclosed FlexiSwitch publicly — that date matters for novelty.

---



## 12. Current implementation map (evidence of reduction to practice)

For the attorney’s technical appendix; not a limitation of claim scope.


| Concept                                       | Code (development tree)                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------- |
| Booking kinds and kitchen approval            | `lib/bookings.ts`                                                               |
| Order + fulfillment type + conversion history | `lib/orders.ts`                                                                 |
| Kitchen ticket + `flexiSwitched`              | `lib/kitchen.ts`, `lib/kitchen-order-repository.ts`                             |
| Conversion engine (dine-in ↔ pickup) | `lib/flexiswitch.ts` |
| Pickup ↔ delivery + timeline precaution | *Planned — disclose in specification; not yet in the development tree* |
| Reserve and pre-order on the way | *Planned service — ETA-driven fire + table hold; not yet a separate booking kind* |
| Fire timing and upcoming promotion            | `lib/scheduling.ts`                                                             |
| Restaurant policy flags                       | `lib/restaurant-settings.ts`                                                    |
| Event types including FlexiSwitch             | `lib/order-events.ts`                                                           |
| FOH / diner status projection                 | `lib/foh-status.ts`, `lib/diner-status.ts`                                      |
| Conversion price policies A/B/C               | `lib/partner-onboarding.ts`                                                     |
| Partner desks                                 | `components/partner-orders.tsx`, `partner-kitchen.tsx`, `partner-dashboard.tsx` |


Prototype caveat: persistence is currently local to the browser. Reduction to practice of the **method** is shown; a server embodiment should be described in the specification as the preferred commercial form.

---



## 13. Filing plan while the product is still in development

1. **Applicant and inventor recorded as Mamidala Hari Teja** (founder). Complete address and citizenship with counsel. If a company is formed later, execute a written assignment from the inventor to that company.
2. **Engage a patent agent** (India: register with the Patent Office; US: USPTO registration). Ask for a **provisional** first — lower cost, 12-month clock.
3. **Attach FIGS. 1–12** as simple block diagrams (counsel or a drafter can redraw).
4. File **before** a public launch that explains FlexiSwitch in technical detail. Marketing slogans (“plans change”) are weaker disclosure than this document; still, file early.
5. Within 12 months: complete specification, formal claims, and (if international) **PCT**.
6. File **trademarks** for FlexiDine and FlexiSwitch separately — patents do not protect names.
7. Keep a dated lab notebook / git tags of the conversion engine as evidence.
8. Do not add “patent pending” to the site until a filing receipt exists.

Suggested first-filing title for the agent:

> *System and method for converting dining fulfillment among dine-in, pickup, and delivery on a persistent kitchen-backed booking (FlexiSwitch), including on-the-way reserve-and-pre-order*

---



## 14. Open technical points to confirm with inventors before filing

Answer these in writing for counsel; they widen or narrow claims.

1. Who may trigger FlexiSwitch in the commercial product — diner, staff, or both?
2. Is pickup → dine-in a launch feature or optional?
3. Should conversion be blocked after kitchen `READY`, except within a food-hold window?
4. Will payment always be captured before conversion, or can Policy B/C collect later? Does delivery add a rider fee on FlexiSwitch?
5. Is a multi-restaurant “switch the evening” in scope for this first filing?
6. Any third-party code or contractor that might affect inventorship or ownership?
7. Confirm **reserve and pre-order on the way** as a filing embodiment (planned service).
8. Confirm **pickup ↔ delivery** FlexiSwitch with timeline precaution as a filing embodiment (feature to be built).
9. Will delivery use platform riders, restaurant riders, or a third-party dispatch API?

---



## 15. Acknowledgement

This brief was prepared from the FlexiDine development codebase and product definition as of 5 September 2026. It is intended for confidential delivery to patent counsel. It does not create a lawyer–client relationship and does not replace a novelty search or a filed specification.