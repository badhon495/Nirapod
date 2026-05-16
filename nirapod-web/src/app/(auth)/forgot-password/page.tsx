"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";

import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
  otpSchema,
  type OtpInput,
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/axios";

type Step = "email" | "otp" | "reset" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [pendingEmail, setPendingEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingOtp, setPendingOtp] = useState("");

  const emailForm = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const otpForm = useForm<OtpInput>({
    resolver: zodResolver(otpSchema),
  });

  const resetForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onEmailSubmit(data: ForgotPasswordInput) {
    setLoading(true);
    try {
      await api.post("/api/v1/auth/forgot-password/send-otp", { email: data.email });
      setPendingEmail(data.email);
      setStep("otp");
      toast.success("Reset code sent to your email");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Could not send reset code. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function onOtpSubmit(data: OtpInput) {
    setPendingOtp(data.otp);
    setStep("reset");
  }

  async function onResetSubmit(data: ResetPasswordInput) {
    setLoading(true);
    try {
      await api.post("/api/v1/auth/forgot-password/reset", {
        email: pendingEmail,
        otp: pendingOtp,
        newPassword: data.newPassword,
      });
      setStep("done");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Reset failed. Please try again.";
      toast.error(msg);
      if (msg.toLowerCase().includes("otp") || msg.toLowerCase().includes("expired")) {
        setStep("otp");
      }
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    try {
      await api.post("/api/v1/auth/forgot-password/send-otp", { email: pendingEmail });
      toast.success("New code sent");
    } catch {
      toast.error("Could not resend code. Please wait a moment.");
    }
  }

  const titles: Record<Step, { title: string; description: string }> = {
    email: { title: "Reset password", description: "Enter your email to receive a reset code" },
    otp: { title: "Check your email", description: `Enter the 6-digit code sent to ${pendingEmail}` },
    reset: { title: "New password", description: "Choose a strong password" },
    done: { title: "Password reset", description: "Your password has been updated" },
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold tracking-tight">{titles[step].title}</CardTitle>
          <CardDescription>{titles[step].description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === "email" && (
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
              <Field label="Email" error={emailForm.formState.errors.email?.message}>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...emailForm.register("email")}
                />
              </Field>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send reset code
              </Button>
              <p className="text-center text-sm text-gray-600">
                Remember your password?{" "}
                <Link href="/login" className="text-blue-600 hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
              <Field label="Reset code" error={otpForm.formState.errors.otp?.message}>
                <Input
                  id="otp"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  className="text-center tracking-widest text-lg"
                  {...otpForm.register("otp")}
                />
              </Field>
              <Button type="submit" className="w-full">
                Continue
              </Button>
              <button
                type="button"
                onClick={resendOtp}
                className="w-full text-sm text-blue-600 hover:underline"
              >
                Resend code
              </button>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
              <Field label="New password" error={resetForm.formState.errors.newPassword?.message}>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  {...resetForm.register("newPassword")}
                />
              </Field>
              <Field label="Confirm password" error={resetForm.formState.errors.confirmPassword?.message}>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...resetForm.register("confirmPassword")}
                />
              </Field>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset password
              </Button>
            </form>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" aria-hidden="true" />
              <p className="text-sm text-gray-600">
                You can now sign in with your new password.
              </p>
              <Button className="w-full" onClick={() => router.push("/login")}>
                Sign in
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
