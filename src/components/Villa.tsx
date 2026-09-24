export interface GalleryImage {
  id: string;
  name: string;
  src: string;
}

export interface Location {
  name: string;
}

export interface Villa {
  name: string;
  acres: number;
  units: number;
  bhkResidences: string;
  floors: string;
  summary: string;
  location: Location;
  gallery: GalleryImage[];
}

const horizon: Villa = {
  name: "Horizon",
  acres: 2.65,
  units: 90,
  bhkResidences: "4 & 5",
  floors: "G + 18",
  summary:
    "Discover expansive residences at Bollineni Vienna, thoughtfully designed for comfort, privacy, and timeless elegance. These spacious 4 BHK & 5 BHK apartments in Bengaluru combine natural light, refined finishes, and intelligent layouts to create truly bespoke residences Bengaluru homebuyers can aspire to. Set within a premium address, they redefine contemporary luxury living in North Bengaluru.",
  location: {
    name: "Kogilu, North Bengaluru",
  },
  gallery: [
    { id: "01", name: "Master Bedroom", src: "/images/gallery/gallery-01.jpg" },
    { id: "02", name: "Dining Room", src: "/images/gallery/gallery-02.jpg" },
    { id: "03", name: "Sunset Balcony", src: "/images/gallery/gallery-03.jpg" },
    { id: "04", name: "Swimming Pool", src: "/images/gallery/gallery-04.jpg" },
    { id: "05", name: "The Canopy Court", src: "/images/gallery/gallery-05.jpg" },
    { id: "06", name: "Badminton Court", src: "/images/gallery/gallery-06.jpg" },
    { id: "07", name: "Children's Play Area", src: "/images/gallery/gallery-07.jpg" },
    { id: "08", name: "The Social Sanctuary", src: "/images/gallery/gallery-08.jpg" },
    { id: "09", name: "Sports Facilities", src: "/images/gallery/gallery-09.jpg" },
  ],
};

export function useVilla(): Villa {
  return horizon;
}
