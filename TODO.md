# M-Pesa Integration TODO

## Completed Tasks:
- [x] Analyze existing codebase and understand the M-Pesa flow
- [x] Verify Orders API returns mpesaCheckoutRequestID
- [x] Verify Orders/[id]/API returns isPaid status

## Pending Tasks:
- [ ] Update checkout page to show "Processing Payment" state
- [ ] Add polling mechanism to check payment status
- [ ] Show appropriate UI: Instructions to check phone, payment success, or payment failed
- [ ] Handle timeout and payment failure scenarios

## Files to Edit:
- `app/checkout/page.js` - Main checkout UI with M-Pesa integration
