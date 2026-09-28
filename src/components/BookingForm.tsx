import ContactForm from "./ContactForm";
import Doodle from "./Doodle";

// Laid out like the back of a postcard: heading, intro and a doodle (two
// buildings with trees) on the left, a dashed divider, and the form on the
// right.
export default function BookingForm() {
  return (
    <section id="book" className="bg-ink text-ink relative">
      <div className="px-32 lg:max-xl:px-20 max-lg:px-20 max-md:px-10 max-sm:px-5">
        <div className="w-full pt-24 max-lg:pt-20 max-md:pt-14"></div>

        <div className="mx-auto grid max-w-[72rem] grid-cols-2 rounded-2xl border border-ink/10 bg-beige shadow-[0_24px_60px_-30px_rgba(12,12,12,0.35)] max-lg:grid-cols-1">
          <div className="flex flex-col gap-[1vw] p-[3vw] max-lg:gap-3 max-lg:p-10 max-md:p-7">
            <h2 className="text-6xl lg:max-xl:text-5xl max-lg:text-5xl max-md:text-3xl font-medium leading-none uppercase">Contact Us</h2>
            <p className="text-base max-md:text-[0.95rem] text-ink/70">Fill out the form below.</p>
            <Doodle
              name="buildings"
              label=""
              className="mt-auto w-full max-w-[26rem] pt-[2vw] max-lg:mt-4 max-lg:max-w-[20rem] max-lg:pt-0 text-ink"
            />
          </div>

          <div className="border-l border-dashed border-ink/25 p-[3vw] max-lg:border-l-0 max-lg:border-t max-lg:p-10 max-md:p-7">
            <ContactForm idPrefix="book" />
          </div>
        </div>

        <div className="w-full pt-28 max-lg:pt-24 max-md:pt-16"></div>
      </div>
    </section>
  );
}
