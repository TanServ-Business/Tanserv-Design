# Jira Ticket: Document Customer Dashboard Card And Popup Calculations

## Summary
Document and validate the calculation logic for every card and popup on the Customer Dashboard.

## Issue Type
Task

## Priority
Medium

## Background
The Customer Dashboard currently mixes static demo values with computed values from seeded in-page arrays. Product, QA, and engineering need a single calculation reference so each card, chart, popup, and modal can be validated consistently before this screen is connected to real data.

Source file: `pages/Dashboard_Customer.html`

## Scope
- Cover all visible dashboard cards and their click-through popups/modals.
- Identify whether each displayed number is currently hardcoded or computed.
- Where computed, document the exact formula and source rows.
- Where hardcoded, document the current value and the intended production formula to confirm.
- Confirm all row-based calculations are scoped to the active customer.

## Global Data Scope
The dashboard resolves one active customer code from query string `customerCode`, then `localStorage.activeCustomerCode`, then the first available seeded customer code. The page title and localStorage values are set from that resolved customer.

After data is seeded, these arrays are filtered in place to rows where `row.customerCode === activeCustomerCode`:
- `activityDispositionRecords`
- `issueDispositionRecords`
- `mtdCollectionsData`
- `openIssuesData`
- `agingOver30Data`
- `newBillingData`
- `newAllocationsData`
- `ptpForDayData`
- `callbacksForDayData`
- `unappliedCreditsData`
- `invoicesDueThisWeekData`
- `invoicesDueThisMonthData`
- `invoicesOnHoldData`

Source references: `Dashboard_Customer.html:1163`, `Dashboard_Customer.html:1173`, `Dashboard_Customer.html:4593`

## Card Calculation Inventory

### 1. Total Amount To Be Paid
Current state: hardcoded display.

Displayed values:
- Total: `Rs. 2,48,89,26,295`
- Invoice count: `173`
- Not Due: `Invoices 61 | Rs. 89,16,295`
- Due: `Invoices 112 | Rs. 1,65,10,000`
- Delta: `+6.2%`

Current click behavior: redirects to `LPcustomer.html?customerCode=<activeCustomerCode>`.

Production formula to confirm:
- Total Amount To Be Paid = sum of `totalNetDue` or equivalent open due amount for all active customer invoices.
- Invoice count = count of open invoices for the active customer.
- Due / Not Due split = count and amount grouped by due status, ideally from due date compared to business date or from a trusted `dueType`.
- Delta = period-over-period change for the same customer and metric.

Source references: `Dashboard_Customer.html:50`, `Dashboard_Customer.html:55`, `Dashboard_Customer.html:3591`

### 2. Amount Paid This Month
Current state: hardcoded display; popup rows are computed from scoped MTD collection data.

Displayed values:
- Amount Paid This Month: `Rs. 77,73,508`
- Collected invoices: `4`
- Not Due: `Invoices 1 | Rs. 18,43,508`
- Due: `Invoices 3 | Rs. 59,30,000`
- Delta: `+11.4%`

Production formula to confirm:
- Amount Paid This Month = sum of current-month collection amount for active customer invoices.
- Collected invoices = count of invoices with collection in the current month.
- Due / Not Due split = grouped by invoice due status at time of collection or current due status, as Product decides.
- Delta = month-over-month change for amount paid this month.

Popup source: `modalDataConfig.mtd.rows = mtdCollectionsData`.

Source references: `Dashboard_Customer.html:74`, `Dashboard_Customer.html:79`, `Dashboard_Customer.html:4608`, `Dashboard_Customer.html:5229`

### 3. Paid After Due Date
Current state: hardcoded display.

Displayed values:
- Paid After Due Date: `86.2%`
- Progress value: `0.862`
- Within Due Date: `Invoices 4 | Rs. 1,07,00,000`
- After Due Date: `Invoices 25 | Rs. 6,70,00,000`

Production formula to confirm:
- Paid After Due Date % = amount paid after invoice due date / total paid amount, or count of invoices paid after due date / total paid invoices. Product must confirm amount-based versus count-based.
- Within Due Date = invoices paid on or before due date.
- After Due Date = invoices paid after due date.

Source references: `Dashboard_Customer.html:98`

### 4. Promised Payment Today
Current state: computed from `ptpForDayData` after active customer scoping.

Formula:
- Eligible rows = `ptpForDayData` rows where `committedAmount || totalNetDue || invoiceValue` is greater than 0.
- Count / Due Today = eligible row count.
- Value = sum of `committedAmount || totalNetDue || invoiceValue` across eligible rows.
- Collected = eligible rows where normalized `status` equals `collected`.
- Pending = eligible row count minus collected count.

Popup source: same card opens `modalDataConfig.ptp.rows = ptpForDayData`.

Source references: `Dashboard_Customer.html:124`, `Dashboard_Customer.html:4664`, `Dashboard_Customer.html:4834`

### 5. Aging > 30 Days
Current state: card display is hardcoded; popup rows are computed from `agingOver30Data`.

Displayed values:
- Aging > 30 Days: `18%`
- Value: `Rs. 3.8 Cr`
- Bucket counts: `31-60 days = 24`, `121-150 days = 13`, `150-180 days = 9`

Popup behavior:
- Uses `modalDataConfig.aging.rows = agingOver30Data`.
- Shows aging column.
- Supports aging filters:
  - `31_45`: aging days 31-45
  - `46_60`: aging days 46-60
  - `61_90`: aging days 61-90
  - `90_plus`: aging days greater than 90

Production formula to confirm:
- Aging > 30 Days % = active customer overdue amount beyond 30 days / total outstanding amount.
- Value = sum of overdue amount for invoices with aging days greater than 30.
- Bucket counts = invoice counts by configured aging bands.

Source references: `Dashboard_Customer.html:149`, `Dashboard_Customer.html:4631`, `Dashboard_Customer.html:5263`

### 6. New Billing
Current state: card display is hardcoded; popup rows are computed from `newBillingData`.

Displayed values:
- New Billing: `Rs. 1.2 Cr`
- MTD growth: `4.6%`
- Top 3 customers: Michelin Tyres `0.62 Cr`, Blue Star Limited `0.39 Cr`, Varun Beverages `0.21 Cr`

Popup source:
- Uses `modalDataConfig.billing.rows = newBillingData`.
- Shows invoice rows with manager/KAM/KAS columns.

Production formula to confirm:
- New Billing = sum of invoice value or amount billed in current month.
- MTD growth = current MTD billing versus comparable previous period.
- Top customers = top customers by current-month invoice value.

Source references: `Dashboard_Customer.html:174`, `Dashboard_Customer.html:4642`, `Dashboard_Customer.html:5242`

### 7. Unapplied Credits
Current state: computed from `unappliedCreditsData` after active customer scoping.

Card formulas:
- Value = sum of `amount` across all scoped unapplied credit rows.
- Entries = row count.
- Pending Validation = count where normalized status is neither `ready_to_apply` nor `under_review`.
- Under Review = count where normalized status is `under_review`.
- Ready to Apply = count where normalized status is `ready_to_apply`.

Popup formulas:
- Source filter limits rows by `source`.
- Status filter limits rows by normalized `status`.
- Sort supports date, amount, and aging ascending/descending.
- Total amount balance = sum of `amount` across filtered rows.
- Total Advance/PDC/CN = grouped sum of `amount` by `source`.
- Chart = same grouped source amounts.
- Table pagination = 10 rows per page.

Source references: `Dashboard_Customer.html:199`, `Dashboard_Customer.html:4785`, `Dashboard_Customer.html:4808`, `Dashboard_Customer.html:4965`, `Dashboard_Customer.html:4983`

### 8. Invoices Due This Week
Current state: computed from `invoicesDueThisWeekData` after active customer scoping.

Card formulas:
- Count = row count.
- Value = sum of `dueAmount`.
- Overdue = count where parsed `dueDate` is before browser-local today.
- Due Today = count where parsed `dueDate` equals browser-local today.
- Upcoming = count where parsed `dueDate` is after today and on or before today + 7 days.

Popup source:
- Opens invoice focus modal in `dueWeek` mode.
- Rows are sorted by due date ascending.
- Table shows customer code, customer name, invoice number, invoice value, due amount, invoice date, due date.

Source references: `Dashboard_Customer.html:227`, `Dashboard_Customer.html:4760`, `Dashboard_Customer.html:4763`, `Dashboard_Customer.html:4851`, `Dashboard_Customer.html:4921`

### 9. Invoices Due This Month
Current state: computed from `invoicesDueThisMonthData` after active customer scoping.

Card formulas:
- Count = row count.
- Value = sum of `dueAmount`.
- First band = count where due date day-of-month is 1-10.
- Second band = count where due date day-of-month is 11-20.
- Third band = count where due date day-of-month is 21 or later.

Popup source:
- Opens invoice focus modal in `dueMonth` mode.
- Rows are sorted by due date ascending.

Source references: `Dashboard_Customer.html:237`, `Dashboard_Customer.html:4769`, `Dashboard_Customer.html:4878`, `Dashboard_Customer.html:4921`

### 10. Invoices On Hold
Current state: computed from `invoicesOnHoldData` after active customer scoping.

Card formulas:
- Count = row count.
- Value = sum of `dueAmount`.
- Docs bucket = count where normalized `subStatus` matches `required|copy|challan|report|docs|po`.
- Action bucket = count where normalized `subStatus` matches `issue|billing|discount|deduction|reversal|write_off|tax`.
- Other bucket = all remaining hold rows.

Popup source:
- Opens invoice focus modal in `onHold` mode.
- Rows are sorted by due date ascending.
- Table includes `subStatus`.

Source references: `Dashboard_Customer.html:247`, `Dashboard_Customer.html:4775`, `Dashboard_Customer.html:4900`, `Dashboard_Customer.html:4921`

### 11. Monthly Due Resolution / Plan vs Actual
Current state: visible card values are mostly hardcoded; gauge chart uses configured target values; detail popup computes run-rate metrics from `targetDetailSnapshot`.

Card display:
- Percent: `46%`
- Gauge center: `3,20,00,000`, `91 Invoices`
- Callout: `Rs. 3,85,00,000 has been paid against Rs. 8.4 Cr due this month`
- Summary: Due this month `8.4 Cr`, Paid this month `3.85 Cr`, Paid today `0.47 Cr`

Gauge formula:
- `cardProgressTarget = [3.85, 4.55]`
- Achieved = `3.85`
- Remaining = `4.55`
- Total target = achieved + remaining = `8.4`

Detail popup formulas:
- Monthly commitment = `targetDetailSnapshot.targetCr`.
- Committed MTD = sum of `committedDailyCollectionsCr`.
- Non-committed MTD = sum of `nonCommittedDailyCollectionsCr`, adjusted by PTP uplift if a PTP `metCr` is higher than the calculated daily actual.
- Achieved MTD = sum of daily actual collection after PTP uplift.
- Achievement % = `achievedMtd / targetCr * 100`.
- Balance to collect = `max(0, targetCr - achievedMtd)`.
- Expected by now = `(targetCr / daysInMonth) * daysElapsed`.
- Pace vs expected = `achievedMtd - expectedByNow`.
- Current average per day = `achievedMtd / daysElapsed`.
- Required per day = `balanceToCollect / daysLeft`.
- Projected month end in target popup = last value of `projectedLine`.
- `projectedLine` = `achievedMtd + cumulative projectedFutureDailyCollectionsCr` for future days. Missing future values fall back to `achievedMtd / daysElapsed`.
- Previous month MTD = sum of previous committed and previous non-committed daily collections.
- Vs last month % = `(achievedMtd - previousMonthMtd) / previousMonthMtd * 100`.
- Urgency:
  - Achieved if gap is 0.
  - At risk if projected month-end is below target.
  - Critical if current per day is 0.
  - On track if `requiredPerDay / currentPerDay <= 1`.
  - Watch if ratio <= 1.15.
  - At risk otherwise.
- PTP met/partial/unmet/future counts derive from `ptpEvents` relative to elapsed days.
- PTP variance = `metCr - duePromisedCr`.

Important disambiguation:
- The target popup's `Projected month end` is not the same as the cashflow popup's `Projected month-end`.

Source references: `Dashboard_Customer.html:262`, `Dashboard_Customer.html:1263`, `Dashboard_Customer.html:1891`, `Dashboard_Customer.html:2364`, `Dashboard_Customer.html:2527`

### 12. Vintage Portfolio
Current state: chart and card summary use seeded chart values.

Chart formula:
- Chart buckets come from `chartConfigs.vintage.data.datasets[0].data`.
- Values are in crore.

Visible card summary:
- Highest bucket: `31-60 days`
- Total overdue: `Rs. 4.2 Cr`
- Resolved this month: `Rs. 1.6 Cr`

Popup table formula:
- Popup normalizes chart buckets:
  - Not Due = chart index 0
  - 1-30 = index 1
  - 31-60 = index 2
  - 61-120 = index 3 + index 4
  - 121-150 = index 5
  - 151-240 = indexes 6 + 7 + 8
  - 241-365 = indexes 9 + 10 + 11 + 12
  - 1+ Year = indexes 13 + 14 + 15 + 16 + 17
- Total amount = normalized bucket amount.
- Total net due = amount * 0.93.
- Invoice count = `max(6, round(amountCr * 26))`.
- Customer count = `max(2, round(invoiceCount * 0.28))`.
- Share % = bucket amount / total amount, rounded to one decimal with a tenths allocation method so displayed percentages sum to 100.0%.

Source references: `Dashboard_Customer.html:308`, `Dashboard_Customer.html:1190`, `Dashboard_Customer.html:1916`

### 13. Cash Flow Trend
Current state: computed from daily seeded arrays.

Card formulas:
- Days in month = `28`.
- Current day = `13`.
- Collection series = `cashflowCollectionDailyCr` for days <= current day, null after current day.
- PTP series = `cashflowPtpDailyCr` where value > 0, otherwise null.
- MTD Collection = sum of all `collectionCr` values, treating null as 0.
- PTP Due = sum of `ptpAmountCr` for rows where `day <= currentDay`.
- Variance = `MTD Collection - PTP Due`, formatted with sign.

Popup formulas:
- Weekly table shows rows for selected 7-day week.
- Collection = actual `collectionCr` if present, otherwise blank.
- PTP Date = date label only when `ptpAmountCr > 0`.
- PTP Amount = `ptpAmountCr` when greater than 0.
- Projected Collection = daily `projectedCr`.
- Daily variance = `collectionCr - projectedCr` for past/current days; blank for future days.
- Popup MTD collection = sum of all `collectionCr`.
- Popup PTP due till date = sum of `ptpAmountCr` where `day <= currentDay`.
- Popup Projected month-end = sum of all daily `projectedCr` values.
- Popup chart also includes last month collection and projected collection series.

Important disambiguation:
- Cashflow popup `Projected month-end` = sum of `cashflowMonthFlowRecords.projectedCr`.
- Target popup projected month-end = final cumulative value of `targetDetailSnapshot` run-rate projection.

Source references: `Dashboard_Customer.html:327`, `Dashboard_Customer.html:1631`, `Dashboard_Customer.html:1649`, `Dashboard_Customer.html:1750`, `Dashboard_Customer.html:2031`

### 14. MTD / Aging / Billing / PTP Table Popup
Current state: shared table renderer for several card click-throughs.

Modes:
- `mtd`: `mtdCollectionsData`
- `issues`: `openIssuesData`
- `aging`: `agingOver30Data`
- `billing`: `newBillingData`
- `allocations`: `newAllocationsData`
- `ptp`: `ptpForDayData`
- `callbacks`: `callbacksForDayData`

Filtering:
- Due filter: `row.dueType === selectedDueType`.
- Status filter:
  - MTD mode normalizes all non-collected statuses to `partially_collected`.
  - Other modes use normalized status text.
- Commitment filter: `row.commitmentType`.
- Manager/KAM/KAS filters apply in billing/allocation modes.
- Aging range filters apply only when the aging column is visible.
- Search checks invoice number, customer name, and customer code.

Rendered amount columns:
- Invoice value = `row.invoiceValue`.
- Amount for month = `row.amountForMonth`, except hidden in issues mode.
- Total net due = `row.totalNetDue`.
- Value column = `row.committedAmount`, except issues mode uses primary status.

Pagination: `mtdPageSize`, with standard previous/next behavior.

Source references: `Dashboard_Customer.html:4608`, `Dashboard_Customer.html:5229`

### 15. Invoice Focus Popup
Current state: shared popup for due week, due month, and on-hold cards.

Modes:
- `dueWeek`: `invoicesDueThisWeekData`
- `dueMonth`: `invoicesDueThisMonthData`
- `onHold`: `invoicesOnHoldData`

Formula/behavior:
- Rows are sorted by due date ascending.
- Pagination size = 10.
- Displays invoice value and due amount directly from row fields.
- On-hold mode additionally displays substatus.

Source references: `Dashboard_Customer.html:4761`, `Dashboard_Customer.html:4921`

### 16. Dashboard Summary Popup
Current state: generated from dashboard state using deterministic local summary text, with optional AI request handling elsewhere in the page.

Metrics included:
- MTD collection = cashflow MTD collection.
- PTP due till date = cashflow PTP due through current day.
- Projected month-end = cashflow projected month-end.
- Monthly commitment = target detail target.
- Gap to commitment = target minus MTD collection, clamped at zero.
- PTP met/missed day counts = cashflow PTP rows through current day where collection is >= or < promised amount.
- Activity mix = count of Call/Email/Visit activities.
- Top primary status = highest count from activity records.
- Top issue category = highest count from issue records.
- Aged issues = issue records where open days > 14.

Source references: `Dashboard_Customer.html:5619`

## Acceptance Criteria
- Every visible card in `Dashboard_Customer.html` has a documented calculation or is explicitly marked as hardcoded/demo.
- Every popup/modal has documented source rows, filters, amount formulas, and pagination behavior.
- `Projected month-end` is documented separately for target detail and cashflow detail.
- Product confirms formulas for currently hardcoded cards before backend integration.
- QA can validate card values against the documented source rows and formulas.

## Open Questions For Product
- Should `Total Amount To Be Paid` use `totalNetDue`, `dueAmount`, or another ledger balance field?
- Should `Paid After Due Date %` be amount-weighted or invoice-count-weighted?
- Should due/not-due splits be based on current date, invoice due date, or a backend-provided due bucket?
- Should the Customer Dashboard show customer-only data exclusively, or should any card retain portfolio-level context?
- Which business date should drive "today", "this week", and "this month": browser date, server date, or selected dashboard as-of date?

## Technical Notes
- Several top-level cards are not yet bound to their popup datasets. The UI can therefore show a hardcoded card value while the popup displays scoped seeded data.
- Real data integration should centralize formulas in a shared calculation layer rather than keeping calculations embedded inside the page script.
