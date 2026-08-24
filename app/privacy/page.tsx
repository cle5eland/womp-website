import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What womp.com collects when you use a download gate, why, and how to have it removed.",
};

/**
 * Privacy notice. Required rather than optional: the SoundCloud API Terms of
 * Use oblige any app that processes user personal data to publish one, and the
 * download gates collect a name, an email and a SoundCloud handle.
 *
 * Keep this page factually in step with the code. If the gate starts storing
 * something new, it belongs in the list below.
 */
export default function PrivacyPage() {
  const contact = process.env.PRIVACY_CONTACT_EMAIL ?? null;

  return (
    <>
      <div className="grain" aria-hidden />
      <main className="relative z-10 mx-auto w-full max-w-2xl px-5 py-16 sm:px-8">
        <Link
          href="/"
          className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 hover:text-white"
        >
          ← womp
        </Link>

        <h1 className="font-display mt-4 text-4xl leading-none text-white sm:text-5xl">
          Privacy
        </h1>
        <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-zinc-600">
          Free download gates
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-zinc-400">
          <Section title="What this covers">
            <p>
              This page describes what happens when you use a free download page
              on this site — the ones that ask you to connect your SoundCloud
              account. The rest of the site does not collect anything about you.
            </p>
          </Section>

          <Section title="What we collect">
            <ul className="space-y-2">
              <Item>
                Your SoundCloud username and account identifier, so we know who
                has unlocked which download.
              </Item>
              <Item>
                The first name and email address you type into the form.
              </Item>
              <Item>
                A timestamp for each action you complete — like, repost, comment,
                follow — and a count of how many times you downloaded the file.
              </Item>
              <Item>
                Your agreement to receive occasional emails about new music and
                shows, which is required to complete a download. You can
                unsubscribe any time.
              </Item>
            </ul>
          </Section>

          <Section title="What we do not collect">
            <ul className="space-y-2">
              <Item>
                Your SoundCloud password. The connection uses SoundCloud&apos;s
                own sign-in, and we never see it.
              </Item>
              <Item>
                Your SoundCloud access token. It is held in an encrypted cookie
                in your browser for about an hour and never written to our
                database.
              </Item>
              <Item>
                Anything else from your SoundCloud account — we do not read your
                library, your followers, or your listening history.
              </Item>
            </ul>
          </Section>

          <Section title="Actions on your SoundCloud account">
            <p>
              A download page can like, repost, comment on, or follow on your
              behalf. Each of those happens only when you press that specific
              button, one action per press. We never post a comment you did not
              write yourself, and there is no button that performs several
              actions at once. You can undo any of them from SoundCloud at any
              time, and you can revoke this site&apos;s access entirely in your
              SoundCloud account settings.
            </p>
          </Section>

          <Section title="How long we keep it">
            <p>
              If you start a download and do not finish, the partial record is
              deleted automatically after 30 days. If you complete a download, we
              keep the record so you can come back and download the file again,
              and so we can email you about new music. You can unsubscribe any
              time.
            </p>
          </Section>

          <Section title="Who else sees it">
            <p>
              The site runs on Vercel and stores this data in a hosted Postgres
              database; both act as processors on our behalf. We do not sell your
              data and we do not share it with anyone for advertising.
            </p>
          </Section>

          <Section title="Removing your data">
            <p>
              You can ask us to delete everything we hold about you, or to send
              you a copy.{" "}
              {contact ? (
                <>
                  Email{" "}
                  <a
                    href={`mailto:${contact}`}
                    className="text-[color:var(--accent)] hover:underline"
                  >
                    {contact}
                  </a>{" "}
                  and we will action it.
                </>
              ) : (
                <>
                  Get in touch through any of the links on the{" "}
                  <Link href="/" className="text-[color:var(--accent)] hover:underline">
                    homepage
                  </Link>{" "}
                  and we will action it.
                </>
              )}{" "}
              Unsubscribing from emails is a single click in any email we send.
            </p>
          </Section>
        </div>
      </main>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-500">
        {title}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span aria-hidden className="mt-2 h-1 w-1 shrink-0 bg-[color:var(--accent)]" />
      <span>{children}</span>
    </li>
  );
}
