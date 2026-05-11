"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";

import {
  signupSchema,
  type SignupInput,
  otpSchema,
  type OtpInput,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import api from "@/lib/axios";

type Step = "info" | "address" | "otp" | "done";

const STEPS: Step[] = ["info", "address", "otp", "done"];
const STEP_LABELS = ["Account info", "Address", "Verify email", "Done"];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("info");
  const [loading, setLoading] = useState(false);
  const [signupData, setSignupData] = useState<SignupInput | null>(null);

  const signupForm = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
  });

  const otpForm = useForm<OtpInput>({
    resolver: zodResolver(otpSchema),
  });

  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex) / (STEPS.length - 1)) * 100;

  async function onInfoNext() {
    const valid = await signupForm.trigger(["nid", "email", "phone", "password", "confirmPassword", "name"]);
    if (valid) setStep("address");
  }

  async function onAddressSubmit() {
    const valid = await signupForm.trigger(["presentAddress", "permanentAddress"]);
    if (!valid) return;

    setLoading(true);
    const data = signupForm.getValues();
    try {
      await api.post("/api/v1/auth/signup", {
        nid: data.nid,
        email: data.email,
        phone: data.phone,
        password: data.password,
        name: data.name,
        presentAddress: data.presentAddress,
        permanentAddress: data.permanentAddress,
      });
      setSignupData(data);
      setStep("otp");
      toast.success("Verification code sent to your email");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Registration failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function onOtpSubmit(data: OtpInput) {
    if (!signupData) return;
    setLoading(true);
    try {
      await api.post("/api/v1/auth/verify-otp", {
        email: signupData.email,
        otp: data.otp,
      });
      setStep("done");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Invalid or expired code. Try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    if (!signupData) return;
    try {
      await api.post("/api/v1/auth/send-otp", { email: signupData.email });
      toast.success("New code sent");
    } catch {
      toast.error("Could not resend code. Please wait a moment.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl font-semibold tracking-tight">Create account</CardTitle>
          <CardDescription>{STEP_LABELS[stepIndex]}</CardDescription>
          <Progress value={progress} className="h-1" aria-label={`Step ${stepIndex + 1} of ${STEPS.length}`} />
        </CardHeader>

        <CardContent>
          {step === "info" && (
            <div className="space-y-4">
              <Field label="Full name" error={signupForm.formState.errors.name?.message}>
                <Input id="name" placeholder="Rahim Uddin" {...signupForm.register("name")} />
              </Field>
              <Field label="National ID (NID)" error={signupForm.formState.errors.nid?.message}>
                <Input id="nid" placeholder="10-digit NID" maxLength={10} {...signupForm.register("nid")} />
              </Field>
              <Field label="Email" error={signupForm.formState.errors.email?.message}>
                <Input id="email" type="email" placeholder="you@example.com" {...signupForm.register("email")} />
              </Field>
              <Field label="Phone" error={signupForm.formState.errors.phone?.message}>
                <Input id="phone" placeholder="01XXXXXXXXX" {...signupForm.register("phone")} />
              </Field>
              <Field label="Password" error={signupForm.formState.errors.password?.message}>
                <Input id="password" type="password" placeholder="••••••••" {...signupForm.register("password")} />
              </Field>
              <Field label="Confirm password" error={signupForm.formState.errors.confirmPassword?.message}>
                <Input id="confirmPassword" type="password" placeholder="••••••••" {...signupForm.register("confirmPassword")} />
              </Field>
              <Button className="w-full" onClick={onInfoNext}>Next</Button>
              <p className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
              </p>
            </div>
          )}

          {step === "address" && (
            <div className="space-y-4">
              <Field label="Present address" error={signupForm.formState.errors.presentAddress?.message}>
                <Input id="presentAddress" placeholder="House, Road, Area, City" {...signupForm.register("presentAddress")} />
              </Field>
              <Field label="Permanent address" error={signupForm.formState.errors.permanentAddress?.message}>
                <Input id="permanentAddress" placeholder="House, Road, Area, City" {...signupForm.register("permanentAddress")} />
              </Field>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep("info")}>Back</Button>
                <Button className="flex-1" onClick={onAddressSubmit} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create account
                </Button>
              </div>
            </div>
          )}

          {step === "otp" && (
            <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter the 6-digit code sent to <strong>{signupData?.email}</strong>
              </p>
              <Field label="Verification code" error={otpForm.formState.errors.otp?.message}>
                <Input
                  id="otp"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  className="text-center tracking-widest text-lg"
                  {...otpForm.register("otp")}
                />
              </Field>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify email
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

          {step === "done" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" aria-hidden="true" />
              <h3 className="text-lg font-semibold">Account created</h3>
              <p className="text-sm text-gray-600">
                Your email has been verified. You can now sign in.
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
