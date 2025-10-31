"use client";

import Link from "next/link";
import { GoPencil } from "react-icons/go";
import { PiCards } from "react-icons/pi";

import Navbar from "@/app/_components/Navbar";

export default function CMS() {
  return (
    <main className="min-h-screen overflow-hidden bg-zinc-950 text-white flex items-center justify-center">
      <Navbar />

      <section className="flex space-x-40">
        <Link href="/cms/flash-cards" className="flex flex-col items-center justify-evenly p-10 border border-white">
          <PiCards className="text-7xl" />
          <p className="text-5xl">Edit Flash Cards</p>
        </Link>

        <Link href="/cms/exam-questions" className="flex flex-col items-center justify-evenly p-10 border border-white">
          <GoPencil className="text-7xl" />
          <p className="text-5xl">Exam Questions</p>
        </Link>
      </section>
    </main>
  );
}
