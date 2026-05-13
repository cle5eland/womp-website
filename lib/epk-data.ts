/** Client-safe site copy and URLs — no Node APIs. */

export type PressShot = { src: string; alt: string };

/** Update these as metrics change — wire to APIs later if desired. */
export const streamingStats = {
  spotifyMonthlyListeners: "—",
  spotifyFollowers: "—",
  soundcloudFollowers: "—",
  instagramFollowers: "—",
  statsNote: "Replace placeholders in lib/epk-data.ts or connect analytics.",
  lastUpdated: "2026",
} as const;

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

/** Shared Drive file — keep “Anyone with the link” → Viewer. */
export const heroDriveFileId = "1ZpB-9ngyEFnF-o7_Op_x7wWh-vEZgUzp";

/** Canonical share link (same file as below). */
export const heroDriveShareUrl = `https://drive.google.com/file/d/${heroDriveFileId}/view?usp=sharing`;

/**
 * Direct image URL for Next/img. Thumbnail endpoint is usually most reliable for large files.
 * Override with `NEXT_PUBLIC_HERO_IMAGE_URL` (e.g. `/hero.jpg` hosted in `public/`).
 */
const defaultHeroImage = `https://drive.google.com/thumbnail?id=${heroDriveFileId}&sz=w1920`;

const envHeroUrl =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_HERO_IMAGE_URL?.trim() || ""
    : "";

export const heroImage = envHeroUrl || defaultHeroImage;

/** Google Drive blocks Next’s optimizer fetch; use native img decoding for Drive URLs. */
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

export const soundcloudEmbedSrc =
  "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/resolve%3Furl%3Dhttps%253A//soundcloud.com/djwomp&color=%23080808&inverse=true&auto_play=false&show_user=true";

export const socialLinks = [
  {
    label: "Spotify",
    href: "https://open.spotify.com/artist/64XV9aZxwoLuxf9tgvu9Pb?si=5fb3981b813a4035",
  },
  {
    label: "SoundCloud",
    href: "https://soundcloud.com/djwomp",
  },
  { label: "Instagram", href: "https://www.instagram.com/dj_womp/" },
  { label: "YouTube", href: "https://www.youtube.com/@djwomp" },
  { label: "Site", href: "https://www.djwomp.com/" },
] as const;

export const upcomingShows = [
  {
    date: "TBA",
    city: "Seattle / NYC",
    venue: "Add confirmed dates in lib/epk-data.ts",
    note: "Replace with ticket links when live.",
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
  elevator:
    "I'm womp, a dubstep producer and DJ based in Seattle, WA. I've been steadily building a following through releases like Read My Lips and Smoke and by throwing grassroots bass events in NYC and Seattle. Along the way, I've shared the stage with artists like TVBOO, Chef Boyarbeatz, Shanghai Doom, Pierce, SubDocta, and Stylust. My sound is heavily influenced by LYNY, Peekaboo, and Xotix.",
  placeholder:
    "Long-form bio, quotes, and press bullets will live here — we'll shape this section together.",
} as const;
