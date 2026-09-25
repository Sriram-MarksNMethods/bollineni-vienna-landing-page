import Image from "next/image";
import Link from "next/link";
import StaggeredMenu from "./StaggeredMenu";

export default function Navbar() {
  return (
    <>
      <nav className="z-10 absolute inset-x-0 top-0">
        <div className="px-[3vw] max-lg:px-10 max-md:px-6 max-sm:px-4">
          <div className="py-[1.25vw] max-lg:py-4 flex justify-center">
            <Link href="/" aria-current="page" className="inline-block max-w-full">
              <div className="relative h-[6.5vw] aspect-[1920/1080] max-lg:h-24 max-md:h-20 max-sm:h-16">
                <Image
                  src="/images/bollineni_vienna.svg"
                  alt="Bollineni Vienna"
                  title="Bollineni Vienna"
                  fill
                  sizes="200px"
                  className="object-contain"
                />
              </div>
            </Link>
          </div>
        </div>
      </nav>
      <StaggeredMenu />
    </>
  );
}
