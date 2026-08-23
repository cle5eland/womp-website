"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import { SoundcloudIcon } from "@/components/platform-icons";
import {
  GATE_ACTION_LABELS,
  type GateActionKind,
  type GateActionResponse,
  type GateProgress,
  type GateViewState,
  MAX_COMMENT_LENGTH,
  MIN_COMMENT_LENGTH,
  requiredActions,
} from "@/lib/gate-types";

/**
 * The fan-facing download gate.
 *
 * One button per action, on purpose: the SoundCloud API terms only permit
 * acting on a user's behalf for actions they "specifically and deliberately"
 * initiated, so there is no "do everything" control here and the comment box
 * is never pre-filled.
 *
 * Server state is authoritative. Every response carries the full `progress`
 * object and the recomputed `unlocked` flag, and this component simply renders
 * whatever came back rather than optimistically guessing.
 */

const SOUNDCLOUD_ORANGE = "#ff5500";

type Busy = GateActionKind | "claim" | null;

export function GateExperience({
  state,
  initialError,
}: {
  state: GateViewState;
  initialError: string | null;
}) {
  const { gate, mockMode } = state;

  const [fan, setFan] = useState(state.fan);
  const [progress, setProgress] = useState<GateProgress>(state.progress);
  const [unlocked, setUnlocked] = useState(state.unlocked);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(initialError);
  const [needsReconnect, setNeedsReconnect] = useState(false);

  const [comment, setComment] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);

  const steps = useMemo(
    () => requiredActions(gate.requirements),
    [gate.requirements],
  );

  const connectHref = `/api/gate/${encodeURIComponent(gate.slug)}/connect`;

  function applyResponse(data: GateActionResponse) {
    if (data.ok) {
      setProgress(data.progress);
      setUnlocked(data.unlocked);
      setError(null);
      setNeedsReconnect(false);
      return true;
    }
    setError(data.error);
    setNeedsReconnect(Boolean(data.reconnect));
    // A rejected token means the identity we are showing is no longer usable.
    if (data.reconnect) setFan(null);
    return false;
  }

  async function post(path: string, body: unknown, key: Busy) {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      return applyResponse((await res.json()) as GateActionResponse);
    } catch {
      setError("Network hiccup — check your connection and try again.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function runAction(kind: GateActionKind) {
    const ok = await post(
      `/api/gate/${encodeURIComponent(gate.slug)}/action`,
      {
        action: kind,
        comment: kind === "comment" ? comment : undefined,
      },
      kind,
    );
    if (ok && kind === "comment") setComment("");
  }

  async function submitContact(event: React.FormEvent) {
    event.preventDefault();
    await post(
      `/api/gate/${encodeURIComponent(gate.slug)}/claim`,
      { firstName, email, marketingConsent: consent },
      "claim",
    );
  }

  const contactDone = Boolean(progress.emailCapturedAt);
  const actionsDone = steps.every((kind) => progress[kind] !== null);

  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-12 sm:px-8 sm:py-16">
      {mockMode ? (
        <p className="mb-6 border border-amber-400/40 bg-amber-400/[0.06] px-4 py-2 text-[10px] font-medium uppercase tracking-[0.28em] text-amber-300">
          Mock mode — SoundCloud calls are stubbed
        </p>
      ) : null}

      <TrackHeader gate={gate} />

      <section className="mt-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-zinc-500">
          Free download
        </p>
        <h2 className="font-display mt-2 text-4xl leading-none text-white sm:text-5xl">
          {gate.title}
        </h2>
        {gate.description ? (
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            {gate.description}
          </p>
        ) : null}
      </section>

      {error ? (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="mt-6 border border-red-500/40 bg-red-500/[0.07] px-4 py-3 text-sm text-red-200"
        >
          {error}
        </motion.p>
      ) : null}

      {!fan || needsReconnect ? (
        <ConnectPanel href={connectHref} reconnect={needsReconnect} />
      ) : (
        <>
          <ConnectedAs
            username={fan.username}
            avatarUrl={fan.avatarUrl}
            profileUrl={fan.permalinkUrl}
          />

          <ol className="mt-8 space-y-3">
            {steps.map((kind, index) => (
              <StepRow
                key={kind}
                index={index + 1}
                kind={kind}
                doneAt={progress[kind]}
                busy={busy === kind}
                disabled={busy !== null}
                comment={comment}
                onComment={setComment}
                onRun={() => runAction(kind)}
              />
            ))}

            <ContactStep
              index={steps.length + 1}
              done={contactDone}
              busy={busy === "claim"}
              disabled={busy !== null || !actionsDone}
              firstName={firstName}
              email={email}
              consent={consent}
              onFirstName={setFirstName}
              onEmail={setEmail}
              onConsent={setConsent}
              onSubmit={submitContact}
            />
          </ol>

          <DownloadPanel
            slug={gate.slug}
            unlocked={unlocked}
            filename={gate.deliveryFilename}
          />
        </>
      )}

      <Attribution gate={gate} />
    </main>
  );
}

// ---------------------------------------------------------------------------

function TrackHeader({ gate }: { gate: GateViewState["gate"] }) {
  return (
    <div className="flex items-center gap-5">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-white/10 bg-black sm:h-24 sm:w-24">
        {gate.artworkUrl ? (
          <Image
            src={gate.artworkUrl.replace("-large.", "-t500x500.")}
            alt={`${gate.trackTitle} artwork`}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <SoundcloudIcon className="h-7 w-7 text-zinc-700" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">
          {gate.trackTitle}
        </p>
        <p className="mt-1 truncate text-[11px] uppercase tracking-[0.25em] text-zinc-500">
          {gate.artistUsername}
        </p>
        <a
          href={gate.trackPermalinkUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-zinc-500 transition hover:text-[color:var(--accent)]"
        >
          <SoundcloudIcon className="h-3 w-3" />
          Open on SoundCloud
        </a>
      </div>
    </div>
  );
}

function ConnectPanel({
  href,
  reconnect,
}: {
  href: string;
  reconnect: boolean;
}) {
  return (
    <div className="glow-box mt-8 border border-[color:var(--accent)]/30 bg-[color:var(--accent)]/[0.04] p-6">
      <p className="text-sm leading-relaxed text-zinc-300">
        {reconnect
          ? "Reconnect your SoundCloud account to pick up where you left off."
          : "Connect your SoundCloud account to unlock the download. You choose each action — nothing happens without your say-so."}
      </p>
      <a
        href={href}
        className="mt-5 inline-flex items-center justify-center gap-2.5 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-black transition hover:brightness-110"
        style={{ backgroundColor: SOUNDCLOUD_ORANGE }}
      >
        <SoundcloudIcon className="h-4 w-4" />
        {reconnect ? "Reconnect SoundCloud" : "Connect with SoundCloud"}
      </a>
      <p className="mt-4 text-[10px] leading-relaxed text-zinc-500">
        We never see your password, we never post anything you did not press,
        and we do not store your SoundCloud login.
      </p>
    </div>
  );
}

function ConnectedAs({
  username,
  avatarUrl,
  profileUrl,
}: {
  username: string;
  avatarUrl: string | null;
  profileUrl: string | null;
}) {
  return (
    <div className="mt-8 flex items-center gap-3 border border-white/[0.09] bg-black/40 px-4 py-3">
      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/10 bg-zinc-900">
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" fill sizes="32px" className="object-cover" />
        ) : null}
      </div>
      <p className="min-w-0 flex-1 truncate text-xs text-zinc-400">
        Connected as{" "}
        {profileUrl ? (
          <a
            href={profileUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="text-white underline decoration-white/30 underline-offset-2 hover:decoration-white"
          >
            @{username}
          </a>
        ) : (
          <span className="text-white">@{username}</span>
        )}
      </p>
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: SOUNDCLOUD_ORANGE }}
        aria-hidden
      />
    </div>
  );
}

function StepShell({
  index,
  title,
  helper,
  done,
  children,
}: {
  index: number;
  title: string;
  helper: string;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className={
        "border p-4 sm:p-5 " +
        (done
          ? "border-[color:var(--accent)]/30 bg-[color:var(--accent)]/[0.04]"
          : "border-white/[0.09] bg-black/40")
      }
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className={
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-[11px] font-semibold " +
            (done
              ? "bg-[color:var(--accent)] text-black"
              : "border border-white/15 text-zinc-500")
          }
        >
          {done ? "✓" : index}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
            {helper}
          </p>
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </motion.li>
  );
}

function ActionButton({
  children,
  onClick,
  busy,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  busy: boolean;
  disabled: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      className="inline-flex items-center justify-center border border-[color:var(--accent)]/50 bg-[color:var(--accent)]/15 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-[color:var(--accent)]/30 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-transparent disabled:text-zinc-600"
    >
      {busy ? "Working…" : children}
    </button>
  );
}

function DoneBadge({ label, at }: { label: string; at: string }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[color:var(--accent)]">
      {label}
      <span className="ml-2 tracking-normal text-zinc-600 normal-case">
        {new Date(at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })}
      </span>
    </p>
  );
}

function StepRow({
  index,
  kind,
  doneAt,
  busy,
  disabled,
  comment,
  onComment,
  onRun,
}: {
  index: number;
  kind: GateActionKind;
  doneAt: string | null;
  busy: boolean;
  disabled: boolean;
  comment: string;
  onComment: (value: string) => void;
  onRun: () => void;
}) {
  const copy = GATE_ACTION_LABELS[kind];
  const done = doneAt !== null;

  return (
    <StepShell
      index={index}
      title={copy.title}
      helper={copy.helper}
      done={done}
    >
      {done ? (
        <DoneBadge label={copy.done} at={doneAt} />
      ) : kind === "comment" ? (
        <div className="space-y-2">
          <textarea
            value={comment}
            onChange={(event) => onComment(event.target.value)}
            maxLength={MAX_COMMENT_LENGTH}
            rows={3}
            placeholder="Type your comment…"
            aria-label="Your comment"
            className="w-full resize-y border border-white/12 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-[color:var(--accent)]/60 focus:outline-none"
          />
          <div className="flex items-center justify-between gap-3">
            <ActionButton
              onClick={onRun}
              busy={busy}
              disabled={disabled || comment.trim().length < MIN_COMMENT_LENGTH}
            >
              {copy.cta}
            </ActionButton>
            <span className="text-[10px] text-zinc-600">
              {comment.length}/{MAX_COMMENT_LENGTH}
            </span>
          </div>
        </div>
      ) : (
        <ActionButton onClick={onRun} busy={busy} disabled={disabled}>
          {copy.cta}
        </ActionButton>
      )}
    </StepShell>
  );
}

function ContactStep({
  index,
  done,
  busy,
  disabled,
  firstName,
  email,
  consent,
  onFirstName,
  onEmail,
  onConsent,
  onSubmit,
}: {
  index: number;
  done: boolean;
  busy: boolean;
  disabled: boolean;
  firstName: string;
  email: string;
  consent: boolean;
  onFirstName: (value: string) => void;
  onEmail: (value: string) => void;
  onConsent: (value: boolean) => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
    <StepShell
      index={index}
      title="Where should the download go?"
      helper="First name and email. We use it to send you the link and the occasional release."
      done={done}
    >
      {done ? (
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[color:var(--accent)]">
          Details saved
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={firstName}
              onChange={(event) => onFirstName(event.target.value)}
              placeholder="First name"
              aria-label="First name"
              autoComplete="given-name"
              maxLength={100}
              required
              className="w-full border border-white/12 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-[color:var(--accent)]/60 focus:outline-none"
            />
            <input
              type="email"
              value={email}
              onChange={(event) => onEmail(event.target.value)}
              placeholder="you@email.com"
              aria-label="Email address"
              autoComplete="email"
              maxLength={254}
              required
              className="w-full border border-white/12 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-[color:var(--accent)]/60 focus:outline-none"
            />
          </div>
          <label className="flex cursor-pointer items-start gap-2.5 text-[10px] leading-relaxed text-zinc-500">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => onConsent(event.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[color:var(--accent)]"
            />
            <span>
              Email me about new music and shows. Optional, and you can
              unsubscribe any time.
            </span>
          </label>
          <ActionButton type="submit" busy={busy} disabled={disabled}>
            Save &amp; unlock
          </ActionButton>
          {disabled && !busy ? (
            <p className="text-[10px] text-zinc-600">
              Finish the steps above first.
            </p>
          ) : null}
        </form>
      )}
    </StepShell>
  );
}

function DownloadPanel({
  slug,
  unlocked,
  filename,
}: {
  slug: string;
  unlocked: boolean;
  filename: string | null;
}) {
  if (!unlocked) {
    return (
      <div className="mt-8 border border-white/[0.09] bg-black/40 px-5 py-6 text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-600">
          Download locked
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Complete every step to unlock the file.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="glow-box mt-8 border border-[color:var(--accent)]/40 bg-[color:var(--accent)]/[0.06] px-5 py-6 text-center"
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[color:var(--accent)]">
        Unlocked
      </p>
      <a
        href={`/api/gate/${encodeURIComponent(slug)}/download`}
        className="font-display mt-3 inline-block bg-[color:var(--accent)] px-8 py-3 text-2xl leading-none text-black transition hover:brightness-110"
      >
        Download
      </a>
      {filename ? (
        <p className="mt-3 truncate text-[10px] text-zinc-500">{filename}</p>
      ) : null}
    </motion.div>
  );
}

function Attribution({ gate }: { gate: GateViewState["gate"] }) {
  return (
    <footer className="mt-auto pt-12 text-[10px] leading-relaxed text-zinc-600">
      <p>
        <a
          href={gate.trackPermalinkUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="underline decoration-white/20 underline-offset-2 hover:text-zinc-400"
        >
          {gate.trackTitle}
        </a>{" "}
        by {gate.artistUsername}, on SoundCloud.
      </p>
      <p className="mt-2">
        <a
          href="/privacy"
          className="underline decoration-white/20 underline-offset-2 hover:text-zinc-400"
        >
          Privacy
        </a>
      </p>
    </footer>
  );
}
