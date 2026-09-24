export default function Footer() {
  return (
    <footer className="bg-ink sticky bottom-0 max-lg:static">
      <div className="px-[3vw] max-lg:px-10 max-md:px-6 max-sm:px-4">
        <div className="pt-[2vw] max-lg:pt-16"></div>
        <div className="grid grid-cols-2 max-md:grid-cols-1 max-md:gap-8">
          <div className="grid grid-cols-2 max-lg:gap-14 max-md:gap-8 max-sm:grid-cols-1">
            <div className="flex flex-col gap-[0.75vw] max-lg:gap-4 max-md:gap-3">
              <div className="text-neutral-light">NAVIGATION</div>
              <div className="flex flex-col gap-[0.5vw] max-lg:gap-2 max-md:gap-[0.35rem]">
                <a href="/#about" className="w-fit inline-block max-w-full">
                  <p className="text-2xl max-lg:text-xl max-md:text-base text-white">About</p>
                </a>
                <a href="/#residences" className="w-fit inline-block max-w-full">
                  <p className="text-2xl max-lg:text-xl max-md:text-base text-white">Residences</p>
                </a>
                <a href="/#floor-plans" className="w-fit inline-block max-w-full">
                  <p className="text-2xl max-lg:text-xl max-md:text-base text-white">Floor Plans</p>
                </a>
                <a href="/#amenities" className="w-fit inline-block max-w-full">
                  <p className="text-2xl max-lg:text-xl max-md:text-base text-white">Amenities</p>
                </a>
                <a href="/#invest" className="w-fit inline-block max-w-full">
                  <p className="text-2xl max-lg:text-xl max-md:text-base text-white">Why Invest</p>
                </a>
                <a href="/#builder" className="w-fit inline-block max-w-full">
                  <p className="text-2xl max-lg:text-xl max-md:text-base text-white">About BSCPL</p>
                </a>                
                <a href="/#faq" className="w-fit inline-block max-w-full">
                  <p className="text-2xl max-lg:text-xl max-md:text-base text-white">FAQs</p>
                </a>
                <a href="/#book" className="w-fit inline-block max-w-full">
                  <p className="text-2xl max-lg:text-xl max-md:text-base text-white">Contact Us</p>
                </a>
              </div>
            </div>
            <div className="flex flex-col gap-[0.75vw] max-lg:gap-4 max-md:gap-3">
              <div className="text-neutral-light">CONTACT US</div>
              <div className="flex flex-col gap-[0.5vw] max-lg:gap-2 max-md:gap-[0.35rem]">
                <a href="tel:+918722000148" className="w-fit inline-block max-w-full">
                  <p className="text-2xl max-lg:text-xl max-md:text-base text-white">+91 87220 00148</p>
                </a>
                <a href="mailto:bscplre9@gmail.com" className="w-fit inline-block max-w-full">
                  <p className="text-2xl max-lg:text-xl max-md:text-base text-white">bscplre9@gmail.com</p>
                </a>
              </div>
            </div>
          </div>
          <div className="flex justify-end max-md:justify-start">
            <div className="flex gap-[1.5vw] w-fit h-fit mt-[0.25vw] max-lg:gap-4 max-lg:mt-1 max-md:gap-6 max-md:mt-0">
              <a
                href="https://www.instagram.com/bollinenigroup/"
                target="_blank"
                className="flex justify-center inline-block max-w-full"
              >
                <img
                  src="/images/icons/instagram.svg"
                  loading="lazy"
                  alt="Instagram"
                  title="Instagram"
                  className="size-8 max-lg:size-7 max-md:size-5"
                />
              </a>
              <a
                href="https://www.linkedin.com/company/bollineni/"
                target="_blank"
                className="flex justify-center inline-block max-w-full"
              >
                <img
                  src="/images/icons/linkedin.svg"
                  loading="lazy"
                  alt="LinkedIn"
                  title="LinkedIn"
                  className="size-8 max-lg:size-7 max-md:size-5"
                />
              </a>
            </div>
          </div>
        </div>
        <div className="pt-[3vw] max-lg:pt-20"></div>
        <div className="flex flex-col gap-[1vw] w-full h-full max-lg:gap-8 max-md:gap-4">
          <div className="flex justify-between mb-[1vw] max-lg:mb-6 max-md:flex-col max-md:items-start max-md:gap-3">
            <div className="flex items-center gap-[1.5vw] max-lg:gap-4 justify-end max-md:justify-start">
              <div className="text-white">© 2026 All rights reserved.</div>
              <a href="/privacy-policy" className="text-white underline underline-offset-2">
                Privacy Policy
              </a>
            </div>
            <div className="max-md:order-first">
              <div className="text-white">
                Designed for living - made to feel like home.
              </div>
            </div>
          </div>
        </div>
        <div className="pb-[1vw] max-lg:pb-8 max-md:pb-6"></div>
      </div>
    </footer>
  );
}
