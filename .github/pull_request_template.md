## What does this PR do?

<!-- Brief description of the changes -->

## Module(s) affected

<!-- Check all that apply -->
- [ ] Auth
- [ ] Merchant
- [ ] Product
- [ ] RFQ
- [ ] Quote
- [ ] Order
- [ ] Payment
- [ ] Inventory
- [ ] Notification
- [ ] Frontend
- [ ] Shared
- [ ] Infrastructure

## Type of change

- [ ] New feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Documentation
- [ ] Tests

## Checklist

- [ ] My code builds without errors (`pnpm build`)
- [ ] I've tested this locally
- [ ] I haven't added features outside V1 scope
- [ ] All money values use BigInt kobo (not floats)
- [ ] Merchant-scoped queries include merchantId filter
- [ ] No direct inventory mutations (events only)
- [ ] No business logic in controllers (services only)
- [ ] No `.env` files or secrets in this PR
- [ ] No `console.log` left in code (except health/dev logging)

## How to test

<!-- Steps for reviewer to verify the changes -->

## Screenshots (if frontend)

<!-- Add screenshots for UI changes -->
