"use server";

import { signIn, signOut } from "@/lib/auth";

export async function demoSignInAction(callbackUrl?: string) {
  await signIn("credentials", {
    email: "hero@questdaily.app",
    name: "Hero",
    redirectTo: callbackUrl || "/dashboard",
  });
}

export async function googleSignInAction(callbackUrl?: string) {
  await signIn("google", {
    redirectTo: callbackUrl || "/dashboard",
  });
}

export async function signOutAction() {
  await signOut({
    redirectTo: "/sign-in",
  });
}
