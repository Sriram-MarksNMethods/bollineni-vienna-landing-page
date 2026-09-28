import Image from "next/image";
import { useVilla } from "./Villa";
import StatsStrip from "./StatsStrip";

export default function About() {
  const villa = useVilla();
  const details = [
    { value: String(villa.acres), label: "Acres" },
    { value: String(villa.units), label: "Units" },
    { value: String(villa.bhkResidences), label: "BHK Residences" },
    { value: String(villa.floors), label: "Floors" },
  ];

  return (
    <section id="about" className="bg-beige">
      <div className="px-32 lg:max-xl:px-20 max-lg:px-20 max-md:px-10 max-sm:px-5">
        <div className="w-full pt-24 max-lg:pt-20 max-md:pt-14"></div>

        {/* Three columns: heading (sized to its three lines) | building photo
            (1500 x 1700) | about copy. Stacks in the same order below 992px. */}
        <div className="grid grid-cols-[auto_0.9fr_1fr] gap-[3vw] items-start max-lg:grid-cols-1 max-lg:gap-8">
          <h2 className="self-center max-lg:self-start -ml-[2vw] max-lg:ml-0 text-[3vw] max-lg:text-4xl max-md:text-3xl font-medium leading-[1.05] whitespace-nowrap">
            LOW-DENSITY GATED
            <br />
            COMMUNITY IN
            <br />
            BENGALURU
          </h2>
          <div className="relative w-full aspect-[15/17] overflow-hidden">
            <Image
              src="/images/hero.jpg"
              alt="Bollineni Vienna residential towers at dusk."
              title="Bollineni Vienna residential towers at dusk."
              fill
              loading="lazy"
              sizes="(max-width: 991px) 100vw, 30vw"
              className="object-cover"
            />
          </div>
          <div className="self-end max-lg:self-start flex flex-col gap-[1vw] max-lg:gap-4">
            <p className="text-base max-md:text-[0.95rem] leading-relaxed">
              Bollineni Vienna by Bollineni Group brings timeless elegance and contemporary luxury to one of North Bengaluru’s most sought-after locations. Designed for those who value exclusivity, this low-density gated community features refined architecture, expansive spaces, and world-class amenities.
            </p>
            <p className="text-base max-md:text-[0.95rem] leading-relaxed">
              Perfectly positioned for those seeking apartments near Kempegowda International Airport, Bollineni Vienna offers premium apartments in Yelahanka and thoughtfully designed bespoke residences Bengaluru homebuyers will appreciate. Each 4 BHK and 5 BHK residence is crafted to maximize natural light, ventilation, privacy, and effortless functionality.
            </p>
            <p className="text-base max-md:text-[0.95rem] leading-relaxed">
              Surrounded by lush landscapes, open greens, and curated lifestyle amenities, Bollineni Vienna offers luxury apartments in Kogilu and ultra luxury apartments in North Bengaluru, creating a serene retreat with seamless urban convenience. Discover distinguished flats for sale in Kogilu and experience elevated living in one of Bengaluru’s finest addresses.
            </p>
          </div>
        </div>
        <div className="w-full pt-24 max-lg:pt-20 max-md:pt-14"></div>

        {/* Figures in the brand gold (the logo colour). */}
        <StatsStrip stats={details} valueClassName="text-[#d9ad2b]" />

        <div className="w-full pt-24 max-lg:pt-20 max-md:pt-14"></div>
      </div>
    </section>
  );
}
