import React from "react";
import { Lock, Check, X, Loader2, Sparkles } from "lucide-react";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  onPay: () => void;
  priceUsd: number;
  loading?: boolean;
  error?: string;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ open, onClose, onPay, priceUsd, loading, error }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1C2C1D]/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-[#CCD7CD] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-tr from-[#1E4D2B] via-[#255437] to-[#3B664C] px-6 py-6 text-white">
          <button onClick={onClose} className="absolute top-3 right-3 text-white/80 hover:text-white cursor-pointer" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Unlock your menu</h2>
              <p className="text-xs text-white/80">One-time payment · no subscription</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-extrabold text-[#1C2C1D]">${priceUsd}</span>
            <span className="text-sm text-[#5C6E5F]">one time</span>
          </div>

          <ul className="space-y-2.5 text-sm text-[#2C3A2E]">
            {[
              "Remove the watermark from every photo",
              "Download print-ready PDF menus",
              "Export the full pack (images + data) as ZIP",
              "Keep editing and re-downloading this menu",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-[#255437] mt-0.5 shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>

          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
          )}

          <button
            onClick={onPay}
            disabled={loading}
            className="w-full bg-[#255437] hover:bg-[#1C422B] disabled:opacity-60 text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Redirecting to secure checkout…" : `Unlock for $${priceUsd}`}
          </button>

          <p className="text-[11px] text-center text-[#819084]">
            Secure payment by Stripe. You'll return here automatically after paying.
          </p>
        </div>
      </div>
    </div>
  );
};
