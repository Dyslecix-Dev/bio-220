import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, Dispatch, FC, JSX, ReactNode, SetStateAction } from "react";
import { FiMenu, FiArrowRight, FiX, FiChevronDown } from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";

import { useMotionValueEvent, AnimatePresence, useScroll, motion } from "motion/react";

import useMeasure from "react-use-measure";

import { createClient } from "@/utils/supabase/client";

export default function Navbar() {
  const [userID, setUserID] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userAdmin, setUserAdmin] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  const router = useRouter();

  useEffect(() => {
    async function getUser() {
      try {
        const supabase = await createClient();

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        const { data: userProfile, error: userError } = await supabase.from("user_profiles").select("*").eq("id", user?.id).single();

        if (error || userError) {
          console.error("Error getting user:", error);
          return;
        }

        if (user) {
          setUserID(user.id);
          setUserEmail(user.email || "");
        }

        if (userProfile) {
          setUserAdmin(userProfile.admin);
        }
      } catch (error) {
        console.error("Error in getUser:", error);
      } finally {
        setIsLoading(false);
      }
    }

    getUser();
  }, []);

  async function signOut() {
    try {
      const supabase = await createClient();

      if (userID) {
        const { error: publicError } = await supabase.from("user_profiles").update({ online: false }).eq("id", userID);

        if (publicError) {
          console.error("Status update failed:", publicError);
        }
      }

      const { error: authError } = await supabase.auth.signOut();

      if (authError) {
        console.error("Error signing out:", authError);
      } else {
        router.push("/auth/login");
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 80 ? true : false);
  });

  return (
    <nav
      className={`fixed top-0 z-50 w-full px-6 text-white 
      transition-all duration-300 ease-out lg:px-12
      ${scrolled ? "bg-neutral-950 py-3 shadow-xl" : "bg-neutral-950/0 py-6 shadow-none"}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Logo />
        <div className="hidden gap-6 lg:flex">
          {isLoading ? <NavbarLoadingSkeleton /> : <Links userAdmin={userAdmin} userEmail={userEmail} />}
          <LogoutButton onClick={signOut} isLoading={isLoading} />
        </div>
        <MobileMenu onClick={signOut} userAdmin={userAdmin} userEmail={userEmail} isLoading={isLoading} />
      </div>
    </nav>
  );
}

const Logo = ({ color = "white" }) => {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="text-2xl font-bold" style={{ color }}>
        Microbiology
      </span>
      <svg width="50" height="39" viewBox="0 0 50 39" fill={color} xmlns="http://www.w3.org/2000/svg" className="w-10">
        <path d="M16.4992 2H37.5808L22.0816 24.9729H1L16.4992 2Z" stopColor={color} />
        <path d="M17.4224 27.102L11.4192 36H33.5008L49 13.0271H32.7024L23.2064 27.102H17.4224Z" stopColor={color} />
      </svg>
    </Link>
  );
};

const NavbarLoadingSkeleton = () => {
  return (
    <div className="flex items-center gap-6">
      <div className="h-5 w-16 animate-pulse rounded bg-neutral-700" />
      <div className="h-5 w-16 animate-pulse rounded bg-neutral-700" />
      <div className="h-5 w-16 animate-pulse rounded bg-neutral-700" />
      <div className="h-5 w-16 animate-pulse rounded bg-neutral-700" />
    </div>
  );
};

const Links = ({ userAdmin, userEmail }: { userAdmin: string; userEmail: string }) => {
  const links = LINKS.map((link) => {
    if (link.text === "Admin" && userAdmin === "admin") {
      return {
        ...link,
        FlyoutContent: () => <AdminFlyout userEmail={userEmail} />,
        FoldContent: () => <AdminMobileFold userEmail={userEmail} />,
      };
    }
    return link;
  }).filter((link) => {
    if (link.text === "Admin") {
      return userAdmin === "admin";
    }
    return true;
  });

  return (
    <div className="flex items-center gap-6">
      {links.map((link) => (
        <NavLink key={link.text} href={link.href || "#"} FlyoutContent={link.FlyoutContent}>
          {link.text}
        </NavLink>
      ))}
    </div>
  );
};

const NavLink = ({ children, href, FlyoutContent }: { children: ReactNode; href: string; FlyoutContent?: () => JSX.Element }) => {
  const [open, setOpen] = useState(false);

  const showFlyout = FlyoutContent && open;

  return (
    <div onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} className="relative h-fit w-fit">
      {FlyoutContent ? (
        <span className="relative cursor-pointer">
          {children}
          <span
            style={{
              transform: showFlyout ? "scaleX(1)" : "scaleX(0)",
            }}
            className="absolute -bottom-2 -left-2 -right-2 h-1 origin-left scale-x-0 rounded-full bg-indigo-300 transition-transform duration-500 ease-out"
          />
        </span>
      ) : (
        <a href={href} className="relative">
          {children}
          <span
            style={{
              transform: showFlyout ? "scaleX(1)" : "scaleX(0)",
            }}
            className="absolute -bottom-2 -left-2 -right-2 h-1 origin-left scale-x-0 rounded-full bg-indigo-300 transition-transform duration-500 ease-out"
          />
        </a>
      )}
      <AnimatePresence>
        {showFlyout && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            style={{ translateX: "-50%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute left-1/2 top-12 bg-white text-black"
          >
            <div className="absolute -top-6 left-0 right-0 h-6 bg-transparent" />
            <div className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white" />
            <FlyoutContent />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminFlyout = ({ userEmail }: { userEmail: string }) => {
  const showReports = userEmail === "dyslecixdev@gmail.com";

  return (
    <div className="w-48 bg-white p-6 shadow-xl">
      <div className="space-y-2">
        <Link href="/cms/flash-cards" className="block rounded px-4 py-2 text-sm transition-colors hover:bg-indigo-100">
          Flash Cards
        </Link>
        <Link href="/cms/exam-questions" className="block rounded px-4 py-2 text-sm transition-colors hover:bg-indigo-100">
          Exam Questions
        </Link>
        {showReports && (
          <a href="/cms/reports" className="block rounded px-4 py-2 text-sm transition-colors hover:bg-indigo-100">
            Reports
          </a>
        )}
      </div>
    </div>
  );
};

const AdminMobileFold = ({ userEmail }: { userEmail: string }) => {
  const showReports = userEmail === "dyslecixdev@gmail.com";

  return (
    <div className="ml-4 space-y-2">
      <Link href="/cms/flash-cards" className="block rounded bg-white px-4 py-2 text-sm transition-colors hover:bg-indigo-100">
        Flash Cards
      </Link>
      <Link href="/cms/exam-questions" className="block rounded bg-white px-4 py-2 text-sm transition-colors hover:bg-indigo-100">
        Exam Questions
      </Link>
      {showReports && (
        <a href="/cms/reports" className="block rounded bg-white px-4 py-2 text-sm transition-colors hover:bg-indigo-100">
          Reports
        </a>
      )}
    </div>
  );
};

const FlashCardsFlyout = () => {
  const numberToWord = (num: number) => {
    const words = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen"];
    return words[num] || num.toString();
  };

  return (
    <div className="w-64 bg-white p-6 shadow-xl">
      <div className="mb-3 space-y-3">
        <h3 className="font-semibold">Lecture</h3>
        <div className="grid grid-cols-3 gap-2">
          {[5, 6, 7, 8, 9, 10, 11, 12, 13].map((ch) => (
            <a key={ch} href={`/flash-cards/lecture/${numberToWord(ch)}`} className="rounded bg-neutral-100 px-3 py-2 text-center text-sm transition-colors hover:bg-indigo-100">
              Ch {ch}
            </a>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="font-semibold">Lab</h3>
        <div className="grid grid-cols-3 gap-2">
          {[10, 11, 12, 13, 14].map((wk) => (
            <a key={wk} href={`/flash-cards/lab/${numberToWord(wk)}`} className="rounded bg-neutral-100 px-3 py-2 text-center text-sm transition-colors hover:bg-indigo-100">
              Wk {wk}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

const ExamsFlyout = () => {
  return (
    <div className="w-48 bg-white p-6 shadow-xl">
      <div className="space-y-2">
        <a href="/exams/lecture/two" className="block rounded px-4 py-2 text-sm transition-colors hover:bg-indigo-100">
          Lecture 2
        </a>
        <a href="/exams/lecture/three" className="block rounded px-4 py-2 text-sm transition-colors hover:bg-indigo-100">
          Lecture 3
        </a>
        <a href="/exams/lab/four" className="block rounded px-4 py-2 text-sm transition-colors hover:bg-indigo-100">
          Lab 4
        </a>
        <a href="/exams/lab/five" className="block rounded px-4 py-2 text-sm transition-colors hover:bg-indigo-100">
          Lab 5
        </a>
      </div>
    </div>
  );
};

const LogoutButton = ({ onClick, isLoading }: { onClick: () => void; isLoading: boolean }) => {
  if (isLoading) {
    return <div className="h-10 w-24 animate-pulse rounded-lg bg-neutral-700" />;
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onClick}
        className="flex items-center gap-2 rounded-lg border-2 border-white px-4 py-2 font-semibold text-white transition-colors hover:bg-white hover:text-black duration-300 ease-in-out cursor-pointer"
      >
        <FaUserCircle />
        <span>Logout</span>
      </button>
    </div>
  );
};

const MobileMenuLink = ({ children, href, FoldContent, setMenuOpen }: { children: ReactNode; href: string; FoldContent?: FC; setMenuOpen: Dispatch<SetStateAction<boolean>> }) => {
  const [ref, { height }] = useMeasure();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative text-neutral-950">
      {FoldContent ? (
        <div className="flex w-full cursor-pointer items-center justify-between border-b border-neutral-300 py-6 text-start text-2xl font-semibold" onClick={() => setOpen((pv) => !pv)}>
          <span>{children}</span>
          <motion.div
            animate={{ rotate: open ? "180deg" : "0deg" }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
          >
            <FiChevronDown />
          </motion.div>
        </div>
      ) : (
        <a
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(false);
          }}
          href={href}
          className="flex w-full cursor-pointer items-center justify-between border-b border-neutral-300 py-6 text-start text-2xl font-semibold"
        >
          <span>{children}</span>
          <FiArrowRight />
        </a>
      )}
      {FoldContent && (
        <motion.div
          initial={false}
          animate={{
            height: open ? height : "0px",
            marginBottom: open ? "24px" : "0px",
            marginTop: open ? "12px" : "0px",
          }}
          className="overflow-hidden"
        >
          <div ref={ref}>
            <FoldContent />
          </div>
        </motion.div>
      )}
    </div>
  );
};

const FlashCardsMobileFold = () => {
  const numberToWord = (num: number) => {
    const words = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen"];
    return words[num] || num.toString();
  };

  return (
    <div className="ml-4 space-y-4">
      <div>
        <h3 className="mb-2 text-lg font-semibold">Lecture</h3>
        <div className="grid grid-cols-3 gap-2">
          {[5, 6, 7, 8, 9, 10, 11, 12, 13].map((ch) => (
            <a key={ch} href={`/flash-cards/lecture/${numberToWord(ch)}`} className="rounded bg-white px-3 py-2 text-center text-sm transition-colors hover:bg-indigo-100">
              Ch {ch}
            </a>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-lg font-semibold">Lab</h3>
        <div className="grid grid-cols-3 gap-2">
          {[10, 11, 12, 13, 14].map((wk) => (
            <a key={wk} href={`/flash-cards/lab/${numberToWord(wk)}`} className="rounded bg-white px-3 py-2 text-center text-sm transition-colors hover:bg-indigo-100">
              Wk {wk}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

const ExamsMobileFold = () => {
  return (
    <div className="ml-4 space-y-2">
      <a href="/exams/lecture/two" className="block rounded bg-white px-4 py-2 text-sm transition-colors hover:bg-indigo-100">
        Lecture 2
      </a>
      <a href="/exams/lecture/three" className="block rounded bg-white px-4 py-2 text-sm transition-colors hover:bg-indigo-100">
        Lecture 3
      </a>
      <a href="/exams/lab/four" className="block rounded bg-white px-4 py-2 text-sm transition-colors hover:bg-indigo-100">
        Lab 4
      </a>
      <a href="/exams/lab/five" className="block rounded bg-white px-4 py-2 text-sm transition-colors hover:bg-indigo-100">
        Lab 5
      </a>
    </div>
  );
};

const MobileMenu = ({ onClick: signOut, userAdmin, userEmail, isLoading }: { onClick: () => void; userAdmin: string; userEmail: string; isLoading: boolean }) => {
  const [open, setOpen] = useState(false);

  const links = LINKS.map((link) => {
    if (link.text === "Admin" && userAdmin === "admin") {
      return {
        ...link,
        FlyoutContent: () => <AdminFlyout userEmail={userEmail} />,
        FoldContent: () => <AdminMobileFold userEmail={userEmail} />,
      };
    }
    return link;
  }).filter((link) => {
    if (link.text === "Admin") {
      return userAdmin === "admin";
    }
    return true;
  });

  return (
    <div className="block lg:hidden">
      <button onClick={() => setOpen(true)} className="block text-3xl">
        <FiMenu />
      </button>
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ x: "100vw" }}
            animate={{ x: 0 }}
            exit={{ x: "100vw" }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed left-0 top-0 flex h-screen w-full flex-col bg-white"
          >
            <div className="flex items-center justify-between p-6">
              <Logo color="black" />
              <button onClick={() => setOpen(false)}>
                <FiX className="text-3xl text-neutral-950" />
              </button>
            </div>
            <div className="h-screen overflow-y-scroll bg-neutral-100 p-6">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="h-12 w-full animate-pulse rounded bg-neutral-300" />
                  <div className="h-12 w-full animate-pulse rounded bg-neutral-300" />
                </div>
              ) : (
                links.map((link) => (
                  <MobileMenuLink key={link.text} href={link.href || "#"} FoldContent={link.FoldContent} setMenuOpen={setOpen}>
                    {link.text}
                  </MobileMenuLink>
                ))
              )}
            </div>
            <div className="flex justify-end bg-neutral-950 p-6">
              {isLoading ? <div className="h-10 w-24 animate-pulse rounded-lg bg-neutral-700" /> : <LogoutButton onClick={signOut} isLoading={false} />}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
};

const LINKS = [
  {
    text: "Admin",
    href: "/cms",
  },
  {
    text: "Flash Cards",
    FlyoutContent: FlashCardsFlyout,
    FoldContent: FlashCardsMobileFold,
  },
  {
    text: "Exams",
    FlyoutContent: ExamsFlyout,
    FoldContent: ExamsMobileFold,
  },
  {
    text: "FAQ",
    href: "/faq",
  },
  {
    text: "Updates",
    href: "/updates",
  },
];

