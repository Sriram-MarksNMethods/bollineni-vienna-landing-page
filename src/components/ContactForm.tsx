"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import Button from "./Button";

const inputClass =
  "block w-full bg-beige border border-[#ccc] rounded-[0.75vw] max-lg:rounded-lg min-h-[3.5vw] max-lg:min-h-12 max-md:min-h-11 mb-[0.5vw] max-lg:mb-3 py-[1vw] px-[1.25vw] max-lg:py-2 max-lg:px-4 text-[#333] text-sm placeholder:text-[#999] focus:border-[#3898ec] focus:outline-none";

const purposeOptions = [
  { value: "general-enquiry", label: "General Enquiry" },
  { value: "download-brochure", label: "Download Brochure" },
  { value: "site-visit", label: "Site Visit" },
];

type Status = "idle" | "submitting" | "error";

// Used twice on the home page (Contact section + Enquire Now popup), so every
// element id is prefixed to keep ids unique when both are in the DOM.
export default function ContactForm({ idPrefix }: { idPrefix: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dialCode, setDialCode] = useState("91");
  const [email, setEmail] = useState("");
  const [purpose, setPurpose] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: `+${dialCode}${phone}`, email, purpose, message }),
      });

      if (!res.ok) throw new Error("Submission failed");

      router.push("/thank-you");
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      <form
        id={`${idPrefix}-contact-form`}
        onSubmit={handleSubmit}
        className="flex flex-col overflow-hidden gap-[1.5vw] max-lg:gap-5 max-md:gap-4"
      >
        <div className="grid grid-cols-2 gap-[1.5vw] max-lg:gap-x-6 max-lg:gap-y-3 max-md:gap-y-2">
          <div className="col-span-2">
            <input
              className={inputClass}
              maxLength={256}
              name="Full-Name"
              placeholder="Full Name"
              type="text"
              id={`${idPrefix}-Full-Name`}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="max-md:col-span-2">
            <div className="contact-phone-input relative">
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
                }}
                containerClass="w-full"
                specialLabel=""
                placeholder="Phone Number"
              />
              <span className="contact-phone-dialcode">+{dialCode}</span>
              <span className="contact-phone-divider" aria-hidden="true" />
            </div>
          </div>
          <div className="max-md:col-span-2">
            <input
              className={inputClass}
              maxLength={256}
              name="Email"
              placeholder="Email"
              type="email"
              id={`${idPrefix}-Email`}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <select
              id={`${idPrefix}-Purpose`}
              name="Purpose"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className={`${inputClass} appearance-none bg-[url('/images/icons/caret-down-select.svg')] bg-no-repeat bg-[position:95%] bg-[length:1.25vw_1.25vw] max-lg:bg-[length:1.25rem_1.25rem]`}
            >
              <option value="" disabled>
                Purpose of Enquiry
              </option>
              {purposeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <textarea
              className={`${inputClass} min-h-[8vw] max-lg:min-h-32 resize-none`}
              maxLength={2000}
              name="Message"
              placeholder="Message"
              id={`${idPrefix}-Message`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full overflow-hidden">
          <div className="grid grid-cols-1 w-full">
            <Button
              type="submit"
              variant="form-submit"
              text={status === "submitting" ? "Submitting..." : "Submit"}
              disabled={status === "submitting"}
            />
          </div>
        </div>
      </form>
      {status === "error" && (
        <div className="bg-[#f8e4e4] text-[#3b0b0b] mt-[1vw] max-lg:mt-4 p-3 text-center">
          <div>Oops! Something went wrong while submitting the form.</div>
        </div>
      )}
    </>
  );
}
