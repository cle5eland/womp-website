/** Client-safe site copy and URLs — no Node APIs. */

export type PressShot = { src: string; alt: string };

export const pressKitDriveUrl =
  "https://drive.google.com/drive/folders/1zPmbzQlKLbTiZ1GcNuXYJxxsIQOAZWs2?usp=sharing";

/** Additional / full-length video files (download or preview in Drive). */
export const videosDriveFolderUrl =
  "https://drive.google.com/drive/folders/1MDOdZGdYdcwU270h44fWpakPtYaGbPj0?usp=sharing";

export const bookingEmail = "booking@djwomp.com";

export const navItems = [
  { label: "Stats", href: "#stats" },
  { label: "Release", href: "#release" },
  { label: "Shows", href: "#shows" },
  { label: "Listen", href: "#listen" },
  { label: "Bio", href: "#bio" },
  { label: "Press", href: "#press" },
  { label: "Video", href: "#video" },
  { label: "List", href: "#mailing" },
] as const;

/** Local hero (also overridable with `NEXT_PUBLIC_HERO_IMAGE_URL`). */
const defaultHeroImage = "/assets/hero.jpg";

const envHeroUrl =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_HERO_IMAGE_URL?.trim() || ""
    : "";

export const heroImage = envHeroUrl || defaultHeroImage;

/** Google Drive and similar hosts block Next’s optimizer fetch. */
export const heroImageUnoptimized =
  heroImage.includes("drive.google.com") ||
  heroImage.includes("googleusercontent.com");

/** White wordmark from djwomp.com (Wix CDN). */
export const logoImage =
  "https://static.wixstatic.com/media/07688b_f734b451dfcb4a0e872d14265ea54f52~mv2.png/v1/fit/w_560,h_184,al_c,q_92,enc_avif,quality_auto/07688b_f734b451dfcb4a0e872d14265ea54f52~mv2.png";

export const galleryImages = [
  {
    src: "https://static.wixstatic.com/media/5a690c_22f0aa36686b4097a7d629a9d62d9bee~mv2.jpeg/v1/fit/w_960,h_642,q_90,enc_avif,quality_auto/5a690c_22f0aa36686b4097a7d629a9d62d9bee~mv2.jpeg",
    alt: "Live — octopus garage energy",
    width: 960,
    height: 642,
  },
  {
    src: "https://static.wixstatic.com/media/5a690c_100325cb8a004d689d5cfc535b1bba20~mv2.jpg/v1/fit/w_960,h_641,q_90,enc_avif,quality_auto/5a690c_100325cb8a004d689d5cfc535b1bba20~mv2.jpg",
    alt: "Live — crowd side",
    width: 960,
    height: 641,
  },
] as const;

export function fallbackPressShots(): PressShot[] {
  return galleryImages.map((img) => ({ src: img.src, alt: img.alt }));
}

export const latestRelease = {
  title: "Latest on DSPs",
  subtitle: "Read My Lips · Smoke — add embed URI when you pick a lead single",
  description:
    "Spotlight your lead track or EP here. Swap `spotifyEmbedSrc` for a track, album, or episode URL from Spotify’s share dialog.",
  spotifyEmbedSrc:
    "https://open.spotify.com/embed/artist/64XV9aZxwoLuxf9tgvu9Pb?utm_source=generator&theme=0",
  spotifyUrl:
    "https://open.spotify.com/artist/64XV9aZxwoLuxf9tgvu9Pb?si=5fb3981b813a4035",
} as const;

export const spotifyArtistEmbedSrc =
  "https://open.spotify.com/embed/artist/64XV9aZxwoLuxf9tgvu9Pb?utm_source=generator&theme=0";

/** SoundCloud profile permalink — used for live-stat fetching + deep links. */
export const soundcloudPermalink = "wompbass";
export const soundcloudProfileUrl = `https://soundcloud.com/${soundcloudPermalink}`;

export const soundcloudEmbedSrc = `https://w.soundcloud.com/player/?url=${encodeURIComponent(
  `https://api.soundcloud.com/resolve?url=${soundcloudProfileUrl}`,
)}&color=%23080808&inverse=true&auto_play=false&show_user=true`;

/** Instagram profile handle — used for the deep link + the stats panel header. */
export const instagramPermalink = "wompbass";
export const instagramProfileUrl = `https://www.instagram.com/${instagramPermalink}/`;

export const socialLinks = [
  {
    label: "Spotify",
    href: "https://open.spotify.com/artist/64XV9aZxwoLuxf9tgvu9Pb?si=5fb3981b813a4035",
  },
  {
    label: "SoundCloud",
    href: soundcloudProfileUrl,
  },
  { label: "Instagram", href: instagramProfileUrl },
  { label: "YouTube", href: "https://www.youtube.com/@djwomp" },
  { label: "Site", href: "https://www.djwomp.com/" },
] as const;

export const upcomingShows = [
  {
    date: "May 22, 2026",
    city: "Brooklyn, NY",
    venue: "The Meadows · w/ SoDown",
    note: "On The Air Tour stop in Brooklyn.",
  },
  {
    date: "Aug 6–9, 2026",
    city: "Evansburg, AB",
    venue: "Friendzy Fest · Rangeton Park",
    note: "Three-stage bass music festival on the Pembina River, 18+.",
  },
  {
    date: "Aug 28–30, 2026",
    city: "Union, WV",
    venue: "Mountain Wubz · Nightfall Ridge",
    note: "Southern West Virginia's bass-leaning EDM festival.",
  },
] as const;

export const videos = [
  {
    title: "womp — Live @ Delirium Studios",
    url: "https://www.youtube.com/embed/cYpXqDBsaho",
    duration: "35:52",
  },
  {
    title: "Filthy Dubstep Mix | Brooklyn Studio Sessions",
    url: "https://www.youtube.com/embed/XKHu_UzTXyc",
    duration: "35:05",
  },
] as const;

export const bioDraft = {
  /** Headline paragraph — rendered with the accent left-rule. */
  lead:
    "Every journey has a beginning, but this one starts in a sweaty, space-octopus-painted garage. Five twenty-somethings on the wrong side of a year of social distancing flail to a clipped 808. In the distance, sirens.",
  /** Body paragraphs — rendered as regular long-form copy. */
  body: [
    "This might be an atypical origin story, but for Quin Thompson — aka womp — these were atypical times. His recently discovered taste for west coast bass was cut short by a global pandemic, and the Asheville, North Carolina native found himself on the other side of the country, bumping Griz and Subtronics on first-gen Airpods, and missing home.",
    "Hence, octopus garage. Two Amazon par lights, a fog machine, and a woefully underpowered 10-inch PA later, womp had his first gig and, more importantly, his first fans. Endless energy on \u201Cstage\u201D complemented a yee-haw approach to performance, and eventually the one-car garage wouldn\u2019t cut it anymore.",
    "Since then, womp has grown from garage raves into a rising force in the dubstep scene. Through steady releases, including his first single on SubCarbon Records (Ganja White Night\u2019s label), he\u2019s racked up almost half a million streams on his music. Along the way, he\u2019s shared the stage with Jkyl & Hyde, TVBOO, Chef Boyarbeatz, Shanghai Doom, Pierce, SubDocta, Stylust, and others, and built up a sonic profile heavily influenced by LYNY, Peekaboo, and Xotix.",
    "But even though the venue, the speakers, and the crowd have grown, that garage is still at the center of everything \u2014 and womp seeks to replicate that simple, yet so human experience every time he gets on stage.",
  ],
} as const;
