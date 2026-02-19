'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserRole } from '@hardware-os/shared';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

type Step = 'role' | 'form';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState<Step>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // Form fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleRoleSelect(role: UserRole) {
    setSelectedRole(role);
    setStep('form');
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Enter a valid email address';
    }

    if (!phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!/^(\+?234|0)[789]\d{9}$/.test(phone.replace(/\s/g, ''))) {
      errs.phone = 'Enter a valid Nigerian phone number';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    if (selectedRole === UserRole.MERCHANT && !businessName.trim()) {
      errs.businessName = 'Business name is required for merchants';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedRole || !validate()) return;

    setIsSubmitting(true);
    try {
      await register({
        email,
        phone: phone.replace(/\s/g, ''),
        password,
        role: selectedRole,
        businessName: selectedRole === UserRole.MERCHANT ? businessName : undefined,
      });
      toast.success('Account created successfully');
      // AuthProvider sets user — redirect based on role
      if (selectedRole === UserRole.MERCHANT) {
        router.push('/merchant/dashboard');
      } else {
        router.push('/buyer/dashboard');
      }
    } catch (err: unknown) {
      const apiErr = err as { error?: string };
      toast.error(apiErr.error || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Step 1: Role Selection
  if (step === 'role') {
    return (
      <Card>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Create your account
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          How will you use Hardware OS?
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleRoleSelect(UserRole.MERCHANT)}
            className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-border hover:border-accent hover:bg-blue-50 transition-colors cursor-pointer text-center"
          >
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h18v6H3V3z"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Merchant</p>
              <p className="text-xs text-gray-500 mt-1">
                I sell construction materials
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect(UserRole.BUYER)}
            className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-border hover:border-accent hover:bg-blue-50 transition-colors cursor-pointer text-center"
          >
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Buyer</p>
              <p className="text-xs text-gray-500 mt-1">
                I buy construction materials
              </p>
            </div>
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-accent font-medium hover:underline"
          >
            Login
          </Link>
        </p>
      </Card>
    );
  }

  // Step 2: Registration Form
  return (
    <Card>
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => setStep('role')}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Go back"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedRole === UserRole.MERCHANT
              ? 'Merchant Registration'
              : 'Buyer Registration'}
          </h2>
          <p className="text-sm text-gray-500">
            Fill in your details to get started
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
        />

        <Input
          id="phone"
          label="Phone Number"
          type="tel"
          placeholder="08012345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
          autoComplete="tel"
        />

        {selectedRole === UserRole.MERCHANT && (
          <Input
            id="businessName"
            label="Business Name"
            type="text"
            placeholder="Your hardware store name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            error={errors.businessName}
          />
        )}

        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="new-password"
        />

        <Input
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        <Button
          type="submit"
          className="w-full"
          isLoading={isSubmitting}
        >
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-accent font-medium hover:underline"
        >
          Login
        </Link>
      </p>
    </Card>
  );
}
