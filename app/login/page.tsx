"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/",
    });
    setBusy(false);
    if (result?.error) {
      toast.error("Invalid credentials");
      return;
    }
    window.location.href = "/";
  }

  async function sendMagicLink() {
    if (!email) {
      toast.error("Enter your admin email first");
      return;
    }
    setBusy(true);
    const result = await signIn("resend", {
      email,
      redirect: false,
      callbackUrl: "/",
    });
    setBusy(false);
    if (result?.error) {
      toast.error("Could not send magic link");
      return;
    }
    toast.success("Check your inbox for a sign-in link");
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              Sign in
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={busy}
              onClick={sendMagicLink}
            >
              Email magic link
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
