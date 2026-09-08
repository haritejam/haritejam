import { BookingConfirmation } from "@/components/booking-confirmation";

export const metadata = { title: "Booking confirmed | FlexiDine" };

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookingConfirmation id={id} />;
}