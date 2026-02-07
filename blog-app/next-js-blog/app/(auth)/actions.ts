"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { setAuthCookies, clearAuthCookies } from "@/lib/auth";
import type { ApiResponse, AuthTokens } from "@/types/api";

const API_BASE = process.env.API_BASE_URL || "http://localhost:3000";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const signUpSchema = z.object({
  firstName: z
    .string()
    .min(5, "First name must be at least 5 characters")
    .max(96),
  lastName: z.string().min(2).max(96).optional().or(z.literal("")),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      "Must contain uppercase, lowercase, number, and special character (@$!%*?&)",
    ),
});

export type AuthActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function signInAction(
  prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const res = await fetch(`${API_BASE}/auth/sing-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { error: body?.message || "Invalid credentials" };
    }

    const json: ApiResponse<AuthTokens> = await res.json();
    await setAuthCookies(json.data.accessToken, json.data.refreshToken);
  } catch {
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/dashboard");
}

export async function signUpAction(
  prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const payload = { ...parsed.data };
  if (payload.lastName === "") {
    delete payload.lastName;
  }

  try {
    const res = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { error: body?.message || "Registration failed" };
    }
  } catch {
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/sign-in?registered=true");
}

export async function signOutAction() {
  await clearAuthCookies();
  redirect("/sign-in");
}
