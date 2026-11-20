# morocco-visa-agency.demo.orchestrate.ca

Built live by the Orchestrate Solutions agent team in an Orchestrate demonstration. Static site: HTML, CSS and JavaScript,
no build step, no external libraries or fonts.

## What it is
A fictional Morocco travel-visa help service that sells services, guides and walkthroughs. Guide pages carry general
information only (not legal, tax or immigration advice), with an as-of date and the official source for each rule.

## Shop
- Services and prices live in `shop/catalog.json`; the shop service at `api/shop/` prices every quote and order.
- **Payments are test payments only. No real money moves.** (Stripe test mode or the sandbox.)
- Shared code: `js/shop/core.js` (`window.Shop`: API client, catalog, cart, money, toasts) and `css/shop/core.css`.
- Browser state is kept in `localStorage` under `shop:<site>:` (cart, customer, orders, wallet, profile).

## My purchases is a demo gate
Bought guides unlock in the browser from the order tokens kept in `localStorage`. This is a demo gate, **not real
protection**: anyone with the guide's link or the browser's storage can open it.

## Pages
`index.html`, `pages/services.html`, `pages/checkout.html`, `pages/order.html`, `pages/account.html`, `pages/guides/*.html`.
