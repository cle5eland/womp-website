import Image from "next/image";

const navItems = [
  { label: "About", href: "#about" },
  { label: "Music", href: "#music" },
  { label: "Live", href: "#live" },
  { label: "Press", href: "#press" },
  { label: "Contact", href: "#contact" },
  { label: "Past Shows", href: "#shows" },
];

const heroImage =
  "https://static.wixstatic.com/media/07688b_caf4bc71659d4e2099f53273f57bed66~mv2.jpg/v1/fit/w_960,h_668,q_90,enc_avif,quality_auto/07688b_caf4bc71659d4e2099f53273f57bed66~mv2.jpg";

const galleryImages = [
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

const pressShots = [
  {
    src: "https://static.wixstatic.com/media/07688b_98e964817a1a4aae8ed7d6c4f0f13191~mv2.jpg/v1/fit/w_480,h_722,q_90,enc_avif,quality_auto/07688b_98e964817a1a4aae8ed7d6c4f0f13191~mv2.jpg",
    width: 480,
    height: 722,
  },
  {
    src: "https://static.wixstatic.com/media/07688b_e7ee015eaa054a6482d9ad35bc5136b0~mv2.jpg/v1/fit/w_480,h_722,q_90,enc_avif,quality_auto/07688b_e7ee015eaa054a6482d9ad35bc5136b0~mv2.jpg",
    width: 480,
    height: 722,
  },
  {
    src: "https://static.wixstatic.com/media/07688b_7c264075c3f54b0789d631a5d7b5f553~mv2.jpg/v1/fit/w_480,h_722,q_90,enc_avif,quality_auto/07688b_7c264075c3f54b0789d631a5d7b5f553~mv2.jpg",
    width: 480,
    height: 722,
  },
  {
    src: "https://static.wixstatic.com/media/07688b_b1bc5dbe41b94c5097c75689eb88fbce~mv2.jpg/v1/fit/w_480,h_722,q_90,enc_avif,quality_auto/07688b_b1bc5dbe41b94c5097c75689eb88fbce~mv2.jpg",
    width: 480,
    height: 722,
  },
];

const videos = [
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

const socialLinks = [
  {
    label: "Spotify",
    href: "https://open.spotify.com/artist/64XV9aZxwoLuxf9tgvu9Pb?si=siQO86RCQBqQJ6EOjboM3w",
  },
  { label: "Instagram", href: "https://www.instagram.com/dj_womp" },
  { label: "YouTube", href: "https://www.youtube.com/@djwomp" },
];

const pastShows = [
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

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#050505]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <a
            href="#"
            className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-50"
          >
            womp
          </a>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="transition hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <a
            href="mailto:booking@djwomp.com"
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:border-white hover:bg-white/10"
          >
            Book Now
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-32 pt-24">
        <section
          id="hero"
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-black"
        >
          <div
            className="absolute inset-0 bg-cover bg-center opacity-50"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="relative z-10 grid gap-12 bg-gradient-to-tr from-black/80 via-black/70 to-transparent px-8 py-16 sm:grid-cols-[1.2fr_0.8fr] sm:items-end sm:px-16 sm:py-20">
            <div>
              <p className="text-sm uppercase tracking-[0.6em] text-white/70">
                Dubstep needs a cowboy.
              </p>
              <h1 className="mt-4 text-5xl font-semibold leading-tight sm:text-6xl">
                Quin &quot;womp&quot; Thompson
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
                Asheville-born, Brooklyn-based bass music renegade. From the
                octopus garage to stacked warehouse lineups, womp brings yee-haw
                theatrics to chest-pounding low end.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <a
                  href="#music"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-lg transition hover:-translate-y-0.5 hover:bg-zinc-200"
                >
                  Listen now
                </a>
                <a
                  href="#live"
                  className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
                >
                  Watch live
                </a>
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="rounded-2xl border border-white/10 bg-black/60 p-6 shadow-2xl backdrop-blur">
                <h2 className="text-sm font-semibold uppercase tracking-[0.4em] text-white/70">
                  Upcoming energy
                </h2>
                <p className="mt-4 text-xl font-semibold text-white">
                  &quot;Wear insoles.&quot; - Live crowd
                </p>
                <p className="mt-6 text-sm text-white/70">
                  On stage, womp puts the &quot;YEEEEEEE&quot; in &quot;yee-haw.&quot; Expect
                  bone-shaking drops, LED rodeos, and a saddlebag full of
                  surprises.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="mt-32 grid gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="text-4xl font-semibold tracking-tight">About</h2>
            <p className="mt-6 text-2xl text-white">Dubstep needs a cowboy.</p>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-zinc-300">
              <p>
                Every journey has a beginning, but this one happens to start in
                a sweaty, space-octopus-painted garage. Five twenty-somethings
                on the wrong side of a year of social distancing flail to a
                clipped 808. In the distance, sirens.
              </p>
              <p>
                For Quin Thompson, these were atypical times. His
                recently-discovered taste for west coast bass was cut short by a
                global pandemic, and all of a sudden the Asheville, North
                Carolina native found himself on the other side of the country,
                bumping Griz and Subtronics on his first-gen Airpods, and
                missing home.
              </p>
              <p>
                Hence, octopus garage. Two Amazon par lights, a fog machine, and
                a woefully underpowered 10-inch PA later, womp had his first gig
                and, more importantly, his first fans. Endless energy on &quot;stage&quot;
                complimented a yee-haw approach to performance, and, eventually,
                the one-car garage wouldn&apos;t cut it anymore.
              </p>
              <p>
                But even though the venue, the speakers, and the crowd have
                grown a little since then, that garage is still at the center of
                both his production and performance. Every set aims to recreate
                that simple, sweaty, human experience.
              </p>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {galleryImages.map((image) => (
              <figure
                key={image.src}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                    priority={false}
                  />
                </div>
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent px-4 py-6 text-sm font-semibold uppercase tracking-[0.4em] text-white/70">
                  {image.alt}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section
          id="music"
          className="mt-32 rounded-3xl border border-white/10 bg-gradient-to-br from-[#151515] via-[#0f0f0f] to-black px-8 py-16 sm:px-16"
        >
          <div className="flex flex-col gap-12 lg:flex-row lg:items-start">
            <div className="lg:w-2/5">
              <h2 className="text-4xl font-semibold tracking-tight">Music</h2>
              <p className="mt-4 text-xl text-white">Spotify</p>
              <p className="mt-4 text-sm leading-relaxed text-zinc-300">
                Check out my latest releases. Drop into the catalog below or hop
                over to your platform of choice.
              </p>
              <ul className="mt-6 flex flex-wrap gap-4 text-sm font-medium">
                {socialLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-white transition hover:border-white hover:bg-white/10"
                    >
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 rounded-3xl border border-white/10 bg-black/60 p-4 shadow-xl">
              <iframe
                title="Spotify player"
                src="https://open.spotify.com/embed?uri=spotify%3Aartist%3A64XV9aZxwoLuxf9tgvu9Pb"
                loading="lazy"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                className="h-[480px] w-full rounded-2xl border border-white/10"
              />
            </div>
          </div>
        </section>

        <section id="live" className="mt-32">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-end">
            <div className="lg:w-2/5">
              <h2 className="text-4xl font-semibold tracking-tight">Live</h2>
              <p className="mt-4 text-xl text-white">buckle up</p>
              <p className="mt-6 text-sm leading-relaxed text-zinc-300">
                On stage, womp puts the &quot;YEEEEEEE&quot; in &quot;yee-haw.&quot;
                While chest-pounding dubstep is the staple, the occasional
                four-on-the-floor switch up keeps the crowd on its toes - literally
                and figuratively.
              </p>
            </div>
            <div className="flex-1 grid gap-8 md:grid-cols-2">
              {videos.map((video) => (
                <article
                  key={video.url}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-black/60"
                >
                  <iframe
                    className="h-56 w-full border-b border-white/10"
                    src={video.url}
                    title={video.title}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  <div className="px-6 py-5">
                    <h3 className="text-lg font-semibold text-white">
                      {video.title}
                    </h3>
                    <p className="mt-2 text-sm text-white/60">
                      {video.duration}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="press"
          className="mt-32 rounded-3xl border border-white/10 bg-[#0a0a0a] px-8 py-16 sm:px-16"
        >
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center">
            <div className="lg:w-2/5">
              <h2 className="text-4xl font-semibold tracking-tight">
                Press Shots
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-zinc-300">
                Download high-resolution photography for press kits, flyers, and
                socials. Credit Quin Thompson / womp.
              </p>
              <a
                href="mailto:booking@djwomp.com"
                className="mt-6 inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:border-white hover:bg-white/10"
              >
                Request access
              </a>
            </div>
            <div className="flex-1 grid gap-6 sm:grid-cols-2">
              {pressShots.map((image) => (
                <div
                  key={image.src}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-black"
                >
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={image.src}
                      alt="Press shot of womp"
                      fill
                      sizes="(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 100vw"
                      className="object-cover transition duration-500 hover:scale-105"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="contact"
          className="mt-32 grid gap-12 rounded-3xl border border-white/10 bg-black/70 px-8 py-16 sm:grid-cols-[0.9fr_1.1fr] sm:px-16"
        >
          <div>
            <h2 className="text-4xl font-semibold tracking-tight">Contact</h2>
            <p className="mt-4 text-xl text-white">booking@djwomp.com</p>
            <a
              href="tel:8287827474"
              className="mt-2 block text-sm text-emerald-400 transition hover:text-emerald-300"
            >
              828-782-7474
            </a>
            <p className="mt-6 text-sm leading-relaxed text-zinc-300">
              Set the stage. Drop a line for booking requests, press inquiries,
              or to talk shop about chest-rattling bass.
            </p>
            <p className="mt-10 text-xs uppercase tracking-[0.4em] text-white/50">
              Brooklyn / Asheville / Worldwide
            </p>
          </div>
          <form className="grid gap-6 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-1">
                <label
                  htmlFor="firstName"
                  className="text-xs uppercase tracking-widest text-white/60"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="First Name"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-white focus:outline-none"
                />
              </div>
              <div className="grid gap-1">
                <label
                  htmlFor="lastName"
                  className="text-xs uppercase tracking-widest text-white/60"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Last Name"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-white focus:outline-none"
                />
              </div>
            </div>
            <div className="grid gap-1">
              <label
                htmlFor="email"
                className="text-xs uppercase tracking-widest text-white/60"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Email"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-white focus:outline-none"
              />
            </div>
            <div className="grid gap-1">
              <label
                htmlFor="message"
                className="text-xs uppercase tracking-widest text-white/60"
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                placeholder="How can we help bring the womp?"
                rows={5}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-white focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-black transition hover:-translate-y-0.5 hover:bg-zinc-200"
            >
              Send
            </button>
            <p className="text-xs text-white/50">Thanks for submitting!</p>
          </form>
        </section>

        <section id="shows" className="mt-32">
          <h2 className="text-4xl font-semibold tracking-tight">Past Shows</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {pastShows.map((show) => (
              <article
                key={show.title}
                className="rounded-3xl border border-white/10 bg-black/70 p-6"
              >
                <h3 className="text-lg font-semibold text-white">
                  {show.title}
                </h3>
                <p className="mt-2 text-sm uppercase tracking-[0.3em] text-emerald-400">
                  {show.date}
                </p>
                <p className="mt-4 text-sm text-white/70">{show.venue}</p>
                <p className="mt-4 text-sm text-white/60">{show.blurb}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/70">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-6 py-10 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>(c) {new Date().getFullYear()} womp. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="mailto:booking@djwomp.com" className="hover:text-white">
              Questions? Shoot me an email.
            </a>
            <a href="#" className="hover:text-white">
              Privacy Policy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
