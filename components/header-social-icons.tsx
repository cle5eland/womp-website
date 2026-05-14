/** White brand marks for header / mobile menu — `currentColor` for hover via parent. */

import {
  InstagramIcon,
  SoundcloudIcon,
  SpotifyIcon,
} from "@/components/platform-icons";

const iconClass = "h-[14px] w-[14px] shrink-0";
const linkClass =
  "flex h-8 w-8 items-center justify-center text-white transition-colors hover:text-[var(--accent)]";

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
        className={linkClass}
      >
        <InstagramIcon className={iconClass} />
      </a>
      <a
        href={spotifyHref}
        target="_blank"
        rel="noreferrer"
        aria-label="Spotify"
        className={linkClass}
      >
        <SpotifyIcon className={iconClass} />
      </a>
      <a
        href={soundcloudHref}
        target="_blank"
        rel="noreferrer"
        aria-label="SoundCloud"
        className={linkClass}
      >
        <SoundcloudIcon className={iconClass} />
      </a>
    </div>
  );
}
