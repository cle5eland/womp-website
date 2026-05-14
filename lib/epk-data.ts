/** Client-safe site copy and URLs — no Node APIs. */

export type PressShot = { src: string; alt: string };

export const pressKitDriveUrl =
  "https://drive.google.com/drive/folders/1zPmbzQlKLbTiZ1GcNuXYJxxsIQOAZWs2?usp=sharing";

/** Additional / full-length video files (download or preview in Drive). */
export const videosDriveFolderUrl =
  "https://drive.google.com/drive/folders/1MDOdZGdYdcwU270h44fWpakPtYaGbPj0?usp=sharing";

export const bookingEmail = "booking@djwomp.com";

/** Intro line under the hero “womp” title (same copy in the hero box). */
export const heroTagline =
  "140 Dubstep Producer out of Seattle, WA." as const;

export const navItems = [
  { label: "Highlights", href: "#stats" },
  { label: "Bio", href: "#bio" },
  { label: "Shows", href: "#shows" },
  { label: "Listen", href: "#listen" },
  { label: "Photos", href: "#press" },
  { label: "Video", href: "#video" },
  { label: "Contact", href: "#contact" },
] as const;

/** Main site (fans) — deep links on `/`; industry kit at `/epk`. */
export const fanNavItems = [
  { label: "Shows", href: "#shows" },
  { label: "Listen", href: "#listen" },
  { label: "Press kit", href: "/epk" },
] as const;

/** Local hero (also overridable with `NEXT_PUBLIC_HERO_IMAGE_URL`). */
const defaultHeroImage = "/assets/hero.jpg";

const envHeroUrl =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_HERO_IMAGE_URL?.trim() || ""
    : "";

/** Bust CDN/browser cache for the default file when the image is replaced without renaming. */
const heroLocalCacheKey =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_HERO_IMAGE_REVISION?.trim() ||
      process.env.VERCEL_DEPLOYMENT_ID?.trim() ||
      ""
    : "";

export const heroImage = envHeroUrl
  ? envHeroUrl
  : heroLocalCacheKey
    ? `${defaultHeroImage}?v=${encodeURIComponent(heroLocalCacheKey)}`
    : defaultHeroImage;

/** Google Drive and similar hosts block Next’s optimizer fetch. */
export const heroImageUnoptimized =
  heroImage.includes("drive.google.com") ||
  heroImage.includes("googleusercontent.com") ||
  (!envHeroUrl && heroImage.startsWith("/"));

/** Highlights streaming row — portrait beside platform stats (`public/assets/profile_pic.png`). */
export const profileHighlightImage = "/assets/profile_pic.png";

/** White wordmark from djwomp.com (Wix CDN). */
export const logoImage =
  "https://static.wixstatic.com/media/07688b_f734b451dfcb4a0e872d14265ea54f52~mv2.png/v1/fit/w_560,h_184,al_c,q_92,enc_avif,quality_auto/07688b_f734b451dfcb4a0e872d14265ea54f52~mv2.png";

/** Extra press shots merged after disk files from `public/assets/gallery`. */
export const galleryImages: readonly PressShot[] = [];

export function fallbackPressShots(): PressShot[] {
  if (galleryImages.length > 0) {
    return galleryImages.map((img) => ({ src: img.src, alt: img.alt }));
  }
  return [{ src: "/assets/hero.jpg", alt: "womp" }];
}

/** Record labels — shown in the Highlights panel (name + link + optional CTA line). */
export type RecordLabel = {
  readonly name: string;
  readonly url: string;
  /** Shown under the label name (defaults to “Official site →”). */
  readonly linkLabel?: string;
};

export const recordLabels: readonly RecordLabel[] = [
  {
    name: "Ganja White Night's SubCarbon Records",
    url: "https://soundcloud.com/subcarbon",
    linkLabel: "SoundCloud →",
  },
];

/** Highlights → Performances — support billing copy. */
export const performancesSupportCopy =
  "Support for: TVBOO, Jkyl & Hyde, Chef Boyarbeatz, Shanghai Doom, Pierce, SubDocta, and Stylust";

/** Canonical artist page — embeds, fallbacks, and social links. */
export const spotifyArtistUrl =
  "https://open.spotify.com/artist/64XV9aZxwoLuxf9tgvu9Pb?si=5fb3981b813a4035";

export const spotifyArtistEmbedSrc =
  "https://open.spotify.com/embed/artist/64XV9aZxwoLuxf9tgvu9Pb?utm_source=generator&theme=0";

/** SoundCloud profile permalink — used for live-stat fetching + deep links. */
export const soundcloudPermalink = "wompbass";
export const soundcloudProfileUrl = `https://soundcloud.com/${soundcloudPermalink}`;

/** Instagram profile handle — used for the deep link + the stats panel header. */
export const instagramPermalink = "wompbass";
export const instagramProfileUrl = `https://www.instagram.com/${instagramPermalink}/`;

export const socialLinks = [
  {
    label: "Spotify",
    href: spotifyArtistUrl,
  },
  {
    label: "SoundCloud",
    href: soundcloudProfileUrl,
  },
  { label: "Instagram", href: instagramProfileUrl },
  { label: "YouTube", href: "https://www.youtube.com/@wompbass" },
  { label: "Site", href: "https://www.djwomp.com/" },
] as const;

export const upcomingShows = [
  {
    date: "May 22, 2026",
    /** Last calendar day of this appearance (ISO `YYYY-MM-DD`, local compare). */
    endDate: "2026-05-22",
    city: "Brooklyn, NY",
    venue: "The Meadows · w/ SoDown",
    note: "On The Air Tour stop in Brooklyn.",
    url: "https://kydlabs.com/e/EV64e63176-5c61-450a-895c-51f1aeed674c",
  },
  {
    date: "Aug 6–9, 2026",
    endDate: "2026-08-09",
    city: "Evansburg, AB",
    venue: "Friendzy Fest · Rangeton Park",
    note: "Three-stage bass music festival on the Pembina River, 18+.",
    url: "https://friendzyfest.ca/",
  },
  {
    date: "Aug 28–30, 2026",
    endDate: "2026-08-30",
    city: "Union, WV",
    venue: "Mountain Wubz · Nightfall Ridge",
    note: "Southern West Virginia's bass-leaning EDM festival.",
    url: "https://www.mountainwubz.com/",
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
