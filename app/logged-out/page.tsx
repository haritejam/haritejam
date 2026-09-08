import Link from "next/link";

export const metadata = { title: "Logged out | FlexiDine" };

export default function LoggedOutPage() {
  return (
    <section className="site-section bg-background text-foreground" data-header-skin="canvas">
      <div className="site-wrap max-w-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Account</p>
        <h1 className="site-h1 mt-3">Successfully logged out</h1>
        <p className="site-lead">Your session on this device has been cleared. Booking history stays private until you log in again.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="site-btn">
            Back to home
          </Link>
          <Link href="/login" className="booking-gate__stay">
            Log in
          </Link>
        </div>
      </div>
    </section>
  );
}
