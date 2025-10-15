"use client";

import { motion } from "motion/react";

import GlowingDotsBackground from "@/app/_components/_backgrounds/GlowingDotsBackground";

export default function Error() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 py-20 text-zinc-200 selection:bg-zinc-600">
      <motion.div
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
        <div>
          <div className="mb-9 mt-6 space-y-1.5">
            <h1 className="text-2xl font-semibold">Uh Oh! It looks like there was an error</h1>
            <p className="text-zinc-400">Please send an email to dyslecixdev@gmail.com for help with your issue.</p>
          </div>
        </div>
      </motion.div>

      <GlowingDotsBackground />
    </div>
  );
}
