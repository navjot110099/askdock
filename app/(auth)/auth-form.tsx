"use client";

import { Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, signInWithGoogle, signUp, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_USER } from "@/lib/demo/constants";

type Props = { mode: "login" | "signup"; next?: string; plan?: string; demo: boolean; error?: string };

export function AuthForm({ mode, next, plan, demo, error: initialError }: Props) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "login" ? signIn : signUp, undefined);
  const error = state?.error ?? (initialError ? "Sign-in didn't complete. Please try again." : undefined);

  return (
    <div className="space-y-6">
      <form action={signInWithGoogle}>
        <Hidden next={next} plan={plan} />
        <GoogleButton />
      </form>

      <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.16em] text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
      </div>

      <form action={action} className="space-y-4">
        <Hidden next={next} plan={plan} />
        {mode === "signup" && (
          <Field label="Your name" htmlFor="name">
            <Input id="name" name="name" autoComplete="name" placeholder="Maya Okafor" defaultValue={demo ? DEMO_USER.name : undefined} className="h-11 rounded-xl bg-white" />
          </Field>
        )}
        <Field label="Work email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@business.com"
            defaultValue={demo ? DEMO_USER.email : undefined}
            className="h-11 rounded-xl bg-white"
          />
        </Field>
        <Field label="Password" htmlFor="password" hint={mode === "signup" ? "At least 8 characters" : undefined}>
          <Input
            id="password"
            name="password"
            type="password"
            required={!demo}
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="••••••••"
            defaultValue={demo ? "juniper-dental" : undefined}
            className="h-11 rounded-xl bg-white"
          />
        </Field>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
            {error}
          </p>
        )}
        {state?.message && (
          <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
            {state.message}
          </p>
        )}

        <Button type="submit" size="lg" disabled={pending} className="h-11 w-full rounded-xl text-[15px]">
          {pending && <Loader2 className="animate-spin" />}
          {mode === "login" ? "Sign in" : "Create free account"}
        </Button>
        {mode === "login" && !demo && (
          <Button type="submit" name="intent" value="magic" formNoValidate variant="ghost" className="w-full text-muted-foreground" disabled={pending}>
            <Mail /> Email me a sign-in link instead
          </Button>
        )}
      </form>

      <p className="text-center text-[14px] text-muted-foreground">
        {mode === "login" ? (
          <>
            New to AskDock?{" "}
            <Link href={`/signup${plan ? `?plan=${plan}` : ""}`} className="font-medium text-foreground underline-offset-4 hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function Hidden({ next, plan }: { next?: string; plan?: string }) {
  return (
    <>
      {next && <input type="hidden" name="next" value={next} />}
      {plan && <input type="hidden" name="plan" value={plan} />}
    </>
  );
}

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <Label htmlFor={htmlFor} className="text-[13px]">
          {label}
        </Label>
        {hint && <span className="text-[12px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function GoogleButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="lg" disabled={pending} className="h-11 w-full rounded-xl bg-white text-[15px]">
      {pending ? (
        <Loader2 className="animate-spin" />
      ) : (
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
        </svg>
      )}
      Continue with Google
    </Button>
  );
}
