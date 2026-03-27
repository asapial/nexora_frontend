"use client";
// /courses/[id]/enroll/success  — Stripe redirect landing

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { RiCheckboxCircleLine, RiAlertLine, RiLoader4Line, RiArrowRightLine } from "react-icons/ri";
import { cn } from "@/lib/utils";
import { paymentApi } from "../../../../../lib/api";

function AmbientBg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none">
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(20,184,166,0.11) 1px,transparent 1px)", backgroundSize: "30px 30px" }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[800px] h-[800px] rounded-full bg-teal-500/[0.04] blur-[150px]" />
      </div>
    </div>
  );
}

type PayStatus = "loading" | "succeeded" | "processing" | "failed";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<PayStatus>("loading");
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const stripeStatus = searchParams.get("redirect_status");

    if (stripeStatus === "failed") { setStatus("failed"); return; }

    // Poll payment status — webhook may take a second
    const poll = async () => {
      try {
        const r = await paymentApi.getStatus(id);
        if (r.data.status === "PAID") {
          setStatus("succeeded");
          setTimeout(() => router.push(`/student/courses/${id}`), 2500);
        } else if (r.data.status === "FAILED") {
          setStatus("failed");
        } else {
          // Still processing — retry up to 8 times
          setAttempts(a => {
            if (a >= 8) { setStatus("failed"); return a; }
            setTimeout(poll, 1500);
            return a + 1;
          });
        }
      } catch { setStatus("failed"); }
    };

    poll();
  }, [id, searchParams, router]);

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6">
      <AmbientBg />
      <div className="w-full max-w-md">
        {status === "loading" || status === "processing" ? (
          <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm p-12 flex flex-col items-center text-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 flex items-center justify-center">
              <RiLoader4Line className="text-3xl text-teal-600 dark:text-teal-400 animate-spin" />
            </div>
            <div>
              <h2 className="text-[1.3rem] font-extrabold text-foreground">Confirming payment…</h2>
              <p className="text-[13.5px] text-muted-foreground mt-1">Please wait while we verify your payment.</p>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        ) : status === "succeeded" ? (
          <div className="rounded-2xl border border-teal-200/60 dark:border-teal-800/50 bg-card/90 backdrop-blur-sm p-12 flex flex-col items-center text-center gap-5">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-teal-400/20 animate-ping" />
              <div className="relative w-20 h-20 rounded-2xl bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 flex items-center justify-center text-teal-600 dark:text-teal-400 text-3xl">
                <RiCheckboxCircleLine />
              </div>
            </div>
            <div>
              <h2 className="text-[1.4rem] font-extrabold text-foreground">Payment successful! 🎉</h2>
              <p className="text-[13.5px] text-muted-foreground mt-1">You're now enrolled. Redirecting to your course…</p>
            </div>
            <div className="w-6 h-6 border-2 border-teal-200 dark:border-teal-800 border-t-teal-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="rounded-2xl border border-red-200/60 dark:border-red-800/50 bg-card/90 backdrop-blur-sm p-12 flex flex-col items-center text-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-red-100/70 dark:bg-red-950/50 border border-red-200/60 dark:border-red-800/50 flex items-center justify-center text-red-500 text-3xl">
              <RiAlertLine />
            </div>
            <div>
              <h2 className="text-[1.3rem] font-extrabold text-foreground">Payment failed</h2>
              <p className="text-[13.5px] text-muted-foreground mt-1">Your payment was not completed. No charge was made.</p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button onClick={() => router.push(`/courses/${id}/enroll`)}
                className="w-full h-11 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white text-[13.5px] font-bold transition-all flex items-center justify-center gap-2">
                Try again <RiArrowRightLine />
              </button>
              <button onClick={() => router.push("/courses")}
                className="w-full h-10 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
                Browse courses
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}