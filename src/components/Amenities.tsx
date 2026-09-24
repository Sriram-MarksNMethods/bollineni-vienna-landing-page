import Button from "./Button";
import AmenityIcon from "./AmenityIcon";

const amenities = [
  { icon: "swimming-pool", name: "Swimming Pool", text: "for unhurried relaxation." },
  { icon: "park", name: "Open-Air Seating", text: "for relaxed moments." },
  { icon: "racquet", name: "Double Badminton Court", text: "for active leisure." },
  { icon: "elevator", name: "Personal Elevators", text: "for added privacy." },
  { icon: "flower-lotus", name: "Meditation Deck", text: "for moments of stillness." },
  { icon: "person-simple-run", name: "Jogging Track", text: "for invigorating mornings." },
  { icon: "barbell", name: "Gym", text: "for everyday fitness." },
  { icon: "tennis-ball", name: "Lawn Tennis / Pickle Ball", text: "for active play." },
];

// border sides each grid item shows, matching the reference's grid-line layout
const itemBorders = [
  "border-r-[0.1vw] border-b-[0.1vw] max-lg:border-r max-lg:border-b",
  "border-r-[0.1vw] border-b-[0.1vw] max-lg:border-b max-lg:border-r-0",
  "border-r-[0.1vw] border-b-[0.1vw] max-lg:border-r max-lg:border-b",
  "border-b-[0.1vw] max-lg:border-b",
  "border-r-[0.1vw] max-lg:border-r max-lg:border-b",
  "border-r-[0.1vw] max-lg:border-b max-lg:border-r-0",
  "border-r-[0.1vw] max-lg:border-r",
  "",
];

export default function Amenities() {
  return (
    <section id="amenities" className="bg-ink">
      <div className="px-32 lg:max-xl:px-20 max-lg:px-20 max-md:px-10 max-sm:px-5">
        <div className="w-full pt-14 max-lg:pt-12 max-md:pt-10"></div>
        <div className="flex flex-col items-center gap-[2vw] max-lg:gap-6">
          <h2 className="text-6xl lg:max-xl:text-5xl max-lg:text-5xl max-md:text-3xl font-medium leading-none text-white">AMENITIES</h2>
          <p className="text-xl max-lg:text-lg max-md:text-base text-center max-lg:text-justify text-white lg:max-xl:max-w-[42rem] max-lg:max-w-[38rem] max-md:max-w-[28rem] max-sm:max-w-[90vw]">
            Designed for exclusivity and refined living, Bollineni Vienna by Bollineni Group offers curated amenities spanning luxury, wellness, recreation, and convenience. As a low-density gated community, it creates a vibrant lifestyle experience for those seeking premium apartments in Yelahanka and ultra luxury apartments in North Bengaluru.
          </p>
        </div>
        <div className="w-full pt-14 max-lg:pt-12 max-md:pt-10"></div>
        <div className="grid grid-cols-4 max-lg:grid-cols-2">
          {amenities.map((amenity, index) => (
            <div
              key={amenity.icon}
              className={`border-white flex flex-col items-center gap-[2vw] py-[4vw] px-[1vw] lg:max-xl:gap-8 lg:max-xl:py-14 lg:max-xl:px-3 max-lg:gap-8 max-lg:py-20 max-lg:px-4 max-md:gap-6 max-md:py-16 ${itemBorders[index]}`}
            >
              <AmenityIcon
                name={amenity.icon}
                label={`${amenity.name} ${amenity.text}`}
                index={index}
                className="size-12 lg:max-xl:size-10 max-lg:size-10 max-md:size-8"
              />
              <div className="text-2xl lg:max-xl:text-xl max-lg:text-xl max-md:text-base text-center text-white w-[85%] max-lg:w-full">
                <strong className="font-bold">{amenity.name}</strong> {amenity.text}
              </div>
            </div>
          ))}
        </div>
        <div className="w-full pt-14 max-lg:pt-12 max-md:pt-10"></div>
        <div className="w-full pt-24 max-lg:pt-20 max-md:pt-14"></div>
      </div>
    </section>
  );
}
