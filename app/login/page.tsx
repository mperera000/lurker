import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/login-form";
import { auth, isAuthConfigured } from "@/lib/auth";
import { loginErrorMessage } from "@/lib/auth/email";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string; mode?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  const params = await searchParams;
  return (
    <LoginForm
      configured={isAuthConfigured()}
      errorMessage={loginErrorMessage(params.error)}
      callbackUrl={params.callbackUrl || "/"}
      mode={params.mode === "signup" ? "signup" : "signin"}
    />
  );
}
