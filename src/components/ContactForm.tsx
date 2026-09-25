"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

// One rounded box per field; the label sits inside it and shrinks to the top
// once the field is focused or filled (inputs use placeholder=" " so
// :placeholder-shown means "empty").
const boxClass =
  "relative rounded-xl border border-ink/15 bg-white/70 transition-colors focus-within:border-ink";
const inputClass =
  "peer block w-full h-16 px-5 pt-6 pb-1.5 bg-transparent text-base text-ink outline-none placeholder:text-transparent";
const labelClass =
  "pointer-events-none absolute left-5 top-8 -translate-y-1/2 text-base text-ink/50 transition-all duration-150 peer-focus:top-4 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-4 peer-[:not(:placeholder-shown)]:text-xs";

// The form only asks for name, phone and email; /api/contact still expects a
// purpose, so every enquiry is sent as a general enquiry.
const PURPOSE = "general-enquiry";

type Status = "idle" | "submitting" | "error";

// Used twice on the home page (Contact section + Enquire Now popup), so every
// element id is prefixed to keep ids unique when both are in the DOM.
export default function ContactForm({ idPrefix }: { idPrefix: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dialCode, setDialCode] = useState("91");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: `+${dialCode}${phone}`, email, purpose: PURPOSE }),
      });

      if (!res.ok) throw new Error("Submission failed");

      router.push("/thank-you");
    } catch {
      setStatus("error");
    }
  };

  return (
    <form id={`${idPrefix}-contact-form`} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className={boxClass}>
        <input
          className={inputClass}
          maxLength={256}
          name="Full-Name"
          placeholder=" "
          type="text"
          id={`${idPrefix}-Full-Name`}
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label htmlFor={`${idPrefix}-Full-Name`} className={labelClass}>
          Full name
        </label>
      </div>

      <div className={`${boxClass} contact-phone-input`}>
        <PhoneInput
          country={"in"}
          value={phone}
          onChange={(value, data) => {
            setPhone(value);
            setDialCode((data as CountryData).dialCode);
          }}
          onMount={(value, data) => {
            setDialCode((data as CountryData).dialCode);
          }}
          enableSearch
          disableCountryCode
          disableCountryGuess
          inputProps={{
            name: "Phone",
            id: `${idPrefix}-Phone`,
            required: true,
            autoComplete: "tel-national",
          }}
          containerClass="w-full"
          specialLabel=""
          placeholder=""
        />
        {/* The phone field always has the flag + code in it, so its label
            stays in the small "filled" position. */}
        <label htmlFor={`${idPrefix}-Phone`} className="pointer-events-none absolute left-5 top-4 -translate-y-1/2 text-xs text-ink/50">
          Phone
        </label>
        <span className="contact-phone-dialcode">+{dialCode}</span>
        <span className="contact-phone-divider" aria-hidden="true" />
      </div>
      <div className={boxClass}>
        <input
          className={inputClass}
          maxLength={256}
          name="Email"
          placeholder=" "
          type="email"
          id={`${idPrefix}-Email`}
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor={`${idPrefix}-Email`} className={labelClass}>
          Email
        </label>
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="h-16 w-full cursor-pointer rounded-xl bg-ink text-base font-medium tracking-wide text-beige transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "submitting" ? "Submitting..." : "Submit"}
      </button>

      {status === "error" && (
        <div role="alert" className="rounded-xl bg-[#f8e4e4] p-3 text-center text-sm text-[#3b0b0b]">
          Oops! Something went wrong while submitting the form.
        </div>
      )}

      <p className="text-center text-xs text-ink/60">
        By submitting, you agree to our{" "}
        <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-ink">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}
