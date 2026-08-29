# CoreTech — ERP + E-Commerce Frontend

## 👥 Group Members

This project was developed by:
Arjay Labutin,
Patrick Lazarra,
Renz Llamado,
Alfonso Alayon,
Andrew Bensurto,



**System Integration and Architecture 101 (SIA 101)**

**Bachelor of Science in Information Technology (BSIT)

## Interfaces
1. Customer e-commerce: products, search, cart, checkout demo, orders.
2. Admin ERP: dashboard, products, inventory, orders, customers, suppliers, sales, reports.

## System Integration demo (redesign, Aug 2026)
The storefront and the admin ERP now read from one shared source (`js/data.js` + `js/customer.js`)
instead of the admin side showing separately hard-coded numbers. Placing a demo order on the
storefront immediately:
- decrements the shared product stock (used by both the storefront cards and Admin → Inventory),
- appends to the shared order log (used by both Admin → Orders and the Dashboard stats),
- updates the "System Integration" status strip shown at the top of every page, live, including
  across browser tabs (via the `storage` event) — no page refresh needed.

This is meant as a working illustration of the SIA 101 lecture point that integrated systems
share data automatically instead of operating in silos with manual re-entry between them.

Visual design was also reworked: a single design system (`css/app.css` for the storefront,
`css/admin-modern.css` layered on the existing `css/style.css` for the admin ERP) replaces the
old mix of three overlapping stylesheets, aligns every product image to a consistent frame, and
gives buttons a clear primary/secondary hierarchy throughout.

## Current term
No real database, backend, authentication server, or payment gateway. Product information is JavaScript mock data. Cart, demo orders, and stock adjustments use browser localStorage as a stand-in for a shared database.

## Future term
Frontend → Backend/API → Database. Suggested tables: users, products, categories, inventory, suppliers, orders, order_items, customers, purchases, sales.

## Demo login
Admin: admin@CoreTech.com / admin123
Customer: customer@example.com / 123456

## Run
https://patricklazarra604.github.io/ERP-front-end/CoreTech_SIA%20101/


## Product images
the images are downloaded from the internet.
