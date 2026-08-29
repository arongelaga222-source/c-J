---
name: pickleball-booking-pos
description: >-
  Domain logic for the Pickleball Booking and POS system. Use this when you are working on the database, booking validation, role-based workflows, inventory management, or POS checkout logic.
---

# Pickleball Booking & POS Domain Skill

This project is a Pickleball booking and Point of Sale (POS) system. Use the following context and business rules when writing server logic.

## 1. Role-Based Permissions
- **Admin**: Has full access to `/admin` routes. Can manage users, courts, products, and view all bookings.
- **Cashier**: Has access to `/cashier` routes. Can create walk-in bookings and process POS transactions.
- **Customer**: Standard role. Can access `/book` and view their own bookings via `/dashboard`.

*Check `utils/supabase/middleware.ts` for the route guards.*

## 2. Court Booking Logic
- **Availability Check**: Before creating a booking, you must verify that the `court_id` does not have a conflicting booking between `start_time` and `end_time` with a status of `pending` or `confirmed`.
- **Status Lifecycle**: `pending` (awaiting payment/approval) -> `confirmed` (active) -> `completed` (past) -> `cancelled` (user cancelled).

## 3. POS System Logic
- **Cart Calculation**: Calculate totals server-side when completing a transaction. Do not trust client-side prices.
- **Inventory Updates**: When a `pos_transaction` is successfully created with `pos_transaction_items`, decrement the `stock_level` of the corresponding `pos_products`.

## 4. Database Schema Structure
The schema revolves around these primary tables:
- `profiles` (`id`, `full_name`, `role`)
- `courts` (`id`, `name`, `status`)
- `bookings` (`id`, `customer_id`, `court_id`, `start_time`, `end_time`, `status`, `total_amount`)
- `pos_products` (`id`, `name`, `price`, `stock_level`)
- `pos_transactions` (`id`, `cashier_id`, `total_amount`, `payment_method`, `status`)
- `pos_transaction_items` (`id`, `transaction_id`, `product_id`, `quantity`, `price_at_time`)
