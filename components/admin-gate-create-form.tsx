"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  GATE_ACTION_KINDS,
  GATE_ACTION_LABELS,
  type GateActionKind,
  type GateRequirements,
  normalizeSlug,
} from "@/lib/gate-types";

const ALL_REQUIRED: GateRequirements = {
  like: true,
  repost: true,
  comment: true,
  follow: true,
};

export function AdminGateCreateForm() {
  const router = useRouter();

  const [soundcloudUrl, setSoundcloudUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] =
    useState<GateRequirements>(ALL_REQUIRED);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(kind: GateActionKind) {
    setRequirements((current) => ({ ...current, [kind]: !current[kind] }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/gates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          soundcloudUrl,
          slug: normalizeSlug(slug),
          title,
          description,
          requirements,
        }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !data.id) {
        setError(data.error ?? "Could not create the gate.");
        return;
      }
      router.push(`/admin/gates/${data.id}`);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const previewSlug = normalizeSlug(slug);

  return (
    <form onSubmit={submit} className="mt-8 max-w-xl space-y-6">
      <Field
        label="SoundCloud track URL"
        hint="Must be a single track, not a playlist or profile."
      >
        <input
          type="url"
          value={soundcloudUrl}
          onChange={(event) => setSoundcloudUrl(event.target.value)}
          placeholder="https://soundcloud.com/womp/track-name"
          required
          className={inputClass}
        />
      </Field>

      <Field
        label="URL slug"
        hint={previewSlug ? `/gate/${previewSlug}` : "Lowercase, hyphens only."}
      >
        <input
          type="text"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="midnight-vip"
          required
          className={inputClass}
        />
      </Field>

      <Field label="Headline" hint="Optional — defaults to the track title.">
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Midnight VIP — free download"
          className={inputClass}
        />
      </Field>

      <Field label="Description" hint="Optional. Shown under the headline.">
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className={inputClass}
        />
      </Field>

      <fieldset>
        <legend className="text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-500">
          Required actions
        </legend>
        <div className="mt-3 space-y-2">
          {GATE_ACTION_KINDS.map((kind) => (
            <label
              key={kind}
              className="flex cursor-pointer items-center gap-3 text-xs text-zinc-300"
            >
              <input
                type="checkbox"
                checked={requirements[kind]}
                onChange={() => toggle(kind)}
                className="h-3.5 w-3.5 accent-[color:var(--accent)]"
              />
              {GATE_ACTION_LABELS[kind].title}
            </label>
          ))}
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-zinc-600">
          Fans press each action separately and write their own comment text.
          SoundCloud&apos;s API terms only allow actions a user deliberately
          initiates, so there is no combined one-click option.
        </p>
      </fieldset>

      {error ? (
        <p role="alert" className="text-xs text-red-300">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="border border-[color:var(--accent)]/50 bg-[color:var(--accent)]/15 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-[color:var(--accent)]/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Resolving track…" : "Create draft"}
      </button>
    </form>
  );
}

const inputClass =
  "mt-2 w-full border border-white/12 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-[color:var(--accent)]/60 focus:outline-none";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-500">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="mt-1.5 block text-[10px] text-zinc-600">{hint}</span>
      ) : null}
    </label>
  );
}
