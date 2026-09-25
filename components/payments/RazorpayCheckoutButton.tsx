"use client";

/**
 * RazorpayCheckoutButton
 *
 * A reusable checkout button that:
 * 1. Calls POST /api/payments/create-order to create a Razorpay order
 * 2. Loads the Razorpay Standard Checkout script on demand
 * 3. Opens the Razorpay modal with the order_id
 * 4. On success, calls POST /api/payments/verify-payment with the three
 *    Razorpay response fields (payment_id, order_id, signature)
 * 5. Invokes onSuccess / onFailure callbacks
 *
 * Usage:
 *   <RazorpayCheckoutButton
 *     amount={99900}           // ₹999 in paise
 *     currency="INR"
 *     description="Pro Plan — Monthly"
 *     buttonLabel="Pay ₹999"
 *     onSuccess={(paymentId) => console.log("Paid!", paymentId)}
 *     onFailure={(err) => console.error("Failed:", err)}
 *   />
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, CreditCard } from "lucide-react";
import { cn } from "@/app/components/lib/utils";

// Minimal type for the Razorpay global injected by checkout.js
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
  handler: (response: RazorpayPaymentResponse) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface RazorpayInstance {
  open(): void;
  on(event: string, handler: (response: RazorpayPaymentResponse) => void): void;
}

interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// ── Props ─────────────────────────────────────────────────────────────────────
export interface RazorpayCheckoutButtonProps {
  /** Amount in paise (100 paise = ₹1). Minimum 100. */
  amount: number;
  currency?: string;
  /** Button label text */
  buttonLabel?: string;
  /** Description shown in the Razorpay modal */
  description?: string;
  /** Optional receipt string for order tracking */
  receipt?: string;
  /** Optional key-value notes attached to the Razorpay order */
  notes?: Record<string, string>;
  /** User's display name for prefill */
  prefillName?: string;
  /** User's email for prefill */
  prefillEmail?: string;
  className?: string;
  /** Called with paymentId after backend verification succeeds */
  onSuccess?: (paymentId: string, orderId: string) => void;
  /** Called if payment fails or verification fails */
  onFailure?: (error: string) => void;
  /** Called when the user dismisses the modal without paying */
  onDismiss?: () => void;
  disabled?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Dynamically loads the Razorpay checkout.js script (idempotent). */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window.Razorpay !== "undefined") {
      resolve(true);
      return;
    }

    const existing = document.getElementById("razorpay-checkout-script");
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RazorpayCheckoutButton({
  amount,
  currency = "INR",
  buttonLabel = "Pay Now",
  description,
  receipt,
  notes,
  prefillName,
  prefillEmail,
  className,
  onSuccess,
  onFailure,
  onDismiss,
  disabled = false,
}: RazorpayCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = useCallback(async () => {
    if (loading || disabled) return;
    setLoading(true);

    try {
      // ── Step 1: Load Razorpay script ─────────────────────────────────────
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        const msg =
          "Could not load payment system. Please check your internet connection and try again.";
        toast.error(msg);
        onFailure?.(msg);
        return;
      }

      // ── Step 2: Create order on the server ───────────────────────────────
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, currency, receipt, notes }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        const msg = orderData.error || "Failed to initiate payment. Please try again.";
        toast.error(msg);
        onFailure?.(msg);
        return;
      }

      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        const msg = "Payment system is not configured. Please contact support.";
        toast.error(msg);
        onFailure?.(msg);
        return;
      }

      // ── Step 3: Open Razorpay modal ──────────────────────────────────────
      const options: RazorpayOptions = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Wander.AI",
        description: description ?? "Wander.AI Subscription",
        order_id: orderData.id,
        prefill: {
          name: prefillName,
          email: prefillEmail,
        },
        theme: {
          color: "#7c3aed", // Wander.AI brand purple — matches --primary
        },
        modal: {
          ondismiss: () => {
            toast("Payment cancelled", { description: "You closed the payment window." });
            onDismiss?.();
            setLoading(false);
          },
        },
        handler: async (response: RazorpayPaymentResponse) => {
          // ── Step 4: Verify signature on the server ───────────────────────
          try {
            const verifyRes = await fetch("/api/payments/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              const msg =
                verifyData.error ||
                "Payment verification failed. Please contact support.";
              toast.error("Payment not verified", { description: msg });
              onFailure?.(msg);
            } else {
              toast.success("Payment successful! 🎉", {
                description: `Payment ID: ${response.razorpay_payment_id}`,
              });
              onSuccess?.(response.razorpay_payment_id, response.razorpay_order_id);
            }
          } catch (verifyErr) {
            const msg = "Network error during payment verification. Contact support.";
            toast.error(msg);
            onFailure?.(msg);
          } finally {
            setLoading(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);

      // Handle payment failure events from inside the modal
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rzp.on("payment.failed", (response: any) => {
        const msg =
          response?.error?.description ||
          "Payment failed. Please try a different payment method.";
        toast.error("Payment failed", { description: msg });
        onFailure?.(msg);
        setLoading(false);
      });

      rzp.open();
    } catch (err: any) {
      const msg = err?.message || "An unexpected error occurred.";
      toast.error("Payment error", { description: msg });
      onFailure?.(msg);
      setLoading(false);
    }
  }, [
    loading,
    disabled,
    amount,
    currency,
    receipt,
    notes,
    description,
    prefillName,
    prefillEmail,
    onSuccess,
    onFailure,
    onDismiss,
  ]);

  return (
    <button
      type="button"
      onClick={handlePayment}
      disabled={disabled || loading}
      className={cn(
        // Base styles
        "inline-flex items-center justify-center gap-2 font-semibold rounded-2xl",
        "px-6 py-3 text-sm transition-all duration-200",
        // Razorpay brand-aligned: deep purple gradient matching brand
        "bg-gradient-to-r from-violet-600 to-purple-600 text-white",
        "hover:from-violet-700 hover:to-purple-700",
        "focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:ring-offset-2",
        // Disabled / loading
        "disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none",
        // Shadow
        "shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40",
        className
      )}
      aria-label={loading ? "Processing payment..." : buttonLabel}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span>Processing…</span>
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4" aria-hidden="true" />
          <span>{buttonLabel}</span>
        </>
      )}
    </button>
  );
}
