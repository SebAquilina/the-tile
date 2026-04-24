"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Checkbox,
  Input,
  Select,
  Textarea,
  useToast,
} from "@/components/ui";

/**
 * Contact form for the public /contact page.
 *
 * Uses react-hook-form + zod for client validation, then POSTs to the
 * existing /api/contact route (which expects `message`, not
 * `projectNotes`). Consent and a preferred-contact-method selector are
 * GDPR-friendly defaults for a Malta business.
 */

const FormSchema = z.object({
  name: z
    .string()
    .min(2, "Please share at least a first name.")
    .max(200, "Name is too long."),
  email: z
    .string()
    .min(1, "Email is required.")
    .email("That does not look like a valid email."),
  phone: z
    .string()
    .max(40, "Phone number is too long.")
    .optional()
    .or(z.literal("")),
  projectNotes: z
    .string()
    .min(1, "A short note about your project helps us prepare.")
    .max(4000, "That is a lot — please shorten to 4,000 characters."),
  preferredContactMethod: z.enum(["email", "phone", "whatsapp"]),
  consentGiven: z.literal(true, {
    errorMap: () => ({
      message: "We need your consent before we can reply.",
    }),
  }),
});

type FormValues = z.infer<typeof FormSchema>;

export function ContactForm() {
  // useSearchParams requires a Suspense boundary for client-side navigation.
  return (
    <Suspense fallback={null}>
      <ContactFormInner />
    </Suspense>
  );
}

function ContactFormInner() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saveListIds, setSaveListIds] = useState<string[]>([]);
  const quoteReason = searchParams.get("reason") === "quote";

  useEffect(() => {
    const raw = searchParams.get("saveIds");
    if (!raw) {
      setSaveListIds([]);
      return;
    }
    setSaveListIds(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      projectNotes: "",
      preferredContactMethod: "email",
      // consentGiven intentionally omitted so the checkbox starts unchecked
    },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          phone: values.phone ? values.phone : undefined,
          message: values.projectNotes,
          preferredContactMethod: values.preferredContactMethod,
          consentGiven: values.consentGiven,
          saveListIds: saveListIds.length > 0 ? saveListIds : undefined,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "request_failed");
      }

      toast.success(
        "We have your enquiry — we will be in touch within two working days.",
      );
      reset();
    } catch {
      setSubmitError(
        "Something went wrong sending your message. Please try again, or email us directly.",
      );
    }
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="mt-space-6 flex flex-col gap-space-5"
      aria-describedby={submitError ? "contact-form-error" : undefined}
    >
      {submitError ? (
        <div
          id="contact-form-error"
          role="alert"
          className="rounded-md border border-error bg-surface-muted px-space-4 py-space-3 text-sm text-error"
        >
          {submitError}
        </div>
      ) : null}

      {quoteReason && saveListIds.length > 0 ? (
        <div className="rounded-md border border-line bg-cream px-space-4 py-space-3 text-sm text-ink-muted">
          Attaching your shortlist of{" "}
          <span className="font-medium text-ink">{saveListIds.length}</span>{" "}
          {saveListIds.length === 1 ? "tile" : "tiles"} to this enquiry.
        </div>
      ) : null}

      <Input
        label="Your name"
        type="text"
        autoComplete="name"
        required
        {...register("name")}
        errorMessage={errors.name?.message}
      />

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        required
        {...register("email")}
        errorMessage={errors.email?.message}
      />

      <Input
        label="Phone (optional)"
        type="tel"
        autoComplete="tel"
        {...register("phone")}
        errorMessage={errors.phone?.message}
      />

      <Textarea
        label="Project notes"
        rows={6}
        required
        placeholder="briefly describe the room you are working on — size, mood, timeline"
        {...register("projectNotes")}
        errorMessage={errors.projectNotes?.message}
      />

      <Select
        label="Preferred contact method"
        {...register("preferredContactMethod")}
        errorMessage={errors.preferredContactMethod?.message}
      >
        <option value="email">Email</option>
        <option value="phone">Phone</option>
        <option value="whatsapp">WhatsApp</option>
      </Select>

      <Checkbox
        label={
          <span className="text-sm text-ink-muted">
            I agree to be contacted about my enquiry. See the{" "}
            <a
              href="/privacy"
              className="text-umber underline underline-offset-4 hover:text-umber-strong"
            >
              privacy notice
            </a>{" "}
            for how we handle your data.
          </span>
        }
        {...register("consentGiven")}
        errorMessage={errors.consentGiven?.message}
      />

      <div className="mt-space-2">
        <Button type="submit" variant="primary" loading={isSubmitting}>
          Send enquiry
        </Button>
      </div>
    </form>
  );
}
