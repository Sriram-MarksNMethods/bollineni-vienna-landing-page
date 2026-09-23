import type { Metadata } from "next";
import Image from "next/image";
import Button from "@/components/Button";

export const metadata: Metadata = {
  title: "Thank You - Bollineni Vienna",
  description: "Thank you for your enquiry about Bollineni Vienna. Our team will be in touch shortly.",
};

export default function ThankYouPage() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center px-10 text-center">
      <Image
        src="/images/gallery/gallery-04.jpg"
        alt="Swimming pool at Bollineni Vienna surrounded by landscaped greens."
        title="Swimming pool at Bollineni Vienna surrounded by landscaped greens."
        fill
        preload
        loading="eager"
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/45"></div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative h-[6.5vw] aspect-[1920/1080] max-lg:h-24 max-md:h-20 max-sm:h-16 brightness-0 invert">
          <Image
            src="/images/bollineni_vienna.svg"
            preload
            loading="eager"
            alt="Bollineni Vienna"
            title="Bollineni Vienna"
            fill
            sizes="200px"
            className="object-contain"
          />
        </div>
        <div className="w-full pt-14 max-lg:pt-10 max-md:pt-8"></div>
        <h1 className="text-6xl max-lg:text-5xl max-md:text-3xl font-medium leading-none text-white">Thank You</h1>
        <div className="w-full pt-8 max-lg:pt-6 max-md:pt-5"></div>
        <p className="text-xl max-lg:text-lg max-md:text-base max-w-[38rem] max-sm:max-w-[90vw] text-white">
          Your enquiry has been received. Our team will get in touch with you shortly.
        </p>
        <div className="w-full pt-14 max-lg:pt-10 max-md:pt-8"></div>
        <div className="flex items-center gap-[1vw] max-lg:gap-4">
          <Button href="/" text="Back to Home" variant="primary" />
          <Button
            href="/Bollineni_Brochure.pdf"
            download
            text="Download Brochure"
            variant="secondary"
          />
        </div>
      </div>
    </section>
  );
}
