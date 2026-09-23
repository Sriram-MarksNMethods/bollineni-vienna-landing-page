import Button from "./Button";

const reasonBorders = [
  "border-r-[0.1vw] border-black max-lg:border-r-0 max-lg:border-b-[0.1vw]",
  "border-r-[0.1vw] border-black max-lg:border-r-0 max-lg:border-b-[0.1vw]",
  "",
];

const reasons = [
  {
    title: "Strategic Connectivity",
    body: "Seamless access to Yelahanka, Hebbal, Bellary Road, Outer Ring Road, and Kempegowda International Airport makes Bollineni Vienna an ideal choice for apartments near Kempegowda International Airport.",
  },
  {
    title: "Elevated Lifestyle",
    body: "Set in a low-density gated community, Bollineni Vienna offers premium apartments in Yelahanka, luxury apartments in Kogilu, and a peaceful environment surrounded by excellent social infrastructure.",
  },
  {
    title: "Strong Growth Potential",
    body: "With rapid infrastructure development, proximity to major employment hubs, and rising housing demand, flats for sale in Kogilu offer compelling potential, particularly across 4 BHK & 5 BHK apartments in Bengaluru and ultra luxury apartments in North Bengaluru.",
  },
];

export default function WhyInvestInUs() {
  return (
    <section id="invest" className="bg-khaki">
      <div className="px-32 lg:max-xl:px-20 max-lg:px-20 max-md:px-10 max-sm:px-5">
        <div className="w-full pt-24 max-lg:pt-20 max-md:pt-14"></div>

        <div className="flex flex-col items-center text-center">
          <h2 className="text-5xl lg:max-xl:text-4xl max-lg:text-4xl max-md:text-2xl font-medium leading-none whitespace-nowrap lg:max-xl:whitespace-normal max-lg:whitespace-normal">WHY INVEST IN BOLLINENI VIENNA?</h2>
        </div>
        <div className="w-full pt-14 max-lg:pt-12 max-md:pt-10"></div>

        <div className="border-[0.1vw] border-black rounded-[1.5vw] grid grid-cols-3 items-stretch max-lg:grid-cols-1 max-lg:rounded-2xl">
          {reasons.map((reason, index) => (
            <div
              key={reason.title}
              className={`flex flex-col items-start text-left gap-[1vw] py-[2.5vw] px-[2vw] lg:max-xl:gap-4 lg:max-xl:py-8 lg:max-xl:px-6 max-lg:gap-4 max-lg:py-8 max-lg:px-6 ${reasonBorders[index]}`}
            >
              <div className="flex items-center justify-center w-[2.5vw] h-[2.5vw] lg:max-xl:w-10 lg:max-xl:h-10 max-lg:w-10 max-lg:h-10 rounded-full border-[0.1vw] border-black">
                <span className="text-base max-lg:text-sm">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="text-2xl lg:max-xl:text-xl max-lg:text-xl max-md:text-lg font-medium">
                {reason.title}
              </div>
              <div className="text-lg lg:max-xl:text-base max-lg:text-base max-md:text-sm text-justify w-full">
                {reason.body}
              </div>
            </div>
          ))}
        </div>
        <div className="w-full pt-14 max-lg:pt-12 max-md:pt-10"></div>
        <div className="flex justify-center">
          <Button
            href="/Bollineni_Brochure.pdf"
            download
            variant="primary"
            text="Download Brochure"
          />
        </div>

        <div className="w-full pt-24 max-lg:pt-20 max-md:pt-14"></div>
      </div>
    </section>
  );
}
