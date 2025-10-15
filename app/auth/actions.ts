"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !email.trim()) return { errorMessage: "Email is required!" };
  if (!/\S+@\S+\.\S+/.test(email)) return { errorMessage: "Please enter a valid email address!" };
  if (!password) return { errorMessage: "Password is required!" };
  if (password.length < 8) return { errorMessage: "Password must be at least 8 characters!" };

  const authForm = {
    email: email,
    password: password,
  };

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword(authForm);

  if (authError) return { errorMessage: authError.message };
  else if (!authData.user) return { errorMessage: "Login failed." };

  const { error: publicError } = await supabase.from("user_profiles").update({ online: true }).eq("id", authData.user.id);

  if (publicError) return { errorMessage: "Status update failed." };

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirm_password = formData.get("confirm_password") as string;
  const admin_code = formData.get("admin_code") as string;

  if (!name) return { errorMessage: "Name is required!" };
  if (!email || !email.trim()) return { errorMessage: "Email is required!" };
  if (!/\S+@\S+\.\S+/.test(email)) return { errorMessage: "Please enter a valid email address!" };
  if (!password) return { errorMessage: "Password is required!" };
  if (password.length < 8) return { errorMessage: "Password must be at least 8 characters!" };
  if (!confirm_password) return { errorMessage: "Confirm password is required!" };
  if (confirm_password.length < 8) return { errorMessage: "Confirm password must be at least 8 characters!" };
  if (password !== confirm_password) return { errorMessage: "Passwords do not match!" };

  let userCredentials = "user";
  if (admin_code === process.env.NEXT_PUBLIC_ADMIN_CODE) {
    userCredentials = "admin";
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        name: name,
        admin: userCredentials,
      },
    },
  });

  if (authError) return { errorMessage: authError.message };
  if (!authData.user) return { errorMessage: "Registration failed." };

  return { success: true };
}
