import ContactForm from "./ContactForm";

export default function BookingForm() {
  return (
    <section id="book" className="bg-khaki relative">
      <div className="px-32 lg:max-xl:px-20 max-lg:px-20 max-md:px-10 max-sm:px-5">
        <div className="w-full pt-24 max-lg:pt-20 max-md:pt-14"></div>
        <div className="flex flex-col items-center gap-[0.75vw] max-lg:gap-2">
          <h2 className="text-6xl max-lg:text-5xl max-md:text-3xl font-medium leading-none">Contact Us</h2>
          <p className="text-center w-[30vw] max-lg:w-[30rem] max-sm:w-[75vw]">
            Fill out the form below.
          </p>
        </div>
        <div className="w-full pt-14 max-lg:pt-12 max-md:pt-10"></div>
        <div className="flex justify-center">
          <div className="w-full max-w-[36rem]">
            <ContactForm idPrefix="book" />
          </div>
        </div>
        <div className="w-full pt-28 max-lg:pt-24 max-md:pt-16"></div>
      </div>
    </section>
  );
}
