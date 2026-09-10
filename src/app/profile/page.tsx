"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Mail, Phone, User as UserIcon } from "lucide-react";

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
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

interface ProfileFormValues {
  fullName: string;
  phoneNumber: string;
}

interface ProfileFieldErrors {
  fullName?: string;
  phoneNumber?: string;
}

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

function validatePhoneNumber(phoneNumber: string): string | undefined {
  if (!phoneNumber.trim()) {
    return undefined;
  }
  if (!PHONE_PATTERN.test(phoneNumber.trim())) {
    return "Phone number can only contain digits, spaces, + and - (max 20).";
  }
  return undefined;
}

export default function ProfilePage() {
  const { user, loading } = useAuth();

  const [profile, setProfile] = React.useState<ProfileFormValues | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<ProfileFieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setProfile({
        fullName: user.fullName,
        phoneNumber: user.phoneNumber ?? "",
      });
    } else {
      setProfile(null);
    }
  }, [user]);

  const updateProfileField = (
    field: keyof ProfileFormValues,
    value: string
  ) => {
    setProfile((prev) => ({ ...(prev ?? { fullName: "", phoneNumber: "" }), [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) {
      return;
    }

    const nextErrors: ProfileFieldErrors = {
      fullName: validateFullName(profile.fullName),
      phoneNumber: validatePhoneNumber(profile.phoneNumber),
    };
    setFieldErrors(nextErrors);
    setFormError(null);

    if (nextErrors.fullName || nextErrors.phoneNumber) {
      return;
    }

    setSubmitting(true);
    try {
      const updated = await api.put<User>("/auth/profile", {
        fullName: profile.fullName.trim(),
        ...(profile.phoneNumber.trim()
          ? { phoneNumber: profile.phoneNumber.trim() }
          : {}),
      });
      // The PUT response omits phoneNumber, so keep the submitted value.
      setProfile({
        fullName: updated.fullName,
        phoneNumber: profile.phoneNumber.trim(),
      });
      toast({ title: "Profile updated" });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Could not update your profile."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 py-16 sm:px-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <h1 className="text-2xl font-semibold tracking-tight">
              Sign in required
            </h1>
            <CardDescription>
              Sign in to view and update your profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const current = profile ?? {
    fullName: user.fullName,
    phoneNumber: user.phoneNumber ?? "",
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account details and contact information.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold tracking-tight">
              Account information
            </h2>
            <CardDescription>Your sign-in details.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <dt className="font-medium text-muted-foreground">Email</dt>
                  <dd className="mt-0.5 font-medium">{user.email}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <dt className="font-medium text-muted-foreground">Full name</dt>
                  <dd className="mt-0.5 font-medium">
                    {current.fullName || "—"}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <dt className="font-medium text-muted-foreground">Phone</dt>
                  <dd className="mt-0.5 font-medium">
                    {current.phoneNumber || "—"}
                  </dd>
                </div>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold tracking-tight">
              Edit profile
            </h2>
            <CardDescription>
              Update your name or phone number.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {formError && (
                <p
                  id="profile-form-error"
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {formError}
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="profile-full-name">Full name</Label>
                <Input
                  id="profile-full-name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={current.fullName}
                  onChange={(event) =>
                    updateProfileField("fullName", event.target.value)
                  }
                  aria-invalid={fieldErrors.fullName ? true : undefined}
                  aria-describedby={
                    fieldErrors.fullName
                      ? "profile-full-name-error"
                      : undefined
                  }
                />
                {fieldErrors.fullName && (
                  <p
                    id="profile-full-name-error"
                    className="text-sm text-destructive"
                  >
                    {fieldErrors.fullName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-phone-number">
                  Phone number{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="profile-phone-number"
                  name="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  value={current.phoneNumber}
                  onChange={(event) =>
                    updateProfileField("phoneNumber", event.target.value)
                  }
                  aria-invalid={fieldErrors.phoneNumber ? true : undefined}
                  aria-describedby={
                    fieldErrors.phoneNumber
                      ? "profile-phone-number-error"
                      : undefined
                  }
                />
                {fieldErrors.phoneNumber && (
                  <p
                    id="profile-phone-number-error"
                    className="text-sm text-destructive"
                  >
                    {fieldErrors.phoneNumber}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}