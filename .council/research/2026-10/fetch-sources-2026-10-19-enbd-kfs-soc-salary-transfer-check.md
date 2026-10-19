# Source archive — ENBD credit-card KFS and Schedule of Charges (salary-transfer check)

Purpose: test `eligibility.salaryTransferRequired: true` on `emirates-nbd-visa-infinite`
against the two documents the product page links under "Important links and documents"
(product page archived at `firecrawl-2026-10-19-emirates-nbd-visa-infinite.md`).

Channel: free reader, `fetch-sources.yml` run 39277028389 (job 118143968076),
dispatched on main 2026-10-19 15:20 UTC. PDFs through `pdftotext`. No Firecrawl
credits, no LLM extraction. Text below is the job log verbatim (GitHub timestamps
stripped, runs of spaces collapsed, blank lines dropped). The Arabic half of the
Schedule of Charges duplicates the English and is omitted.

- https://cdn.emiratesnbd.com/enbd/files/pdf/kfs_credit_cards_horizontal_em_new.pdf — status 200, application/pdf, read 2026-10-19T15:20:49.881Z (document footer "08/2026")
- https://www.emiratesnbd.com/-/media/enbd/files/credit-cards/emiratesnbd_credit_card_fees_charges.pdf — status 200, application/pdf, read 2026-10-19T15:20:50.086Z (document dated "February 2026")

## Finding

**Neither document mentions a salary transfer, for or against.** A case-insensitive
search of the full log for "salary" returns nothing; "transfer" matches only
"Balance Transfer" (an instalment product). The KFS sets fees, APR, finance
charges and the FX fee per card and has no eligibility section. The Schedule of
Charges is a price guide only. The requirement therefore stays unverified either
way, and L2 is **not** changed on this evidence.

Figures that match L2 for the Visa Infinite ("Infinite" column): joining fee
1,575, renewal fee 1,575, APR 39.00%; "Infinite/Priority Banking Infinite 1,575
3.25%" in the Schedule of Charges; "1.99% currency conversion fee is charged to
the Card Account for all transactions incurred outside UAE".

---

===== SOURCE https://cdn.emiratesnbd.com/enbd/files/pdf/kfs_credit_cards_horizontal_em_new.pdf
status: 200 · final: https://cdn.emiratesnbd.com/enbd/files/pdf/kfs_credit_cards_horizontal_em_new.pdf · type: application/pdf · read: 2026-10-19T15:20:49.881Z
  Key Facts Statement (KFS)
  Credit Cards
  A Credit Card lets you borrow funds to pay for your purchases. This KFS provides indicative information about key features, fees and charges of this product.
  Credit Card Type
  Skywards Infinite  SHARE Private  SHARE Infinite  UBE Infinite  Darna Infinite Privilege  Darna Infinite  Marriott Bonvoy World Elite  Marriott Bonvoy World  Infinite
  3,148.95  1,575  1,575  2,625  2,625  1,575  1,575  315  1,575
  Joining  Priority Banking Infinite Voyager World Elite Voyager World Etihad Guest Limitless/Elevate dnata World Skywards Signature SHARE Signature  Etihad Guest Inspire Darna Signature
  Fee (AED)  Free  2,098.95  Free  2,625  1,048.95  1,573.95  Free  1,575  315
  UBE Signature  Visa Flexi  Lulu 247 Platinum  Darna Select  Lulu 247 Titanium  noon One  Duo  dnata Platinum  Platinum  Go4it Platinum  Go4it Gold  SHARE Platinum
  525  735  525  Free  Free  Free  840  525  735  208.95  103.95  Free
  UBE Family  Titanium  Man United  Business Rewards  Business Card  Webshopper  Chairman Card
  Free  420  262.50  1,575  787.50  52.50  8,000
  Credit Card Type
  Skywards Infinite  SHARE Private  SHARE Infinite  UBE Infinite  Darna Infinite Privilege  Darna Infinite  Marriott Bonvoy World Elite  Marriott Bonvoy World  Infinite
  1,575  1,575  1,575  1,575  2,625  1,575  1,575  315  1,575
  Renewal  Priority Banking Infinite Voyager World Elite Voyager World Etihad Guest Limitless/Elevate dnata World Skywards Signature SHARE Signature  Etihad Guest Inspire Darna Signature
  Fee (AED)  1,575  1,575  315  1,575  1,048.95  735  Free  735  315
  UBE Signature  Visa Flexi  Lulu 247 Platinum  Darna Select  Lulu 247 Titanium  noon One  Duo  dnata Platinum  Platinum  Go4it Platinum  Go4it Gold  SHARE Platinum
  262.50  735  262.50  Free  Free  Free  840  525  735  208.95  103.95  Free
  UBE Family  Titanium  Man United  Business Rewards  Business Card  Webshopper  Chairman Card
  Free  420  262.50  1,050  787.50  52.50  8,000
  08/2026
Emirates NBD Bank PJSC is licensed by Central Bank of the UAE. This Key Facts Statement is a UAE Central Bank directive under the Consumer Protection Regulation and accompanying Standards. Copyright© 2026 Emirates NBD Bank PJSC. All Rights Reserved.
  Credit Card Type
  Skywards Infinite  SHARE Private  SHARE Infinite  UBE Infinite  Darna Infinite Privilege  Darna Infinite  Marriott Bonvoy World Elite  Marriott Bonvoy World  Infinite
  39.00%  39.00%  39.00%  39.00%  39.00%  39.00%  39.00%  44.28%  39.00%
  APR  Priority Banking Infinite Voyager World Elite Voyager World Etihad Guest Limitless/Elevate dnata World Skywards Signature SHARE Signature  Etihad Guest Inspire Darna Signature
  (% p.a.)  39.00%  39.00%  44.28%  39.00%  39.00%  44.28%  44.28%  44.28%  44.28%
  UBE Signature  Visa Flexi  Lulu 247 Platinum  Darna Select  Lulu 247 Titanium  noon One  Duo  dnata Platinum  Platinum  Go4it Platinum  Go4it Gold  SHARE Platinum
  44.28%  44.28%  44.28%  44.28%  44.28%  44.28%  44.28%  44.28%  44.28%  44.28%  44.28%  44.28%
  UBE Family  Titanium  Man United  Business Rewards  Business Card  Webshopper  Chairman Card
  44.28%  44.28%  44.28%  39.00%  39.00%  44.28%  39.00%
  Important Terms and Charges
  Minimum Payment Due  You must pay the Minimum Payment Due by the Payment due date each month. Minimum payment is calculated as 5% of the total payment due or
  AED 100, whichever is higher, plus following amount in full, if applicable:
  • Installments
  • Insurance
  • Overdue amount
  • Overlimit amount
  Please note, if the current balance is less than AED 100, it must be paid in full.
  Finance Charge  The Finance Charge may vary based on the type of Credit Card and the transaction:
  • Retail Purchases: Up to 44.28% annum (3.69% per month).
  • Cash Advance: Up to 44.28% annum (3.69% per month).
  • For all UAE Nationals, a finance charge of 39% per annum (i.e. 3.25% per month). will be uniformly applicable across all products for both Retail
  Purchases and Cash Advance
  The above is levied if you:
  1. Pay Emirates NBD an amount less than the Total Amount Due by the Payment Due Date;
  2. Have taken a Cash Advance;
  3. Effect any other Credit Card Transaction that Emirates NBD may determine from time to time, which is subject to a Finance Charge.
  • The applicable Finance Charge will be applied on unpaid Credit Card Transactions from the date of the Credit Card Transaction, at the rate
  mentioned in the Schedule of Charges (or otherwise communicated to the Cardholder), until the total payment due is paid in full.
  08/2026
Emirates NBD Bank PJSC is licensed by Central Bank of the UAE. This Key Facts Statement is a UAE Central Bank directive under the Consumer Protection Regulation and accompanying Standards. Copyright© 2026 Emirates NBD Bank PJSC. All Rights Reserved.
  • If you do not pay the total payment due, in full on or before the payment due date, we may charge, without prior notice, a finance charge on
  balance amount, even if you have paid the minimum payment due in full.
  • If you do not pay the total payment due, for two cycles, interest charges will be applicable on the current balance as noted in the previous month’s
  Statement of Account as well as on all new transactions (from the respective transaction date) till such time as the total payment due is paid in full
  including all Interest Charges and fees levied on the Card Account.
  Cash Advance Fee  3.15% of cash advance amount or AED 103.95 whichever is higher will be charged for each Cash Advance transaction. Maximum cash advance is
  75% for Business Cards & 50% of the card limit for all other cards.
  Payment Due Date from  Payments are due within 25 days post statement date
  Statement of Account Date
  Interest-free period  25 to 55 days from the Credit Card Transaction date (subject to payment in full of the Total Amount Due by the Payment Due Date) with an exception
  if the previous month’s balance not been cleared in full, or if Cash Advance or any other product has been availed that is excluded from the interest
  free period.
  Late Payment Fee  AED 241.50 per month will be charged to the Card Account if the Minimum Payment Due is not paid, by the Payment Due Date.
  Over Limit Fee  AED 292.95 per month will be charged to the Cardholder’s Credit Card Account, if at any time or during the billing cycle, the current balance in the
  Card Account exceeds the Credit Limit assigned and will become payable as part of the Minimum Payment Due and the Over Limit Amount will be
  payable immediately.
  Replacement Card Fee  AED 52.50 for Go4it cards | AED 21.00 for all other cards
  Installment Payment Plan,  Up to 3.46% reducing monthly interest rate (up to 41.52% per annum)
  Balance Conversion,
  Loan on Card, Balance  The above is levied if you have accepted an interest-bearing Installment plan/ Balance Conversion/ Loan on Card/ Balance Transfer or ALOC on
  your Credit Card. One time Processing fees up to 5% will apply in case of 0% Interest bookings.
  Transfer and Advance
  Loan on Card (ALOC)  0% Installment Plan Processing Fees - AED 51.45 per transaction
  Your first installment will be due from the second card statement following the booking date. The principal amount and the accrued interest up to
  the second card statement date will be included in the subsequent installments starting from the second card statement.
  The processing fee will be charged in your first card statement after the booking.
  Installment Cancellation /  1.05% of the principal outstanding will be levied as a cancellation fee if an Installment Plan / Balance Conversion / Loan on Card / Balance Transfer /
  Pre-closure Fee  ALOC / 0% Installment Plan are early settled.
  No Liability / Liability Letter  AED 52.50 will be charged for an issuance of No Liability / Liability letter
  Foreign currency  1.99% currency conversion fee is charged to the Card Account for all transactions incurred outside UAE. All such transactions are converted to AED
  transaction fees  at the prevailing exchange rate on the date the amount was posted to the Card Account rather than the date the Card was used. This fee is charged
  on all foreign currency transactions on the Credit Card. This fee is charged in addition to the standard processing fee charged by MasterCard
  08/2026
  International or Visa International and is applicable to transactions performed outside UAE (approximately 1.15%).
Emirates NBD Bank PJSC is licensed by Central Bank of the UAE. This Key Facts Statement is a UAE Central Bank directive under the Consumer Protection Regulation and accompanying Standards. Copyright© 2026 Emirates NBD Bank PJSC. All Rights Reserved.
  Fee relating to settling  1.99% currency conversion fee is charged for transactions where customers may sometimes be offered the option to settle a foreign currency
  Foreign currency transaction transaction in UAE Dirhams at the point of sale overseas. Such option is a direct arrangement offered by the overseas merchants and not the bank
  in UAE dirhams  (card issuer). In such cases, customers are reminded to ask the merchants for the foreign currency exchange rates and the percentage of handling
  fees to be applied before the transactions are entered into since settling foreign currency transactions in UAE Dirhams may involve a cost higher
  than the foreign currency transaction fee.
  Return Payment Fee  AED 105 surcharge will be levied towards handling charge on Returned Cheque / Direct Debit
  Duplicate Statement Copy  Up to last 3 Months AED 15.75 and AED 47.25 per month for over 3 Months
  Credit Sheild Pro  Credit Shield Pro is an optional service which covers your Credit Card outstanding balance against any emergencies.
  The Credit Shield fee is 1.04% of the total amount outstanding at billing cycle. Please refer to
  https://www.emiratesnbd.com/en/cards/credit-shield-pro for further details
  Annualised Percentage Rate (APR) for Purchase Illustration (APR 44.28%)
  Transaction  AED
  Purchase on 1 January  2,000
  Statement Date: 6 January
  Total Amount Due as of statement dated 6th January  2,000
  Minimum Amount Due as of statement dated 6 January  th
  100
  Payment Due Date: 31 January
  Minimum Payment by customer on the payment due date  100
  On statement Date: 6 February, following interest charges will be levied:
  Interest on AED 1,900 for 31 days (from 7 January - 6 February)  71.45
  Total interest charged in the statement dated 6 February 2024  71.45
  Statement Date: 6 February
  08/2026
  Total Amount Due as of statement dated 6 February  1971.45
  Minimum Amount Due as of statement dated 6 February  100
Emirates NBD Bank PJSC is licensed by Central Bank of the UAE. This Key Facts Statement is a UAE Central Bank directive under the Consumer Protection Regulation and accompanying Standards. Copyright© 2026 Emirates NBD Bank PJSC. All Rights Reserved.
  Transaction  AED
  Payment Due Date: 2 March
  Minimum Payment by customer on the payment due date  100
  On statement Date: 6 March, following interest charges will be levied:
  a) Interest on AED 1,900 for 25 days (from 7 February - 2 March)  57.62
  b) Interest on AED 1,800 for 4 days (from 3 - 6 March)  8.73
  Total interest charged in the statement dated 6 March  66.36
  Statement Date: 6 March
  Total Amount Due as of statement dated 6 March  1937.81
  Minimum Amount Due as of statement dated 6 March  100
  Payment Due Date: 31 March
  Full Payment by customer after the statement on 10 March  1937.81
  *On statement Date: 6 April, following interest charges will be levied:
  Interest on AED 1,800 for 4 days (from 7 - 10 March)  8.73
  Total interest charged in the statement dated 6 April  8.73
  For 3.25% Interest (39.00%): In the case of an AED 2,000 credit balance with an 39.0% annual rate, with a minimum monthly payment of 5% of the balance, or AED 100, whichever is greater, it
  would take 32 months or just under 3 years to pay off. The total interest payable would be approximately AED 1,200.
  For 3.69% Interest (44.28%): In the case of an AED 2,000 credit balance with an 44.28% annual rate, with a minimum monthly payment of 5% of the balance, or AED 100, whichever is greater, it
  would take 36 months to pay off. The total interest payable would be approximately AED 1,500.
  Effective 1 March 2026
  08/2026
Emirates NBD Bank PJSC is licensed by Central Bank of the UAE. This Key Facts Statement is a UAE Central Bank directive under the Consumer Protection Regulation and accompanying Standards. Copyright© 2026 Emirates NBD Bank PJSC. All Rights Reserved.
  Installment Plan Illustration (APR 24%)
  Transaction  AED
  Installment Booked on 15 June  10,000
  Repayment Period  12
  Annualized Installment Interest Rate  24.00%
  Statement Date: 6 July
  Total Amount Due as of statement dated 6 July  0
  Minimum Amount Due as of statement dated 6 July  0
  Payment Due Date: 31 July
  Minimum Payment by customer on the payment due date  0
  On statement Date: 6 August, following EMI billed and interest charges will be levied:
  a) Interest on AED 10,000 for first statement cycle dated 6 July  200
  b) Interest on AED 10,000 for second statement cycle dated 6 August  200
  Total interest charged in the statement dated 6 August  400
  Principal amount for second statement cycle dated 6 August  564.14
  First EMI Billed in the statement dated 6 August (including Interest Billed)  964.14
  Payment Due Date: 31 August
  Minimum Payment by customer on the payment due date  964.14
  On statement Date: 6 September, following EMI billed and interest charges will be levied:
  c) Interest on AED 9,435.86 for 30 days for third statement cycle dated 6 September  188.72
  Total interest charged in the statement dated 6 September  188.72
  Principal amount for third statement cycle dated 6 September  775.42
  Second EMI Billed in the statement dated 6 September  964.14
  Payment Due Date: 31 September
  Minimum Payment by customer on the payment due date  964.14
  Note: In the case of an AED 10,000 Installments with 24.00% Annual rate and 12 months Repayment period, with a fixed monthly installment of AED 964.14, the total amount payable will be
  AED 11,569.64 and total interest amount of AED 1,569.64.
  08/2026
  Effective date 5 March 2026.
Emirates NBD Bank PJSC is licensed by Central Bank of the UAE. This Key Facts Statement is a UAE Central Bank directive under the Consumer Protection Regulation and accompanying Standards. Copyright© 2026 Emirates NBD Bank PJSC. All Rights Reserved.
  Additional Information
  • The Bank reserves the right to amend the Special Features and Bank’s General Terms and Conditions for Consumer Banking Products ("GTCs") (including any relevant applications
  and documents) by notice to you in accordance with applicable law. In case of any inconsistency between the terms of this KFS and the GTCs, the terms in KFS will prevail.
  • The Bank reserves the right to change the Terms and Conditions and fees and Charges mentioned in the SoF (Schedule of Fees) by providing sixty (60) days’ notice to the Customer
  on the Customer’s registered email/SMS on the Customer’s registered mobile number or any other means decided by Emirates NBD, from time to time, in accordance with the
  Applicable Laws and the GTCs, available on the Banks’ website emiratesnbd.com
  (https://www.emiratesnbd.com/en/-/media/enbd/files/others/fees-andcharges/ accounts/generaltermsandconditions.pdf)
  • The cooling-off period allows you to cancel the product within five (5) business days of signing the application or offer letter and the Bank will not be able to proceed until this period
  expires, unless you waive this right. To cancel within this period you must give the Bank notice.
  • The Bank may debit the Customer’s account with any charges, expenses, or commission payable against the banking services rendered in accordance with the approved and
  announced banking charges and commissions, as notified to the Customer from time to time.
  • Bank does not charge interest on accrued interest.
  • There may be circumstances in which you have to pay other fees. You may visit this link to view these other fees: https://www.emiratesnbd.com/en/schedule-of-fees-and-charges.
  • You can contact the Bank for any enquires, assistance or complaints at any of its branches or by visiting its website:
  https://www.emiratesnbd.com/en/help-and-support/contact-us.
  Important Links
  For full and latest fees & charges and other product details please visit our website www.emiratesnbd.com/kfs or scan QR code
  Warning !!!
  If you do not meet the repayments on your credit card, your account will go into arrears and incur late payment fees. This may affect your credit score, which may limit your ability
  to access financing in the future.
  Warning !!!
  If you make only the minimum repayment each period, you will pay more in interest, and it will take you longer to pay off your outstanding balance.
  08/2026
Emirates NBD Bank PJSC is licensed by Central Bank of the UAE. This Key Facts Statement is a UAE Central Bank directive under the Consumer Protection Regulation and accompanying Standards. Copyright© 2026 Emirates NBD Bank PJSC. All Rights Reserved.
  Warning !!!
  Bank may authorize specific transactions to surpass the credit limit. Customers will be responsible to clear the over limit amount immediately to avoid overlimit charges.
  Warning !!!
  Bank may not validate CVV (the 3rd digit number printed on the back of the card) for some transactions when there are other authentication options available such as OTP or
  Biometrics.
  Warning !!!
  In case of lost or stolen card, customer will remain liable to pay for all the transactions done before the card blocking.
  Warning !!!
  In case you fail to fulfill your obligations as per the product Terms and Conditions, before and during your relationship with us, there will be consequences including, but not limited
  to penalties.
  Warning !!!
  You are required to provide the Bank with copies of your updated documents at all times. Not providing these documents might result in the charges, transactions being restricted,
  account being blocked, or account being closed.
  Warning !!!
  Any other accounts you have with the Bank may be used to set off against amounts owed under your credit card(s).
  08/2026
Emirates NBD Bank PJSC is licensed by Central Bank of the UAE. This Key Facts Statement is a UAE Central Bank directive under the Consumer Protection Regulation and accompanying Standards. Copyright© 2026 Emirates NBD Bank PJSC. All Rights Reserved.
 I/We hereby irrevocably and unconditionally declare that I/ we have read the above Key Facts Statement and clearly understand all the information and references
 provided herein.
 Customer Name:  Customer Signature:  Date:
  08/2026
Emirates NBD Bank PJSC is licensed by Central Bank of the UAE. This Key Facts Statement is a UAE Central Bank directive under the Consumer Protection Regulation and accompanying Standards. Copyright© 2026 Emirates NBD Bank PJSC. All Rights Reserved.

===== END https://cdn.emiratesnbd.com/enbd/files/pdf/kfs_credit_cards_horizontal_em_new.pdf
===== SOURCE https://www.emiratesnbd.com/-/media/enbd/files/credit-cards/emiratesnbd_credit_card_fees_charges.pdf
status: 200 · final: https://www.emiratesnbd.com/-/media/enbd/files/credit-cards/emiratesnbd_credit_card_fees_charges.pdf · type: application/pdf · read: 2026-10-19T15:20:50.086Z
 Credit Card Services and Price Guide (Inclusive of VAT)1
  Primary Card  Annual Fee3 (AED)  Finance Charges2 (per month)
  SHARE Private/Infinite/Signature/  1,575/1,575/Free/
  3.25%/3.25%/3.69%/3.69%
  Platinum  Free
  U by Emaar Infinite/Signature/Family  1,575/262.50/Free  3.25%/3.69%/3.69%
  Darna Infinite Privilege/Infinite/Signature/  2,625/1,575/315/
  3.25%/3.25%/3.69%/3.69%
  Select  Free
  Skywards Infinite/Signature  1,575/735  3.25%/3.69%
  Voyager World Elite/Voyager World  1,575/315  3.25%/3.69%
  Marriott Bonvoy® World Elite/World
  1,575/315  3.25%/3.69%
  Mastercard®
  Etihad Guest Visa Limitless/Elevate/Inspire  1,575/1,575/735  3.25%/3.25%/3.69%
  Infinite/Priority Banking Infinite  1,575  3.25%
  Flexi  735  3.69%
  LuLu 247 Platinum/Titanium  262.50/Free  3.69%
  noon One Visa Credit Card  Free  3.69%
  dnata World/Platinum  1,048.95/525  3.25%/3.69%
  Duo/Platinum  840/735  3.69%
  Titanium  420  3.69%
  Manchester United Titanium  262.50  3.69%
  Go4it Platinum/Gold  208.95/103.95  3.69%
  Business Rewards/Business Cards  1,050/787.50  3.25%
  Webshopper Card  52.50  3.69%
  Chairman Card  8,000  3.25%
  Other Fees and Charges
  Credit Shield Pro Insurance  1.04% per month of the Current Balance
  Installment Payment Plan/Balance
  0.29% - 1.99% flat monthly interest rate
  Conversion/Loan on Card/Balance
  (0.53% - 3.46% reducing monthly interest rate)
  Transfer/ALOC
  0% Installment Plan  AED 51.45 per transaction
  Cancellation Fee: Installment Plan/
  Balance Conversion/Loan on Card/  1.05% of Principal Outstanding
  Balance Transfer/ALOC/0% IPP
  Cash Advance Fee  3.15% or AED 103.95 or whichever is higher
  Over Limit Fee  AED 292.95 per month
  Late Payment Fee  AED 241.50 per month
  International Transaction Fee
  1.99% of Transaction Amount
  (Purchases in Non-AED/ AED Currency4)
  Card Replacement Fee: Go4it/Others  AED 52.50/AED 21
  International Delivery Charge  AED 157.50 per Credit Card
  Cheque/Direct Debit Return Fee  AED 105
  Paper Statement Fee  AED 5.25 per month
  Managers Cheque Issuance  AED 26.25
  Duplicate Statement Fee (per copy) -
  AED 15.75/AED 47.25 per month
  Up to last 3 Months/Over 3 Months
  Sales Voucher Copy  AED 10.50
  Issuance of Secret Pin  Free
  Issuance of Supplementary Card  Free
  Issuance of Chairman Supplementary
  AED 4,000
  Card
  February 2026
Emirates NBD Bank (PJSC) is licensed by Central Bank of the UAE
[Arabic-language half of the Schedule of Charges omitted]
===== END https://www.emiratesnbd.com/-/media/enbd/files/credit-cards/emiratesnbd_credit_card_fees_charges.pdf
