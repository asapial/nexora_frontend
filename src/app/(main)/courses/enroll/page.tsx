"use client";
// /courses/[id]/enroll  — Stripe payment + free enrollment

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  RiSparklingFill, RiCheckLine, RiAlertLine, RiLoader4Line,
  RiBookOpenLine, RiShieldCheckLine, RiLock2Line, RiArrowLeftLine,
  RiFileTextLine, RiGroupLine, RiStarFill, RiCheckboxCircleLine,
  RiBankCardLine, RiSecurePaymentLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { studentApi, paymentApi } from "../../../../lib/api";
import { toast } from "sonner";
// NOTE: install: npm i @stripe/react-stripe-js @stripe/stripe-js
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// Initialize Stripe (use your publishable key from env)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const fmtUSD = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

// ─── Ambient BG ───────────────────────────────────────────
function AmbientBg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none">
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(20,184,166,0.11) 1px,transparent 1px)", backgroundSize: "30px 30px" }} />
      <div className="absolute -top-60 -left-40 w-[600px] h-[600px] rounded-full bg-teal-500/[0.06] blur-[120px]" />
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-teal-400/[0.04] blur-[100px]" />
      <div className="absolute -bottom-60 left-1/3 w-[500px] h-[400px] rounded-full bg-amber-500/[0.04] blur-[110px]" />
    </div>
  );
}

// ─── Course Summary Widget ────────────────────────────────
function CourseSummary({ course }: { course: any }) {
  return (
    <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm overflow-hidden">
      {course.thumbnailUrl && (
        <div className="h-40 overflow-hidden relative">
          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}
      <div className="px-5 py-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {course.isFeatured && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 text-[11px] font-bold text-amber-600 dark:text-amber-400"><RiStarFill className="text-xs" />Featured</span>}
          {course.tags?.slice(0, 3).map((t: string) => (
            <span key={t} className="px-2 py-0.5 rounded-md bg-muted/50 border border-border text-[11px] font-semibold text-muted-foreground">{t}</span>
          ))}
        </div>
        <h2 className="text-[15px] font-extrabold text-foreground leading-snug">{course.title}</h2>
        {course.description && <p className="text-[12.5px] text-muted-foreground line-clamp-2 leading-relaxed">{course.description}</p>}
        <div className="flex items-center gap-4 pt-1 border-t border-border/60">
          <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground"><RiGroupLine className="text-xs text-teal-600 dark:text-teal-400" />{(course._count?.enrollments ?? 0).toLocaleString()} students</span>
          <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground"><RiFileTextLine className="text-xs text-teal-600 dark:text-teal-400" />{course._count?.missions ?? 0} missions</span>
        </div>
      </div>
    </div>
  );
}

// ─── Order Summary ────────────────────────────────────────
function OrderSummary({ course }: { course: any }) {
  const tax = course.isFree ? 0 : parseFloat((course.price * 0).toFixed(2)); // 0% tax for simplicity
  return (
    <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm px-5 py-5 flex flex-col gap-3">
      <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">Order summary</p>
      <div className="flex items-center justify-between">
        <p className="text-[13.5px] text-foreground font-semibold truncate max-w-[200px]">{course.title}</p>
        <p className="text-[13.5px] font-bold text-foreground tabular-nums">{course.isFree ? "Free" : fmtUSD(course.price)}</p>
      </div>
      {!course.isFree && (
        <>
          <div className="h-px bg-border/60" />
          <div className="flex items-center justify-between">
            <p className="text-[13.5px] font-extrabold text-foreground">Total</p>
            <p className="text-[18px] font-extrabold text-foreground tabular-nums">{fmtUSD(course.price)}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800/50">
            <RiShieldCheckLine className="text-teal-600 dark:text-teal-400 text-sm flex-shrink-0" />
            <p className="text-[11.5px] text-teal-700 dark:text-teal-300">Secure payment · Encrypted by Stripe</p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Stripe Payment Form (inner — needs Elements context) ─
function StripePaymentForm({ course, clientSecret, paymentIntentId, onSuccess }: {
  course: any; clientSecret: string; paymentIntentId: string | null; onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true); setErr(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/courses/${course.id}/enroll/success`,
      },
      redirect: "if_required",
    });

    if (error) {
      setErr(error.message ?? "Payment failed. Please try again.");
      setPaying(false);
      return;
    }

    const piId = paymentIntent?.id ?? paymentIntentId ?? undefined;
    if (!piId) {
      setErr("Could not confirm payment reference. Please contact support.");
      setPaying(false);
      return;
    }

    try {
      await paymentApi.confirmPayment(piId);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not finalize enrollment. Try refresh or contact support.");
      setPaying(false);
      return;
    }

    toast.success("Payment successful! You're enrolled.", { position: "top-right" });
    onSuccess();
  };

  return (
    <form onSubmit={handlePay} className="flex flex-col gap-5">
      {/* Stripe Payment Element */}
      <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 text-teal-600 dark:text-teal-400 text-base">
            <RiBankCardLine />
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-foreground leading-none mb-0.5">Payment details</h2>
            <p className="text-[12px] text-muted-foreground">Powered by Stripe — bank-grade security</p>
          </div>
          {/* Stripe badge */}
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/40 border border-border">
            <RiLock2Line className="text-teal-600 dark:text-teal-400 text-xs" />
            <span className="text-[10.5px] font-bold text-muted-foreground">SSL</span>
          </div>
        </div>
        <div className="px-5 py-5">

          
        </div>
      </div>

      {err && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50">
          <RiAlertLine className="text-red-500 text-base mt-0.5 flex-shrink-0" />
          <p className="text-[13px] font-medium text-red-600 dark:text-red-400">{err}</p>
        </div>
      )}

      {/* Card logos */}
      <div className="flex items-center gap-2 justify-center opacity-60">
        {["VISA", "MC", "AMEX", "PayPal"].map(b => (
          <span key={b} className="px-2.5 py-1 rounded-md border border-border bg-muted/30 text-[10.5px] font-bold text-muted-foreground">{b}</span>
        ))}
      </div>

      <button type="submit" disabled={!stripe || paying}
        className={cn(
          "w-full h-12 rounded-xl flex items-center justify-center gap-2",
          "bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600",
          "text-white text-[14px] font-extrabold",
          "shadow-lg shadow-teal-600/20 transition-all duration-200",
          "hover:scale-[1.01] active:scale-[0.99]",
          "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        )}>
        {paying
          ? <><RiLoader4Line className="animate-spin text-lg" /> Processing…</>
          : <><RiLock2Line className="text-base" /> Pay {fmtUSD(course.price)}</>
        }
      </button>

      <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1.5">
        <RiSecurePaymentLine className="text-teal-600 dark:text-teal-400 text-sm" />
        Your payment is secure and encrypted. We never store card details.
      </p>
    </form>
  );
}

// ─── Success Screen ───────────────────────────────────────
function SuccessScreen({ course }: { course: any }) {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => router.push(`/dashboard/student/courses/${course.id}`), 2500);
    return () => clearTimeout(t);
  }, [course.id, router]);

  return (
    <div className="rounded-2xl border border-teal-200/60 dark:border-teal-800/50 bg-card/90 backdrop-blur-sm p-12 flex flex-col items-center text-center gap-5">
      {/* Animated check */}
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full bg-teal-100/60 dark:bg-teal-950/40 animate-ping opacity-40" />
        <div className="relative w-20 h-20 rounded-2xl bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/50 flex items-center justify-center text-teal-600 dark:text-teal-400 text-3xl">
          <RiCheckboxCircleLine />
        </div>
      </div>
      <div>
        <h2 className="text-[1.3rem] font-extrabold text-foreground">You're enrolled! 🎉</h2>
        <p className="text-[13.5px] text-muted-foreground mt-1 max-w-xs mx-auto">
          {course.title} is ready for you. Let's start learning.
        </p>
      </div>
      <div className="w-6 h-6 border-2 border-teal-200 dark:border-teal-800 border-t-teal-500 rounded-full animate-spin" />
      <p className="text-[12px] text-muted-foreground/60">Redirecting to course player…</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function EnrollPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [course, setCourse] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load course
  useEffect(() => {
    studentApi.getCoursePublic(id)
      .then(r => setCourse(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  // For paid courses: create PaymentIntent and get clientSecret
  useEffect(() => {
    if (!course || course.isFree) return;
    paymentApi.createIntent(id)
      .then(r => {
        setClientSecret(r.data.clientSecret);
        setPaymentIntentId(r.data.paymentIntentId);
      })
      .catch(e => setError(e.message));
  }, [course, id]);

  const handleFreeEnroll = async () => {
    setEnrolling(true); setError(null);
    try {
      await studentApi.freeEnroll(id);
      toast.success("Enrolled successfully!", { position: "top-right" });
      setSuccess(true);
    } catch (e: any) { setError(e.message); }
    finally { setEnrolling(false); }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="relative flex flex-col gap-6 p-5 lg:p-8 max-w-2xl mx-auto pt-6 animate-pulse">
        <AmbientBg />
        <div className="h-8 w-40 rounded-full bg-muted/60" />
        <div className="h-48 rounded-2xl bg-muted/40" />
        <div className="h-64 rounded-2xl bg-muted/40" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="relative flex flex-col items-center gap-4 p-10 max-w-xl mx-auto text-center">
        <AmbientBg />
        <RiAlertLine className="text-4xl text-red-500" />
        <p className="text-[14px] font-bold text-foreground">{error ?? "Course not found"}</p>
        <button onClick={() => router.push("/courses")} className="h-9 px-4 rounded-xl bg-teal-600 dark:bg-teal-500 text-white text-[13px] font-bold hover:bg-teal-700 transition-colors">Browse courses</button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-6 p-5 lg:p-8 pt-6 max-w-5xl mx-auto w-full min-h-screen">
      <AmbientBg />

      {/* Back */}
      <div>
        <button onClick={() => router.push(`/courses/${id}`)} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3">
          <RiArrowLeftLine /> Back to course
        </button>
        <div className="flex items-center gap-1.5 mb-1">
          <RiSparklingFill className="text-teal-500 dark:text-teal-400 text-sm animate-pulse" />
          <span className="text-[10.5px] font-bold tracking-[.12em] uppercase text-muted-foreground">Enrollment</span>
        </div>
        <h1 className="text-[1.5rem] font-extrabold tracking-tight text-foreground leading-none">
          {course.isFree ? "Enroll for free" : "Complete purchase"}
        </h1>
        <p className="text-[13.5px] text-muted-foreground mt-1">
          {course.isFree ? "No payment required — instant access." : "Secure payment powered by Stripe."}
        </p>
      </div>

      {/* Success */}
      {success ? (
        <SuccessScreen course={course} />
      ) : (
        <>
          {/* Course summary */}
          <CourseSummary course={course} />

          {/* Order summary */}
          <OrderSummary course={course} />

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50">
              <RiAlertLine className="text-red-500 text-base mt-0.5 flex-shrink-0" />
              <p className="text-[13px] font-medium text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* ── FREE enrollment ── */}
          {course.isFree && (
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800/50">
                <RiCheckLine className="text-teal-600 dark:text-teal-400 text-base mt-0.5 flex-shrink-0" />
                <p className="text-[13px] text-teal-700 dark:text-teal-300 leading-relaxed">
                  This is a <strong>free course</strong>. Click below to enroll instantly — no payment required. You'll have full access immediately.
                </p>
              </div>
              <button onClick={handleFreeEnroll} disabled={enrolling}
                className={cn(
                  "w-full h-12 rounded-xl flex items-center justify-center gap-2",
                  "bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600",
                  "text-white text-[14px] font-extrabold",
                  "shadow-lg shadow-teal-600/20 transition-all duration-200",
                  "hover:scale-[1.01] active:scale-[0.99]",
                  "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                )}>
                {enrolling ? <RiLoader4Line className="animate-spin text-lg" /> : <RiCheckLine className="text-lg" />}
                {enrolling ? "Enrolling…" : "Enroll for free — Start now"}
              </button>
            </div>
          )}

          {/* ── PAID — Stripe ── */}
          {!course.isFree && clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: {
                    colorPrimary: "#0d9488",
                    fontFamily: "inherit",
                    borderRadius: "12px",
                  },
                },
              }}
            >
              <StripePaymentForm
                course={course}
                clientSecret={clientSecret}
                paymentIntentId={paymentIntentId}
                onSuccess={() => setSuccess(true)}
              />
            </Elements>
          )}

          {!course.isFree && !clientSecret && !error && (
            <div className="flex items-center justify-center py-8 gap-3">
              <RiLoader4Line className="animate-spin text-teal-500 text-xl" />
              <p className="text-[13px] text-muted-foreground">Initialising secure payment…</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}