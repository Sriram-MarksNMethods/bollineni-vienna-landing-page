import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy - Bollineni Vienna",
  description: "Privacy Policy for Bollineni Vienna by Bollineni Group (BSCPL) — how we collect, use, and protect your information.",
  robots: {
    index: true,
    follow: true,
  },
};

const sections = [
  {
    heading: "Information We Collect",
    body: "When you enquire about Bollineni Vienna through this website — such as by filling out the contact form, requesting a brochure, or scheduling a site visit — we collect information you provide directly, including your name, phone number, email address, and any message or purpose of enquiry you share with us.",
  },
  {
    heading: "How We Use Your Information",
    body: "We use the information you provide to respond to your enquiry, share project details, brochures, and pricing, schedule site visits, and follow up on your interest in Bollineni Vienna. We do not use your information for any purpose unrelated to this engagement.",
  },
  {
    heading: "Sharing of Information",
    body: "Your information is shared only with the Bollineni Group (BSCPL) sales and marketing team responsible for following up on enquiries for this project. We do not sell, rent, or trade your personal information to third parties for their marketing purposes.",
  },
  {
    heading: "Cookies",
    body: "This website may use cookies and similar technologies to improve site performance and understand how visitors use the site. You can disable cookies through your browser settings, though some parts of the site may not function as intended if you do so.",
  },
  {
    heading: "Data Security",
    body: "We take reasonable technical and organizational measures to protect the information you share with us from unauthorized access, alteration, or disclosure. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security.",
  },
  {
    heading: "Data Retention",
    body: "We retain your enquiry information for as long as necessary to respond to your enquiry and for legitimate follow-up related to Bollineni Vienna, after which it is deleted or anonymized.",
  },
  {
    heading: "Your Rights",
    body: "You may request access to, correction of, or deletion of the personal information you have shared with us at any time by contacting us using the details below.",
  },
  {
    heading: "Changes to This Policy",
    body: "We may update this Privacy Policy from time to time to reflect changes in our practices. Any changes will be posted on this page.",
  },
  {
    heading: "Contact Us",
    body: "If you have any questions about this Privacy Policy or how your information is handled, please reach out to us through the contact form on this website.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="relative z-[2] max-lg:static bg-beige">
        <div className="px-32 lg:max-xl:px-20 max-lg:px-20 max-md:px-10 max-sm:px-5">
          <div className="w-full pt-40 max-lg:pt-32 max-md:pt-28"></div>

          <div className="max-w-[60vw] max-lg:max-w-[42rem] max-sm:max-w-full mx-auto pb-24 max-lg:pb-20 max-md:pb-14">
            <div className="text-center border-b border-neutral-lighter pb-8 max-lg:pb-6">
              <h1 className="text-6xl max-lg:text-5xl max-md:text-3xl font-medium leading-none text-ink">
                Privacy Policy
              </h1>
              <div className="w-full pt-4 max-lg:pt-3"></div>
              <p className="text-neutral-light text-sm uppercase tracking-[0.15em]">
                Last updated: September 2026
              </p>
            </div>

            <p className="text-lg max-lg:text-base text-ink italic leading-relaxed pt-10 max-lg:pt-8">
              Bollineni Group (BSCPL) ("we", "us", "our") respects your privacy. This Privacy
              Policy explains how we collect, use, and protect the information you share with us
              through this website for Bollineni Vienna.
            </p>

            <ol className="pt-10 max-lg:pt-8">
              {sections.map((section, index) => (
                <li
                  key={section.heading}
                  className={`grid grid-cols-[3rem_1fr] max-md:grid-cols-[2.25rem_1fr] gap-x-4 py-8 max-lg:py-6 ${
                    index !== 0 ? "border-t border-neutral-lighter" : ""
                  }`}
                >
                  <span className="font-heading text-3xl max-lg:text-2xl text-neutral-light leading-none">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex flex-col gap-[0.75vw] max-lg:gap-3">
                    <h2 className="text-2xl max-lg:text-xl font-medium text-ink leading-none">
                      {section.heading}
                    </h2>
                    <p className="text-lg max-lg:text-base text-ink leading-relaxed">{section.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
