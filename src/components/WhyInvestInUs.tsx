import Doodle from "./Doodle";

const reasons = [
  {
    doodle: "connectivity",
    title: "Strategic Connectivity",
    body: "Seamless access to Yelahanka, Hebbal, Bellary Road, Outer Ring Road, and Kempegowda International Airport makes Bollineni Vienna an ideal choice for apartments near Kempegowda International Airport.",
  },
  {
    doodle: "lifestyle",
    title: "Elevated Lifestyle",
    body: "Set in a low-density gated community, Bollineni Vienna offers premium apartments in Yelahanka, luxury apartments in Kogilu, and a peaceful environment surrounded by excellent social infrastructure.",
  },
  {
    doodle: "growth",
    title: "Strong Growth Potential",
    body: "With rapid infrastructure development, proximity to major employment hubs, and rising housing demand, flats for sale in Kogilu offer compelling potential, particularly across 4 BHK & 5 BHK apartments in Bengaluru and ultra-luxury apartments in North Bengaluru.",
  },
];

export default function WhyInvestInUs() {
  return (
    <section id="invest" className="bg-teal text-beige">
      <div className="px-32 lg:max-xl:px-20 max-lg:px-20 max-md:px-10 max-sm:px-5">
        <div className="w-full pt-24 max-lg:pt-20 max-md:pt-14"></div>

        <h2 className="text-5xl lg:max-xl:text-4xl max-lg:text-4xl max-md:text-2xl font-medium leading-none whitespace-nowrap lg:max-xl:whitespace-normal max-lg:whitespace-normal">
          {/* "BOLLINENI VIENNA?" never splits, so when the heading wraps it
              breaks as "WHY INVEST IN / BOLLINENI VIENNA?". */}
          WHY INVEST IN <span className="whitespace-nowrap">BOLLINENI VIENNA?</span>
        </h2>

        <div className="w-full pt-14 max-lg:pt-12 max-md:pt-10"></div>

        <div className="grid grid-cols-3 gap-[1.5vw] max-lg:grid-cols-1 max-lg:gap-5">
          {reasons.map((reason) => (
            <div
              key={reason.title}
              className="flex flex-col gap-[1.5vw] rounded-2xl border border-beige/15 bg-beige/[0.03] p-[2.25vw] max-lg:gap-5 max-lg:p-7 max-md:p-6 transition duration-300 hover:-translate-y-1.5 hover:border-beige/40 motion-reduce:hover:translate-y-0"
            >
              <Doodle name={reason.doodle} label={reason.title} className="w-full aspect-[4/3] max-lg:max-w-[22rem] max-lg:self-center text-beige" />
              <h3 className="font-heading text-[2.25vw] lg:max-xl:text-3xl max-lg:text-3xl max-md:text-[1.75rem] font-medium leading-[1.1]">
                {reason.title}
              </h3>
              <p className="text-base max-md:text-[0.95rem] leading-relaxed text-beige/70">{reason.body}</p>
            </div>
          ))}
        </div>

        <div className="w-full pt-24 max-lg:pt-20 max-md:pt-14"></div>
      </div>
    </section>
  );
}
