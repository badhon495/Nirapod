"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useCreateComplaint } from "@/hooks/useComplaints";
import {
  complaintStep1Schema,
  complaintStep2Schema,
  complaintStep3Schema,
  type ComplaintStep1Input,
  type ComplaintStep2Input,
  type ComplaintStep3Input,
  type ComplaintInput,
} from "@/lib/validations";

const STEPS = ["Details", "Location", "Photos & Tags", "Review"] as const;

const CATEGORIES = [
  { value: "POLICE", label: "Police" },
  { value: "FIRE", label: "Fire Service" },
  { value: "CITY", label: "City Corporation" },
  { value: "ANIMAL", label: "Animal Welfare" },
] as const;

const URGENCIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
] as const;

const BANGLADESH_DISTRICTS = [
  "Dhaka", "Chittagong", "Sylhet", "Rajshahi", "Khulna",
  "Barisal", "Rangpur", "Mymensingh", "Comilla", "Narsingdi",
  "Gazipur", "Narayanganj", "Tangail", "Faridpur", "Jessore",
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600" role="alert">{message}</p>;
}

function Step1({ form }: { form: ReturnType<typeof useForm<ComplaintStep1Input>> }) {
  const { register, watch, setValue, formState: { errors } } = form;
  const category = watch("category");
  const urgency = watch("urgency");

  return (
    <div className="space-y-4">
      <div>
        <Label>Category <span aria-hidden="true" className="text-red-500">*</span></Label>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setValue("category", c.value, { shouldValidate: true })}
              aria-pressed={category === c.value}
              className={`rounded-md border p-3 text-sm font-medium text-left transition-colors duration-150 ${
                category === c.value
                  ? "border-foreground bg-foreground text-background"
                  : "border-input hover:bg-muted"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <FieldError message={errors.category?.message} />
      </div>

      <div>
        <Label>Urgency <span aria-hidden="true" className="text-red-500">*</span></Label>
        <div className="mt-1.5 flex gap-2">
          {URGENCIES.map((u) => (
            <button
              key={u.value}
              type="button"
              onClick={() => setValue("urgency", u.value, { shouldValidate: true })}
              aria-pressed={urgency === u.value}
              className={`flex-1 rounded-md border p-2 text-sm font-medium transition-colors duration-150 ${
                urgency === u.value
                  ? "border-foreground bg-foreground text-background"
                  : "border-input hover:bg-muted"
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>
        <FieldError message={errors.urgency?.message} />
      </div>

      <div>
        <Label htmlFor="title">Title <span aria-hidden="true" className="text-red-500">*</span></Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="Brief summary of the complaint"
          className="mt-1.5"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "title-error" : undefined}
        />
        <FieldError message={errors.title?.message} />
      </div>

      <div>
        <Label htmlFor="details">Details <span aria-hidden="true" className="text-red-500">*</span></Label>
        <textarea
          id="details"
          {...register("details")}
          placeholder="Describe what happened, when, and any other relevant information. Minimum 20 characters."
          rows={5}
          className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          aria-invalid={!!errors.details}
          aria-describedby={errors.details ? "details-error" : undefined}
        />
        <FieldError message={errors.details?.message} />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPublic"
          {...register("isPublic")}
          defaultChecked
          className="h-4 w-4 rounded border-input"
        />
        <Label htmlFor="isPublic" className="font-normal text-sm cursor-pointer">
          Make this complaint visible to the public
        </Label>
      </div>
    </div>
  );
}

function Step2({ form }: { form: ReturnType<typeof useForm<ComplaintStep2Input>> }) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="district">District <span aria-hidden="true" className="text-red-500">*</span></Label>
        <select
          id="district"
          {...register("district")}
          className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-invalid={!!errors.district}
        >
          <option value="">Select district</option>
          {BANGLADESH_DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <FieldError message={errors.district?.message} />
      </div>

      <div>
        <Label htmlFor="area">Area / Thana <span aria-hidden="true" className="text-red-500">*</span></Label>
        <Input
          id="area"
          {...register("area")}
          placeholder="e.g. Gulshan 2, Uttara Sector 7"
          className="mt-1.5"
          aria-invalid={!!errors.area}
        />
        <FieldError message={errors.area?.message} />
      </div>

      <div>
        <Label htmlFor="locationText">Location Description</Label>
        <Input
          id="locationText"
          {...register("locationText")}
          placeholder="e.g. Near X mosque, opposite Y school"
          className="mt-1.5"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        GPS coordinates can be captured automatically on mobile if you allow location access.
      </p>
    </div>
  );
}

function Step3({ form }: { form: ReturnType<typeof useForm<ComplaintStep3Input>> }) {
  const [tagInput, setTagInput] = useState("");
  const { watch, setValue } = form;
  const tags = watch("tags") ?? [];

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setValue("tags", [...tags, trimmed], { shouldValidate: true });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setValue("tags", tags.filter((t) => t !== tag), { shouldValidate: true });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Tags</Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          Add relevant tags to help categorize your complaint (up to 10).
        </p>
        <div className="mt-2 flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addTag(); }
            }}
            placeholder="Type a tag and press Enter"
            maxLength={100}
            className="flex-1"
          />
          <Button type="button" variant="outline" size="sm" onClick={addTag}>
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-sm bg-muted px-2 py-0.5 text-xs"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                  className="hover:text-destructive transition-colors duration-150"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label>Photos</Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          Photo uploads coming in Phase 3. You can add up to 5 photos after submission.
        </p>
        <div className="mt-2 rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Photo upload not yet available
        </div>
      </div>
    </div>
  );
}

function ReviewStep({
  step1,
  step2,
  step3,
}: {
  step1: ComplaintStep1Input;
  step2: ComplaintStep2Input;
  step3: ComplaintStep3Input;
}) {
  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-md border p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Category</span>
          <span className="font-medium">{step1.category}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Urgency</span>
          <span className="font-medium">{step1.urgency}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Visibility</span>
          <span className="font-medium">{step1.isPublic ? "Public" : "Private"}</span>
        </div>
      </div>
      <div className="rounded-md border p-4 space-y-2">
        <p className="font-medium">{step1.title}</p>
        <p className="text-muted-foreground text-xs leading-relaxed line-clamp-4">{step1.details}</p>
      </div>
      <div className="rounded-md border p-4 space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">District</span>
          <span>{step2.district}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Area</span>
          <span>{step2.area}</span>
        </div>
        {step2.locationText && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Location</span>
            <span>{step2.locationText}</span>
          </div>
        )}
      </div>
      {step3.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {step3.tags.map((t) => (
            <span key={t} className="rounded-sm bg-muted px-2 py-0.5 text-xs">{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export function CreateComplaintForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [step1Data, setStep1Data] = useState<ComplaintStep1Input | null>(null);
  const [step2Data, setStep2Data] = useState<ComplaintStep2Input | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { mutate: createComplaint, isPending } = useCreateComplaint();

  const form1 = useForm<ComplaintStep1Input>({
    resolver: zodResolver(complaintStep1Schema),
    defaultValues: { isPublic: true },
  });
  const form2 = useForm<ComplaintStep2Input>({
    resolver: zodResolver(complaintStep2Schema),
  });
  const form3 = useForm<ComplaintStep3Input>({
    resolver: zodResolver(complaintStep3Schema),
    defaultValues: { tags: [], photoPublicIds: [] },
  });

  const handleNext = async () => {
    if (step === 0) {
      const valid = await form1.trigger();
      if (!valid) return;
      setStep1Data(form1.getValues());
      setStep(1);
    } else if (step === 1) {
      const valid = await form2.trigger();
      if (!valid) return;
      setStep2Data(form2.getValues());
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleSubmit = () => {
    if (!step1Data || !step2Data) return;
    const step3Values = form3.getValues();

    createComplaint(
      {
        ...step1Data,
        ...step2Data,
        tags: step3Values.tags,
        photoPublicIds: step3Values.photoPublicIds,
      },
      {
        onSuccess: (data) => {
          setSubmitted(true);
          toast.success("Complaint submitted successfully.");
          setTimeout(() => router.push(`/complaint/${data.id}`), 1500);
        },
        onError: () => {
          toast.error("Failed to submit complaint. Please try again.");
        },
      }
    );
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border p-12 text-center">
        <CheckCircle2 size={48} className="text-green-600" aria-hidden="true" />
        <p className="font-medium">Complaint submitted!</p>
        <p className="text-sm text-muted-foreground">Redirecting to your complaint…</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Step {step + 1} of {STEPS.length}</span>
          <span>{STEPS[step]}</span>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-1.5" />
      </div>

      {step === 0 && <Step1 form={form1} />}
      {step === 1 && <Step2 form={form2} />}
      {step === 2 && <Step3 form={form3} />}
      {step === 3 && step1Data && step2Data && (
        <ReviewStep
          step1={step1Data}
          step2={step2Data}
          step3={form3.getValues()}
        />
      )}

      <div className="flex justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="gap-1"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back
        </Button>

        {step < 3 ? (
          <Button type="button" onClick={handleNext} className="gap-1">
            Next
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="gap-1"
          >
            {isPending ? "Submitting…" : "Submit complaint"}
          </Button>
        )}
      </div>
    </div>
  );
}
