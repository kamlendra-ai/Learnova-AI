"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07070a]">
      {/* Background Glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/20 blur-[140px]" />
      </div>

      {/* Big Learnova AI Logo */}
      <div className="relative animate-logo">
        <img
          src="/logo-ai.png"
          alt="Learnova AI"
          className="h-72 w-72 object-contain md:h-96 md:w-96"
        />
      </div>

      <style jsx>{`
        @keyframes logoBlink {
          0% {
            opacity: 0;
            transform: scale(0.65);
          }

          15% {
            opacity: 1;
            transform: scale(1);
          }

          /* Blink 1 */
          27% {
            opacity: 0;
          }

          39% {
            opacity: 1;
          }

          /* Blink 2 */
          51% {
            opacity: 0;
          }

          63% {
            opacity: 1;
          }

          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-logo {
          animation: logoBlink 3s ease-in-out forwards;
        }
      `}</style>
    </main>
  );
}