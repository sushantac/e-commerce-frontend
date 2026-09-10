"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import type { RegisterRequest } from "@/lib/types";

interface RegisterFieldErrors {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+ \-]{0,20}$/;

function validateFullName(fullName: string): string | undefined {
  if (!fullName) {
    return "Full name is required.";
  }
  if (fullName.trim().length < 2) {
    return "Full name must be at least 2 characters.";
  }
  return undefined;
}

function validateEmail(email: string): string | undefined {
  if (!email) {
    return "Email is required.";
  }
  if (!EMAIL_PATTERN.test(email)) {
    return "Enter a valid email address.";
  }
  return undefined;
}

function validatePhoneNumber(phoneNumber: string): string | undefined {
  if (!phoneNumber.trim()) {
    return undefined;
  }
  if (!PHONE_PATTERN.test(phoneNumber.trim())) {
    return "Phone number can only contain digits, spaces, + and - (max 20).";
  }
  return undefined;
}

function validatePassword(password: string): string | undefined {
  if (!password) {
    return "Password is required.";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  return undefined;
}

function validateConfirmPassword(
  password: string,
  confirmPassword: string
): string | undefined {
  if (!confirmPassword) {
    return "Please confirm your password.";
  }
  if (confirmPassword !== password) {
    return "Passwords do not match.";
  }
  return undefined;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<RegisterFieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const clearFieldError = (field: keyof RegisterFieldErrors) => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: RegisterFieldErrors = {
      fullName: validateFullName(fullName),
      email: validateEmail(email),
      phoneNumber: validatePhoneNumber(phoneNumber),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
    };
    setFieldErrors(nextErrors);
    setFormError(null);

    if (Object.values(nextErrors).some((error) => error !== undefined)) {
      return;
    }

    const payload: RegisterRequest = {
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      ...(phoneNumber.trim() ? { phoneNumber: phoneNumber.trim() } : {}),
    };

    setSubmitting(true);
    try {
      await register(payload);

      toast({ title: "Account created — sign in" });
      router.push("/login");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to create your account."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16 sm:px-6">
      <a
        href="#create-account-heading"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to create account form
      </a>

      <Card className="w-full max-w-md">
        <CardHeader>
          <h1
            id="create-account-heading"
            tabIndex={-1}
            className="text-2xl font-semibold tracking-tight focus:outline-none"
          >
            Create account
          </h1>
          <CardDescription>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {formError && (
              <p
                id="register-form-error"
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {formError}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="register-full-name">Full name</Label>
              <Input
                id="register-full-name"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  clearFieldError("fullName");
                }}
                aria-invalid={fieldErrors.fullName ? true : undefined}
                aria-describedby={
                  fieldErrors.fullName ? "register-full-name-error" : undefined
                }
              />
              {fieldErrors.fullName && (
                <p
                  id="register-full-name-error"
                  className="text-sm text-destructive"
                >
                  {fieldErrors.fullName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-email">Email</Label>
              <Input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearFieldError("email");
                }}
                aria-invalid={fieldErrors.email ? true : undefined}
                aria-describedby={
                  fieldErrors.email ? "register-email-error" : undefined
                }
              />
              {fieldErrors.email && (
                <p
                  id="register-email-error"
                  className="text-sm text-destructive"
                >
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-phone-number">
                Phone number{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="register-phone-number"
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                value={phoneNumber}
                onChange={(event) => {
                  setPhoneNumber(event.target.value);
                  clearFieldError("phoneNumber");
                }}
                aria-invalid={fieldErrors.phoneNumber ? true : undefined}
                aria-describedby={
                  fieldErrors.phoneNumber
                    ? "register-phone-number-error"
                    : undefined
                }
              />
              {fieldErrors.phoneNumber && (
                <p
                  id="register-phone-number-error"
                  className="text-sm text-destructive"
                >
                  {fieldErrors.phoneNumber}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-password">Password</Label>
              <Input
                id="register-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  clearFieldError("password");
                }}
                aria-invalid={fieldErrors.password ? true : undefined}
                aria-describedby={
                  fieldErrors.password ? "register-password-error" : undefined
                }
              />
              {fieldErrors.password && (
                <p
                  id="register-password-error"
                  className="text-sm text-destructive"
                >
                  {fieldErrors.password}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-confirm-password">
                Confirm password
              </Label>
              <Input
                id="register-confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  clearFieldError("confirmPassword");
                }}
                aria-invalid={fieldErrors.confirmPassword ? true : undefined}
                aria-describedby={
                  fieldErrors.confirmPassword
                    ? "register-confirm-password-error"
                    : undefined
                }
              />
              {fieldErrors.confirmPassword && (
                <p
                  id="register-confirm-password-error"
                  className="text-sm text-destructive"
                >
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}