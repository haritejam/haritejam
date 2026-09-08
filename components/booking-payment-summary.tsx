import type { Booking } from "@/lib/bookings";
import { alreadyPaidRupees, billLinesForBooking, TABLE_PREORDER_DEPOSIT_PERCENT } from "@/lib/pricing";

function rupees(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export function BookingPaymentSummary({ booking }: { booking: Booking }) {
  const bill = billLinesForBooking(booking);
  if (bill.totalRupees <= 0 && bill.subtotalRupees <= 0) return null;

  const billed = bill.totalRupees;
  const paid = alreadyPaidRupees(booking) || (booking.paymentPlan === "full" ? billed : booking.paidNowRupees ?? 0);
  const due = booking.dueAtRestaurantRupees ?? Math.max(0, billed - paid);
  const partial = due > 0 && paid > 0;
  const offerLabel =
    booking.kind === "pickup" ? "pickup" : booking.kind === "delivery" ? "delivery" : "dine-in";

  return (
    <div className="mt-3 space-y-1 text-sm">
      {bill.subtotalRupees > 0 ? (
        <p className="flex justify-between text-muted">
          <span>Menu</span>
          <span className="tabular-nums">{rupees(bill.subtotalRupees)}</span>
        </p>
      ) : null}
      {bill.discountPercent > 0 && bill.discountRupees > 0 ? (
        <p className="flex justify-between text-muted">
          <span>
            {bill.discountPercent}% {offerLabel} discount
          </span>
          <span className="tabular-nums">−{rupees(bill.discountRupees)}</span>
        </p>
      ) : null}
      {bill.packingRupees > 0 ? (
        <p className="flex justify-between text-muted">
          <span>Packing</span>
          <span className="tabular-nums">{rupees(bill.packingRupees)}</span>
        </p>
      ) : null}
      <p className="flex justify-between font-medium text-foreground">
        <span>Total billed</span>
        <span className="tabular-nums">{rupees(billed)}</span>
      </p>
      <p className="flex justify-between text-muted">
        <span>{partial ? `Amount paid (${TABLE_PREORDER_DEPOSIT_PERCENT}% now)` : "Amount paid"}</span>
        <span className="tabular-nums">{rupees(paid)}</span>
      </p>
      {due > 0 ? (
        <p className="flex justify-between font-medium text-foreground">
          <span>Pending</span>
          <span className="tabular-nums">{rupees(due)}</span>
        </p>
      ) : (
        <p className="flex justify-between font-medium text-foreground">
          <span>Paid in full</span>
          <span className="tabular-nums">{rupees(paid)}</span>
        </p>
      )}
    </div>
  );
}
