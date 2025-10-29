import fs from "node:fs";
import path from "node:path";

export const navItems = [
  { label: "About", href: "#about" },
  { label: "Music", href: "#music" },
  { label: "Live", href: "#live" },
  { label: "Press", href: "#press" },
  { label: "Contact", href: "#contact" },
  { label: "Past Shows", href: "#shows" },
];

export const heroImage =
  "https://static.wixstatic.com/media/07688b_caf4bc71659d4e2099f53273f57bed66~mv2.jpg/v1/fit/w_960,h_668,q_90,enc_avif,quality_auto/07688b_caf4bc71659d4e2099f53273f57bed66~mv2.jpg";

export const galleryImages = [
  {
    src: "https://static.wixstatic.com/media/5a690c_22f0aa36686b4097a7d629a9d62d9bee~mv2.jpeg/v1/fit/w_960,h_642,q_90,enc_avif,quality_auto/5a690c_22f0aa36686b4097a7d629a9d62d9bee~mv2.jpeg",
    alt: "Octopus Garage - Left",
    width: 960,
    height: 642,
  },
  {
    src: "https://static.wixstatic.com/media/5a690c_100325cb8a004d689d5cfc535b1bba20~mv2.jpg/v1/fit/w_960,h_641,q_90,enc_avif,quality_auto/5a690c_100325cb8a004d689d5cfc535b1bba20~mv2.jpg",
    alt: "Octopus Garage - Right",
    width: 960,
    height: 641,
  },
];

const galleryDirectory = path.join(process.cwd(), "public/assets/gallery");

const pressShotFiles = fs.existsSync(galleryDirectory)
  ? fs
      .readdirSync(galleryDirectory)
      .filter((file) => /\.(png|jpe?g)$/i.test(file))
  : [];

const formatPressShotAlt = (fileName: string) => {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, "");
  return `Press shot - ${withoutExtension.replace(/[-_]+/g, " ")}`;
};

export const pressShots = pressShotFiles.map((file) => ({
  src: `/assets/gallery/${file}`,
  alt: formatPressShotAlt(file),
}));

export const videos = [
  {
    title: "womp - Live @ Delirium Studios",
    url: "https://www.youtube.com/embed/cYpXqDBsaho",
    duration: "35:52",
  },
  {
    title: "Filthy Dubstep Mix | womp @ Brooklyn Studio Sessions May 5, 2025",
    url: "https://www.youtube.com/embed/XKHu_UzTXyc",
    duration: "35:05",
  },
];

export const socialLinks = [
  {
    label: "Spotify",
    href: "https://open.spotify.com/artist/64XV9aZxwoLuxf9tgvu9Pb?si=siQO86RCQBqQJ6EOjboM3w",
  },
  { label: "Instagram", href: "https://www.instagram.com/dj_womp" },
  { label: "YouTube", href: "https://www.youtube.com/@djwomp" },
];

export const pastShows = [
  {
    date: "Jun 01, 2024 - 10:00 PM to Jun 02, 2024 - 2:30 AM",
    title: "Liminal Bass x DISTORT",
    venue: "FirstLive, 219 Central Ave, Brooklyn, NY 11221, USA",
    blurb: "4 heads are better than 2.",
  },
  {
    date: "Nov 11, 2023 - 9:00 PM to Nov 12, 2023 - 1:30 AM",
    title: "Liminal Bass Boiler Room",
    venue: "FirstLive, 219 Central Ave, Brooklyn, NY 11221, USA",
    blurb: "High-voltage energy all night long.",
  },
  {
    date: "Sep 30, 2023 - 2:30 PM",
    title: "Liminal Bass",
    venue: "Brooklyn, Brooklyn, NY, USA",
    blurb: "We are BACK on September 30th!!",
  },
  {
    date: "Aug 05, 2023 - 3:00 PM to 8:00 PM",
    title: "Liminal Messages 2",
    venue: "East River Bar - Williamsburg, 97 S 6th St, Brooklyn, NY 11211, USA",
    blurb: "2 Fast 2 Liminal",
  },
  {
    date: "Apr 28, 2023 - 10:00 PM",
    title: "Liminal Wonderland",
    venue: "Brooklyn, 270 Meserole St, Brooklyn, NY 11206, USA",
    blurb: 'Text "BASS" to +1 (855) 929-5156 for discounted tickets.',
  },
  {
    date: "Feb 11, 2023 - 10:00 PM to Feb 12, 2023 - 2:30 AM",
    title: "Liminal Messages",
    venue: "Eris Evolution, 167 Graham Ave, Brooklyn, NY 11206, USA",
    blurb:
      "Bass, house, bass house, and a basement dance floor to ruin your Sunday morning. All are welcome.",
  },
  {
    date: "Nov 11, 2022 - 11:00 PM to Nov 12, 2022 - 4:00 PM",
    title: "The Queens Ball",
    venue: "Liminal Space, 1080 Wyckoff Ave, Ridgewood, NY 11385, USA",
    blurb:
      "A night of dancing, friendship, and heart-stopping bass. Coming soon to a dingy warehouse near(ish) you.",
  },
];
