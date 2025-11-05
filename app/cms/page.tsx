"use client";

import Link from "next/link";
import { GoPencil } from "react-icons/go";
import { IoBugOutline } from "react-icons/io5";
import { PiCards } from "react-icons/pi";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

import Navbar from "@/app/_components/Navbar";

export default function CMS() {
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase.from("user_profiles").select("admin, email").eq("id", user.id).single();

        if (profile?.admin === "admin" && profile?.email === "dyslecixdev@gmail.com") {
          setIsAdmin(true);
        }
      }
    };

    checkAdmin();
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-zinc-950 text-white flex items-center justify-center">
      <Navbar />

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-20 lg:mt-0 px-4">
        <Link href="/cms/flash-cards" className="flex flex-col items-center justify-evenly p-10 border border-white">
          <PiCards className="text-7xl" />
          <p className="text-5xl text-center">Flash Cards</p>
        </Link>

        <Link href="/cms/exam-questions" className="flex flex-col items-center justify-evenly p-10 border border-white">
          <GoPencil className="text-7xl" />
          <p className="text-5xl text-center">Exam Questions</p>
        </Link>

        {isAdmin && (
          <Link href="/cms/reports" className="flex flex-col items-center justify-evenly p-10 border border-white">
            <IoBugOutline className="text-7xl" />
            <p className="text-5xl text-center">Reports</p>
          </Link>
        )}
      </section>
    </main>
  );
}
