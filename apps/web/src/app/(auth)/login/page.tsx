'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../providers/auth-provider';
import { useToast } from '../../../providers/toast-provider';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      // After login, the auth-provider will have the user state
      // Role-based redirect happens naturally if we check user in an effect
    } catch (err: any) {
      toast.error(err.error || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Login Card */}
      <div className="bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 rounded-xl p-8 md:p-10">
        {/* Card Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="mb-4 text-primary dark:text-slate-200 flex items-center justify-center size-14 rounded-full bg-primary/10 ring-4 ring-primary/5">
            <span className="material-symbols-outlined text-3xl font-bold">login</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Welcome back</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">Please enter your details to sign in</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block" htmlFor="email">Email Address</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">mail</span>
              <input
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-slate-900 dark:text-white placeholder:text-slate-400 outline-none text-sm"
                id="email"
                type="email"
                placeholder="e.g. name@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block" htmlFor="password">Password</label>
              <Link className="text-xs font-bold text-primary hover:underline" href="/forgot-password">Forgot?</Link>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">lock</span>
              <input
                className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-slate-900 dark:text-white placeholder:text-slate-400 outline-none text-sm"
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 outline-none"
              >
                <span className="material-symbols-outlined text-lg">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            disabled={isLoading}
            className="w-full bg-primary text-white font-bold py-4 rounded-lg hover:bg-primary/95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
            type="submit"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
            {!isLoading && <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>}
          </button>
        </form>

        {/* Toggle Link */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-sm text-slate-500 font-medium">
            Don't have an account?
            <Link className="font-bold text-primary hover:underline ml-1" href="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
