"use client";

import { motion } from "motion/react";

import GlowingDotsBackground from "@/app/_components/_backgrounds/GlowingDotsBackground";

export default function CheckEmail() {
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
        <div className="mb-9 mt-6 space-y-1.5">
          <h1 className="text-2xl text-indigo-400 font-semibold">Thanks for signing up!</h1>
          <p className="text-indigo-300">Please check your email for a verification link. You will not be able to login until your email is verified.</p>
        </div>
      </motion.section>

      <GlowingDotsBackground />
    </main>
  );
}
