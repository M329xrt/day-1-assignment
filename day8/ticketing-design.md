# TicketHub System Design

**Document:** `day8/ticketing-design.md`\
**Purpose:** Design a reliable ticketing website for concerts and
events.

## 1. Requirements

### Functional requirements

-   Visitors can browse, search, and view event details.
-   Visitors can view seat availability and prices.
-   Registered users can temporarily hold available seats.
-   Users can pay for a valid seat hold and receive confirmed tickets.
-   Users can view their orders and tickets.
-   The system expires unpaid holds and releases those seats for other
    buyers.
-   Administrators can create events, configure seats and prices, and
    monitor sales.

### Non-functional requirements

-   **Speed:** Event pages should load quickly from a cache. During a
    major sale, seat and checkout requests should remain responsive;
    show a queue or clear waiting message when capacity is reached.
-   **Correctness:** A seat must never be confirmed for two orders.
    Payment callbacks must be safe to retry without creating duplicate
    orders or charges.
-   **Fairness:** For high-demand sales, use a virtual waiting room with
    a queue token and rate limits. Admit buyers in queue order, prevent
    automated request flooding, and give each admitted buyer a limited
    checkout window. Clearly communicate hold expiry and sale rules.
-   **Availability:** Keep browsing available if checkout is overloaded;
    degrade non-essential features before risking booking correctness.
-   **Security:** Require authentication for holding and buying seats,
    validate prices on the server, protect payment flows, and avoid
    storing card details.
-   **Scalability:** Add stateless application instances and cache
    read-heavy event information.
-   **Auditability:** Record holds, order state changes, payment
    references, and failures for support and investigation.

## 2. Traffic estimates

These are planning estimates, not measured production results.

### Normal day

-   Registered users: **2,000,000**
-   Daily visitors: **50,000**
-   Page views: 50,000 × 10 = **500,000 page views/day**
-   Average page-view rate over 24 hours: 500,000 ÷ 86,400 ≈ **5.8 page
    views/second**
-   Tickets sold: **5,000/day**
-   Average ticket sales rate: 5,000 ÷ 86,400 ≈ **0.058
    tickets/second**, or about 1 ticket every 17 seconds.

Traffic is not evenly distributed. Plan for a normal peak several times
higher than the daily average and measure actual patterns after launch.

### Popular concert sale

-   Buyers competing: **200,000 in 10 minutes**
-   Average arrival rate: 200,000 ÷ 600 ≈ **333 buyer attempts/second**
-   Seats available: **20,000**
-   Demand is **10 buyers per seat** on average.
-   At most 20,000 seats can be sold; at least 180,000 people cannot get
    one of those seats if every seat sells.

This average does not include bursts at the exact on-sale time, repeated
refreshes, seat-map calls, hold attempts, or payment requests. Load-test
at several times the estimated arrival rate and use a waiting room to
smooth bursts.

### Comparison

  -----------------------------------------------------------------------
  Measure                            Normal day              Popular sale
  ------------------- ------------------------- -------------------------
  Page views / buyer     500,000 page views/day 200,000 buyer attempts/10
  attempts                                                            min

  Approximate average 5.8 page views/sec across    333 buyer attempts/sec
  rate                                 24 hours 

  Ticket volume               5,000 tickets/day        Up to 20,000 seats

  Main concern           Efficient browsing and          Sudden overload,
                               routine checkout fairness, seat contention
  -----------------------------------------------------------------------

The popular-sale arrival rate is about 57 times the normal-day average
page-view rate. The comparison is approximate because a page view and a
buyer attempt are different types of requests.

## 3. API design

All endpoints use HTTPS and JSON. Authenticated endpoints require a
session or bearer token. The server---not the browser---decides seat
availability, price, hold expiry, and order status.

  ------------------------------------------------------------------------------------------------------------
  Method and endpoint                    Purpose                 Important behavior
  -------------------------------------- ----------------------- ---------------------------------------------
  `GET /api/events?query=&date=&page=`   Browse/search events    Paginated; cache event summaries

  `GET /api/events/{eventId}`            View event details      Return venue, date, and sale status

  `GET /api/events/{eventId}/seats`      View seats and          Return seat IDs, prices, and status;
                                         availability            availability can change immediately

  `POST /api/holds`                      Hold seats              Body:
                                                                 `{ "eventId": "...", "seatIds": ["..."] }`;
                                                                 atomically reserves seats for a short period
                                                                 and returns `holdId` and `expiresAt`

  `POST /api/orders`                     Create an order from a  Verify the user owns the unexpired hold; use
                                         valid hold              an idempotency key

  `POST /api/orders/{orderId}/payment`   Start payment           Create a payment-provider session; never
                                                                 trust client-supplied totals

  `POST /api/payments/webhook`           Receive payment result  Verify provider signature and process event
                                                                 idempotently

  `GET /api/me/tickets`                  View purchased tickets  Return only tickets belonging to the
                                                                 signed-in user

  `GET /api/holds/{holdId}`              Check hold status       Return status and expiry for the owner
  ------------------------------------------------------------------------------------------------------------

Use standard responses: `200` for successful reads, `201` for created
holds/orders, `400` for invalid input, `401` for unauthenticated
requests, `409 Conflict` when a seat is unavailable or a hold expired,
`429` when rate-limited, and `500` for unexpected server errors. Error
responses should include a stable code and a helpful message.

## 4. Data model

Use a relational database such as PostgreSQL for booking state because
transactions and unique constraints are essential.

### Tables

**`users`** - `id` (primary key) - `name` - `email` (unique) -
`password_hash` - `created_at`

**`events`** - `id` (primary key) - `title` - `venue` - `starts_at` -
`sales_open_at` - `status`

**`seats`** - `id` (primary key) - `event_id` (foreign key →
`events.id`) - `section`, `row_label`, `seat_number` - `price` -
`status` (for example `AVAILABLE`, `HELD`, `SOLD`) - `hold_id` (nullable
reference to the active hold, if modeled separately) - Unique constraint
on `(event_id, section, row_label, seat_number)`

**`orders`** - `id` (primary key) - `user_id` (foreign key →
`users.id`) - `status` (`PENDING_PAYMENT`, `PAID`, `CANCELLED`,
`EXPIRED`) - `total_amount`, `currency` - `idempotency_key` -
`created_at` - Unique constraint on `(user_id, idempotency_key)`

**Supporting tables recommended for production**

-   `holds(id, user_id, event_id, status, expires_at, created_at)` ---
    one hold can cover multiple seats.
-   `order_items(id, order_id, seat_id, price_at_purchase)` --- links
    orders to seats and records the price paid.
-   `payments(id, order_id, provider_reference, status, amount)` ---
    unique provider reference prevents duplicate payment processing.
-   `tickets(id, order_item_id, ticket_code, issued_at)` --- unique
    ticket code.

### Relationships

-   One user can create many orders and holds.
-   One event has many seats and many holds.
-   A hold belongs to one user and event, and can contain multiple
    seats.
-   One order has many order items; each order item refers to one seat.
-   A paid order can have tickets issued for its order items.
-   A payment is associated with an order; provider references are
    unique.

## 5. Preventing two people from buying the same seat

**Do not rely on the seat map in the browser.** Two buyers may see the
same seat as available at the same moment. The database must decide who
wins.

1.  When a buyer requests a hold, start a database transaction.
2.  Lock the requested seat rows using `SELECT ... FOR UPDATE` (in a
    consistent seat-ID order to reduce deadlocks), or perform a
    conditional atomic update such as
    `UPDATE seats SET status='HELD' ... WHERE id=? AND status='AVAILABLE'`.
3.  Confirm that every requested seat was successfully changed. If any
    seat is unavailable, roll back the entire transaction so the buyer
    does not get only part of a multi-seat selection unexpectedly.
4.  Create a hold with an expiry time, then commit. Only the successful
    transaction owns the hold.
5.  When payment succeeds, use another transaction to verify that the
    hold is still valid and belongs to the buyer, change the seats to
    `SOLD`, and mark the order paid. Enforce a database-level uniqueness
    rule so a seat cannot appear in more than one active/paid order item
    (for example, a partial unique index on `order_items(seat_id)` for
    orders in a confirmed state, or a dedicated one-row-per-seat
    allocation table with a unique `seat_id`).
6.  Expire holds safely with a background worker. It may release a seat
    only if the seat is still linked to that same expired hold; it must
    not release a seat that has since been sold or re-held.

The transaction, row lock/conditional update, and unique constraint
provide overlapping layers of protection. Payment webhooks and order
creation must be idempotent: if the provider retries a notification, the
system records the result once. Never mark a seat sold merely because
the browser says payment succeeded.

## 6. Architecture

``` mermaid
flowchart TD
    U[Buyers / Browsers] --> CDN[CDN and WAF]
    CDN --> Q[Virtual Waiting Room / Rate Limiter]
    Q --> LB[Load Balancer]
    LB --> API[Stateless API Instances]
    API --> C[Cache: event summaries]
    API --> DB[(PostgreSQL primary)]
    API --> PAY[Payment Provider]
    PAY --> WH[Payment Webhook Handler]
    WH --> API
    API --> MQ[Queue / Background Jobs]
    MQ --> EXP[Hold Expiry Worker]
    MQ --> MSG[Email / Ticket Notifications]
    API --> OBS[Logs, Metrics, Tracing, Alerts]
    EXP --> DB
```

### Components and how they help during the big sale

-   **CDN and WAF:** Serve static files and protect against common
    attacks. Cache public event information close to users.
-   **Virtual waiting room and rate limiter:** Smooth the 200,000-person
    rush, issue queue tokens, and control admission into checkout. Keep
    queue policy transparent and consistent.
-   **Load balancer:** Distributes admitted requests across API
    instances and removes unhealthy instances.
-   **Stateless API instances:** Validate requests and apply business
    rules. Scale horizontally; keep session state in signed tokens or
    shared storage, not local memory.
-   **Cache:** Speeds up event descriptions and other read-heavy data.
    Do not treat cached seat availability as authoritative for booking.
-   **PostgreSQL:** Source of truth for holds, seats, orders, and
    payment state. Transactions, row locks, and constraints preserve
    correctness. Monitor connection limits and use a connection pool.
-   **Payment provider and webhook handler:** Process card payments
    without storing card details. Verify signed callbacks and safely
    handle retries or delayed results.
-   **Queue and background workers:** Expire holds and send
    notifications outside the critical checkout request. Jobs should be
    retryable and idempotent.
-   **Observability:** Track queue length, latency, error rate, database
    lock waits, failed payments, and seat-hold conflicts. Alert before
    the service becomes unavailable.

**Sale-day operating plan:** Pre-warm event caches, load-test before the
on-sale time, open the waiting room early, cap concurrent checkout
sessions to what the database and payment provider can handle, and show
clear queue/hold-expiry messages. Keep seat allocation in the
transactional database; adding more API servers alone cannot solve
contention on the same limited seats.

## 7. Trade-offs

1.  **Relational database vs. a distributed NoSQL store.** PostgreSQL
    transactions and constraints make exclusive seat allocation easier
    to reason about. The trade-off is that heavily contended seats and
    write traffic can create lock waits and limit write throughput.
    Start with one authoritative primary, tune transactions and pooling,
    and consider partitioning by event only when measured load justifies
    the added complexity.
2.  **Virtual queue vs. instant access.** A queue smooths traffic and
    can make access fairer, but buyers must wait and the queue itself
    must be transparent, resilient, and resistant to bots. Publish queue
    rules and avoid giving refresh-happy clients an advantage.
3.  **Short seat holds vs. a convenient checkout.** Short holds return
    unsold seats quickly and reduce inventory being blocked by abandoned
    carts, but give buyers less time to pay. Make the countdown visible
    and choose a duration based on payment-flow testing.
4.  **Cache reads vs. live seat availability.** Caching event pages
    reduces load and improves speed, but seat maps may briefly be stale.
    Label availability as provisional and always recheck and reserve
    seats transactionally on the server.

## Conclusion

TicketHub should scale read-heavy browsing separately from checkout,
smooth high-demand traffic with a fair waiting room, and treat the
relational database as the final authority for seat allocation. The key
guarantee is enforced by transactions and database constraints---not by
what a buyer's browser displays.
