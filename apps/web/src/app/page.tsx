"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  ShieldCheck, 
  Store, 
  BadgeCheck, 
  ArrowRight, 
  Loader2,
  CheckCircle2,
  Lock,
  Globe
} from "lucide-react";
import { toast } from "sonner";

const waitlistSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
});

type WaitlistValues = z.infer<typeof waitlistSchema>;

export default function MerchantWaitlistPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WaitlistValues>({
    resolver: zodResolver(waitlistSchema),
  });

  const onSubmit = async (data: WaitlistValues) => {
    setIsSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("API URL is not configured");
      }

      const response = await fetch(`${apiUrl}/waitlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);
        toast.success("You've been added to the waitlist!");
        reset();
      } else {
        toast.error(result.message || "Something went wrong. Please try again.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to connect to the server. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F1117] text-slate-900 dark:text-white font-inter selection:bg-emerald-100 dark:selection:bg-emerald-900/30 transition-colors duration-300">
      
      {/* --- Minimal Header --- */}
      <nav className="fixed top-0 w-full z-50 bg-white dark:bg-[#0F1117] border-b border-slate-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-bold font-display text-[#00C853] dark:text-[#4ADE80] tracking-tight">
            twizrr
          </div>
          <div className="flex items-center gap-6">
            <span className="hidden sm:inline text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              Merchant Launch 2026
            </span>
            <div className="h-4 w-px bg-slate-200 dark:bg-white/10 hidden sm:block" />
            <a href="mailto:support@twizrr.com" className="text-xs font-bold text-slate-500 hover:text-[#00C853] transition-colors">
              Support
            </a>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-24 px-6 md:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-24 items-start">
          
          {/* --- Left Column: Clean Storytelling --- */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Now Onboarding Founders
            </div>

            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-bold font-display leading-[1.1] mb-8 text-slate-900 dark:text-white tracking-[-0.03em]">
              Sell on twizrr — Nigeria&apos;s <br className="hidden xl:block" />
              Professional Escrow Marketplace
            </h1>

            <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 mb-12 max-w-2xl leading-relaxed">
              Join our founding merchants program. Build trust with escrow-protected payments, 
              get your own dedicated storefront, and list products directly from WhatsApp.
            </p>

            {/* Trust Points: Professional Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-16">
              {[
                {
                  icon: ShieldCheck,
                  title: "Escrow Protection",
                  desc: "Guaranteed payments held securely until delivery confirmation."
                },
                {
                  icon: Store,
                  title: "Digital Storefront",
                  desc: "Your own professional business page at twizrr.com/@yourname."
                },
                {
                  icon: BadgeCheck,
                  title: "Merchant Verification",
                  desc: "Build buyer trust instantly with our 3-tier verification system."
                },
                {
                  icon: Globe,
                  title: "WhatsApp Selling",
                  desc: "List and manage orders without leaving your favorite chat app."
                }
              ].map((point, idx) => (
                <div key={idx} className="group flex items-start gap-4 p-4 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10">
                  <div className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-slate-400 group-hover:text-[#00C853] transition-colors">
                    <point.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">{point.title}</h3>
                    <p className="text-slate-500 dark:text-slate-500 text-sm leading-relaxed">
                      {point.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mockup Integration */}
            <div className="relative group overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-xl hover:shadow-emerald-500/5">
              <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Image 
                src="/images/marketing/merchant_phone.png"
                alt="Merchant UI Preview"
                width={800}
                height={450}
                className="w-full h-auto opacity-90 group-hover:opacity-100 transition-opacity duration-500 grayscale group-hover:grayscale-0"
              />
              <div className="absolute bottom-4 left-4 flex gap-2">
                <span className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-[8px] font-bold text-white uppercase tracking-wider">
                  Merchant Dashboard
                </span>
                <span className="px-2 py-1 bg-[#00C853] rounded text-[8px] font-bold text-white uppercase tracking-wider">
                  Escrow Verified
                </span>
              </div>
            </div>
          </div>

          {/* --- Right Column: Focused Action --- */}
          <div className="lg:col-span-5 sticky top-32">
            <div className="bg-white dark:bg-[#15181F] border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm">
              {isSuccess ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold font-display mb-4 text-slate-900 dark:text-white">Registration Successful</h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-10 text-sm leading-relaxed">
                    You&apos;ve been added to our founding merchant waitlist. 
                    A member of our team will reach out via email within 48 hours for the next steps.
                  </p>
                  <button 
                    onClick={() => setIsSuccess(false)}
                    className="text-xs font-bold text-[#00C853] hover:text-[#00B049] transition-colors"
                  >
                    Register another business
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-10 text-center lg:text-left">
                    <h2 className="text-2xl font-bold font-display mb-2 text-slate-900 dark:text-white">Begin Onboarding</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      Secure your 3 months of 0% platform fees.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-1.5 focus-within:text-[#00C853] transition-colors">
                      <label htmlFor="businessName" className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">
                        Business Name
                      </label>
                      <input
                        id="businessName"
                        {...register("businessName")}
                        placeholder="e.g. Twizrr Electronics"
                        className="w-full h-12 px-4 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl focus:ring-[1px] focus:ring-[#00C853] focus:border-[#00C853] outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
                      />
                      {errors.businessName && (
                        <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold italic">{errors.businessName.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5 focus-within:text-[#00C853] transition-colors">
                      <label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">
                        Official Email
                      </label>
                      <input
                        id="email"
                        {...register("email")}
                        type="email"
                        placeholder="business@example.com"
                        className="w-full h-12 px-4 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl focus:ring-[1px] focus:ring-[#00C853] focus:border-[#00C853] outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold italic">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5 focus-within:text-[#00C853] transition-colors">
                      <label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">
                        Phone (Optional)
                      </label>
                      <input
                        id="phone"
                        {...register("phone")}
                        placeholder="+234..."
                        className="w-full h-12 px-4 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl focus:ring-[1px] focus:ring-[#00C853] focus:border-[#00C853] outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-14 bg-slate-900 hover:bg-black dark:bg-[#00C853] dark:hover:bg-[#00B049] text-white dark:text-[#0F1117] font-black text-sm rounded-xl transition-all active:scale-[0.99] disabled:opacity-70 flex items-center justify-center gap-3 shadow-lg shadow-black/5 dark:shadow-emerald-500/10"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white dark:text-black" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            Submit Interest
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
              
              <div className="mt-10 pt-8 border-t border-slate-100 dark:border-white/5 space-y-4">
                <div className="flex items-center gap-3 text-slate-400 dark:text-slate-600">
                  <Lock className="w-3 h-3" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Enterprise-grade security</p>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-600 leading-relaxed italic">
                  By joining, you represent that you are an authorized representative of the business. 
                  Twizrr implements zero-party data protection protocols.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* --- Simple Footer --- */}
      <footer className="border-t border-slate-200 dark:border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="text-lg font-bold font-display text-slate-900 dark:text-white tracking-tight">
              twizrr<span className="text-[#00C853] dark:text-[#4ADE80]">.</span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              © 2026 Twizrr Nigeria. Professional Social Commerce.
            </p>
          </div>
          
          <div className="flex gap-10 text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">
            <a href="#" className="hover:text-[#00C853] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#00C853] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#00C853] transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
