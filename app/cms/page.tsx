"use client";

import Link from "next/link";

import Navbar from "@/app/_components/Navbar";

export default function CMS() {
  return (
    <main className="min-h-screen overflow-hidden bg-zinc-950 text-white flex items-center justify-center">
      <Navbar />

      <section className="flex space-x-40">
        <div className="p-10 border border-white">
          <Link href="/cms/flash-cards" className="text-5xl">
            Create, Edit, or
            <br />
            Delete Cards
          </Link>
        </div>

        {/* <div className="p-10 border border-white">
          <Link href="/cms/exams" className="text-5xl">
            Create, Edit, or
            <br />
            Delete Exams
          </Link>
        </div> */}
      </section>
    </main>
  );
}
