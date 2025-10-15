"use client";

import Link from "next/link";
import { useState, FormEvent, useEffect } from "react";

import { motion } from "motion/react";

import GlowingDotsBackground from "@/app/_components/_backgrounds/GlowingDotsBackground";
import SplashButton from "@/app/_components/_buttons/SplashButton";
import StackedNotification from "@/app/_components/StackedNotification";

import { login } from "@/app/auth/actions";
import { createClient } from "@/utils/supabase/client";

export default function Login() {
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
        <LoginForm showNotification={showNotification} />
      </motion.section>

      <GlowingDotsBackground />
      <StackedNotification isNotifOpen={isNotifOpen} setIsNotifOpen={setIsNotifOpen} message={message} />
    </main>
  );
}

const Heading = () => (
  <div>
    <div className="mb-9 mt-6 space-y-1.5">
      <h1 className="text-2xl text-indigo-400 font-semibold">Sign in to your account</h1>
      <p className="text-indigo-300">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="text-emerald-400">
          Sign Up.
        </Link>
      </p>
    </div>
  </div>
);

const LoginForm = ({ showNotification }: { showNotification: (message: string) => void }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const validateForm = (event: FormEvent<HTMLFormElement>): boolean => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    let isValid = true;

    if (!email || !email.trim()) {
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
      const result = await login(formData);

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
        <label htmlFor="email" className="mb-1.5 block text-indigo-300">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="your.email@provider.com"
          required
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 placeholder-zinc-500 ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-indigo-700"
        />
      </div>
      <div className="mb-6">
        <div className="mb-1.5 flex items-end justify-between">
          <label htmlFor="password" className="block text-indigo-300">
            Password
          </label>

          <Link href="/auth/forgot-password" className="text-sm text-indigo-400 hover:text-indigo-300 transition duration-300">
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••••••"
          required
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 placeholder-zinc-500 ring-1 ring-transparent transition-shadow focus:outline-0 focus:ring-indigo-700"
        />
      </div>

      <SplashButton type="submit" disabled={isLoading} className={`w-full ${isLoading ? "cursor-not-allowed" : "cursor-pointer"}`}>
        {isLoading ? "Logging In..." : "Login"}
      </SplashButton>
    </form>
  );
};
