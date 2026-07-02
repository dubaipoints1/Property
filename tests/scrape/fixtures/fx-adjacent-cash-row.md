# FX fee directly below a cash-withdrawal table row — fixture

Distilled from the CBD One KFS shape (2 July 2026): in a fees table the
legitimate credit-card FX row sits on the line directly under the cash
withdrawal row. The anti-trigger context must not bleed across rows and
reject the FX line. (No "Annual fee" header block here on purpose — this
fixture targets parseFxFee, not the C6 multi-tier SOF heuristic.)

| Card Replacement Fee | AED 78.75 |
| Cash Withdrawal Fee | AED 204.75 |
| Foreign Currency Transaction Fee(or)Dynamic CurrencyConversion Fee | 3.5% |
| Credit Shield Insurance(optional) | 1% |
