"use client";

import Link from "next/link";
import { useState, FormEvent, useEffect } from "react";

import { motion } from "motion/react";

import GlowingDotsBackground from "@/app/_components/_backgrounds/GlowingDotsBackground";
import SplashButton from "@/app/_components/_buttons/SplashButton";
import StackedNotification from "@/app/_components/StackedNotification";

import { signup } from "@/app/auth/actions";
import { createClient } from "@/utils/supabase/client";

export default function SignUp() {
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setMessage(msg);
    setIsNotifOpen(true);
  };

  useEffect(() => {
    const supabase = createClient();

    // Function to set user offline
    const setUserOffline = async (userId: string) => {
      try {
        const { error } = await supabase
          .from("user_profiles")
          .update({
            online: true,
          })
          .eq("id", userId);

        if (error) {
          console.error("Error setting user offline:", error);
        }
      } catch (error) {
        console.error("Error in setUserOffline:", error);
      }
    };

    // Check for existing session
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          return;
        }

        // If session doesn't exist, we need to handle offline status
        if (!session) {
          const storedUserId = localStorage.getItem("lastUserId");
          if (storedUserId) {
            await setUserOffline(storedUserId);
          }
        }
      } catch (error) {
        console.error("Error in checkSession:", error);
      }
    };

    checkSession();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 py-20 text-zinc-200 selection:bg-zinc-600">
      <motion.section
        initial={{
          opacity: 0,
          y: 25,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 1.25,
          ease: "easeInOut",
        }}
        className="relative z-10 mx-auto w-full max-w-xl p-4"
      >
        <Heading />
        <SignUpForm showNotification={showNotification} />
      </motion.section>

      <GlowingDotsBackground />
      <StackedNotification isNotifOpen={isNotifOpen} setIsNotifOpen={setIsNotifOpen} message={message} />
    </main>
  );
}

const Heading = () => (
  <div>
    <div className="mb-9 mt-6 space-y-1.5">
      <h1 className="text-2xl text-indigo-400 font-semibold">Create an account</h1>
      <p className="text-indigo-300">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-emerald-400">
          Login.
        </Link>
      </p>
    </div>
  </div>
);

const SignUpForm = ({ showNotification }: { showNotification: (message: string) => void }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const validateForm = (event: FormEvent<HTMLFormElement>): boolean => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirm_password = formData.get("confirm_password") as string;

    let isValid = true;

    if (!name) {
      showNotification("Name is required!");
      isValid = false;
    } else if (!email || !email.trim()) {
      showNotification("Email is required!");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      showNotification("Please enter a valid email address!");
      isValid = false;
    } else if (!password) {
      showNotification("Password is required!");
      isValid = false;
    } else if (password.length < 8) {
      showNotification("Password must be at least 8 characters!");
      isValid = false;
    } else if (!confirm_password) {
      showNotification("Confirm password is required!");
      isValid = false;
    } else if (confirm_password.length < 8) {
      showNotification("Confirm password must be at least 8 characters!");
      isValid = false;
    } else if (password !== confirm_password) {
      showNotification("Passwords do not match!");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    if (!validateForm(event)) {
      return;
    }

    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    try {
      const result = await signup(formData);

      if (result?.errorMessage) {
        showNotification(result.errorMessage);
      }
    } catch (error) {
      console.error(error);
      showNotification("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label htmlFor="name" className="mb-1.5 block text-indigo-300">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="John Doe"
          required
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 placeholder-zinc-500 ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700"
        />
      </div>
      <div className="mb-3">
        <label htmlFor="email" className="mb-1.5 block text-indigo-300">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="your.email@provider.com"
          required
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 placeholder-zinc-500 ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700"
        />
      </div>
      <div className="mb-3">
        <div className="mb-1.5 flex items-end justify-between">
          <label htmlFor="password" className="block text-indigo-300">
            Password
          </label>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••••••"
          required
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 placeholder-zinc-500 ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700"
        />
      </div>
      <div className="mb-3">
        <div className="mb-1.5 flex items-end justify-between">
          <label htmlFor="confirm_password" className="block text-indigo-300">
            Confirm Password
          </label>
        </div>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          placeholder="••••••••••••"
          required
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 placeholder-zinc-500 ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700"
        />
      </div>
      <div className="mb-6">
        <label htmlFor="admin_code" className="mb-1.5 block text-indigo-300">
          Admin Code
        </label>
        <input
          id="admin_code"
          name="admin_code"
          type="text"
          placeholder="XXX-XXX-XXX"
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 placeholder-zinc-500 ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-blue-700"
        />
      </div>

      <SplashButton type="submit" disabled={isLoading} className={`w-full ${isLoading ? "cursor-not-allowed" : "cursor-pointer"}`}>
        {isLoading ? "Signing Up..." : "Sign Up"}
      </SplashButton>
    </form>
  );
};
