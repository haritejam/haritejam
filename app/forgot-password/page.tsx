import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Forgot password | FlexiDine" };

export default function ForgotPasswordPage() {
  return <AuthForm mode="forgot" />;
}
