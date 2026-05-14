/** Social marks: white by default; hover uses each platform’s brand color. */

import {
  InstagramIcon,
  SoundcloudIcon,
  SpotifyIcon,
} from "@/components/platform-icons";

const iconClass = "h-[14px] w-[14px] shrink-0";
const linkBase =
  "flex h-8 w-8 items-center justify-center text-white transition-colors";

export function HeaderSocialIcons({
  instagramHref,
  spotifyHref,
  soundcloudHref,
  className = "",
}: {
  instagramHref: string;
  spotifyHref: string;
  soundcloudHref: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      <a
        href={instagramHref}
        target="_blank"
        rel="noreferrer"
        aria-label="Instagram"
        className={`${linkBase} hover:text-[#E1306C]`}
      >
        <InstagramIcon className={iconClass} />
      </a>
      <a
        href={spotifyHref}
        target="_blank"
        rel="noreferrer"
        aria-label="Spotify"
        className={`${linkBase} hover:text-[#1ED760]`}
      >
        <SpotifyIcon className={iconClass} />
      </a>
      <a
        href={soundcloudHref}
        target="_blank"
        rel="noreferrer"
        aria-label="SoundCloud"
        className={`${linkBase} hover:text-[#ff5500]`}
      >
        <SoundcloudIcon className={iconClass} />
      </a>
    </div>
  );
}
