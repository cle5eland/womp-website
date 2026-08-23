"use client";

import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  GATE_ACTION_KINDS,
  GATE_ACTION_LABELS,
  type GateActionKind,
  type GateDeliveryKind,
  type GateRequirements,
  type GateStatus,
} from "@/lib/gate-types";

export type AdminGateView = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: GateStatus;
  trackTitle: string;
  trackPermalinkUrl: string;
  artistUsername: string;
  requirements: GateRequirements;
  deliveryKind: GateDeliveryKind;
  hasBlobFile: boolean;
  deliveryExternalUrl: string | null;
  deliveryFilename: string | null;
  deliverySizeBytes: number | null;
};

export type AdminUnlockRow = {
  id: string;
  username: string;
  firstName: string | null;
  email: string | null;
  unlockedAt: string | null;
  downloadCount: number;
};

/**
 * Gate editor: copy, required actions, the deliverable, and publish state.
 *
 * The file is uploaded straight from the browser to Vercel Blob (serverless
 * request bodies are far too small for a master), and only the resulting URL is
 * sent back here to be saved.
 */
export function AdminGateEditor({
  gate,
  unlocks,
}: {
  gate: AdminGateView;
  unlocks: AdminUnlockRow[];
}) {
  const router = useRouter();

  const [title, setTitle] = useState(gate.title);
  const [description, setDescription] = useState(gate.description ?? "");
  const [requirements, setRequirements] = useState(gate.requirements);
  const [externalUrl, setExternalUrl] = useState(gate.deliveryExternalUrl ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);

  const hasDelivery = gate.hasBlobFile || Boolean(gate.deliveryExternalUrl);

  async function patch(body: Record<string, unknown>, key: string) {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/gates/${gate.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Could not save.");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Network error. Try again.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function saveDetails(event: React.FormEvent) {
    event.preventDefault();
    if (await patch({ title, description, requirements }, "details")) {
      setNotice("Saved.");
    }
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy("upload");
    setError(null);
    setNotice(null);
    setUploadPercent(0);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: `/api/admin/gates/${gate.id}/upload`,
        onUploadProgress: ({ percentage }) => setUploadPercent(percentage),
      });
      const saved = await patch(
        {
          deliveryBlobUrl: blob.url,
          deliveryFilename: file.name,
          deliveryContentType: file.type || "application/octet-stream",
          deliverySizeBytes: file.size,
        },
        "upload",
      );
      if (saved) setNotice(`Attached ${file.name}.`);
    } catch (err) {
      setError((err as Error).message || "Upload failed.");
    } finally {
      setBusy(null);
      setUploadPercent(null);
      event.target.value = "";
    }
  }

  async function saveExternalUrl(event: React.FormEvent) {
    event.preventDefault();
    if (
      await patch(
        { deliveryExternalUrl: externalUrl, deliveryFilename: null },
        "external",
      )
    ) {
      setNotice(externalUrl ? "Download URL saved." : "Download URL cleared.");
    }
  }

  async function setStatus(status: GateStatus) {
    await patch({ status }, `status-${status}`);
  }

  async function remove() {
    if (
      !window.confirm(
        `Delete "${gate.title}"? This also deletes its ${unlocks.length} unlock record(s). This cannot be undone.`,
      )
    ) {
      return;
    }
    setBusy("delete");
    const res = await fetch(`/api/admin/gates/${gate.id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) router.push("/admin/gates");
    else setError("Could not delete the gate.");
  }

  function toggle(kind: GateActionKind) {
    setRequirements((current) => ({ ...current, [kind]: !current[kind] }));
  }

  return (
    <div className="mt-3 space-y-10">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl leading-none text-white">
            {gate.title}
          </h1>
          <span className="border border-white/15 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.25em] text-zinc-400">
            {gate.status}
          </span>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          <a
            href={`/gate/${gate.slug}`}
            target="_blank"
            rel="noreferrer noopener"
            className="text-[color:var(--accent)] hover:underline"
          >
            /gate/{gate.slug}
          </a>{" "}
          ·{" "}
          <a
            href={gate.trackPermalinkUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-white"
          >
            {gate.trackTitle}
          </a>{" "}
          by {gate.artistUsername}
        </p>
      </header>

      {error ? (
        <p role="alert" className="text-xs text-red-300">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="text-xs text-[color:var(--accent)]">{notice}</p>
      ) : null}

      <Panel title="Details">
        <form onSubmit={saveDetails} className="max-w-xl space-y-5">
          <label className="block">
            <span className={labelClass}>Headline</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className={inputClass}
            />
          </label>
          <fieldset>
            <legend className={labelClass}>Required actions</legend>
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
          </fieldset>
          <Button type="submit" busy={busy === "details"}>
            Save details
          </Button>
        </form>
      </Panel>

      <Panel title="Download file">
        <p className="max-w-xl text-[11px] leading-relaxed text-zinc-500">
          Upload the file you want to give away, or point at a URL you host.
          This is never pulled from SoundCloud — their API terms prohibit apps
          that re-serve SoundCloud audio.
        </p>

        <div className="mt-5 max-w-xl space-y-6">
          <div>
            <p className={labelClass}>Upload</p>
            {gate.hasBlobFile ? (
              <p className="mt-2 text-xs text-zinc-300">
                Attached: {gate.deliveryFilename ?? "file"}
                {gate.deliverySizeBytes
                  ? ` (${formatBytes(gate.deliverySizeBytes)})`
                  : ""}
              </p>
            ) : null}
            <input
              type="file"
              onChange={handleFile}
              disabled={busy !== null}
              accept="audio/*,.wav,.aiff,.flac,.mp3,.m4a,.zip"
              className="mt-2 block w-full text-xs text-zinc-400 file:mr-3 file:border file:border-white/15 file:bg-transparent file:px-3 file:py-1.5 file:text-[10px] file:font-semibold file:uppercase file:tracking-[0.2em] file:text-zinc-300"
            />
            {uploadPercent !== null ? (
              <div className="mt-3 h-1 w-full bg-white/10">
                <div
                  className="h-full bg-[color:var(--accent)] transition-all"
                  style={{ width: `${uploadPercent}%` }}
                />
              </div>
            ) : null}
          </div>

          <form onSubmit={saveExternalUrl}>
            <label className="block">
              <span className={labelClass}>Or a download URL</span>
              <input
                type="url"
                value={externalUrl}
                onChange={(event) => setExternalUrl(event.target.value)}
                placeholder="https://…"
                className={inputClass}
              />
            </label>
            <div className="mt-3">
              <Button type="submit" busy={busy === "external"}>
                Save URL
              </Button>
            </div>
          </form>
        </div>
      </Panel>

      <Panel title="Publishing">
        {!hasDelivery ? (
          <p className="text-xs text-amber-300">
            Attach a file or download URL before publishing.
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-3">
          {gate.status !== "published" ? (
            <Button
              onClick={() => setStatus("published")}
              busy={busy === "status-published"}
              disabled={!hasDelivery}
            >
              Publish
            </Button>
          ) : (
            <Button
              onClick={() => setStatus("draft")}
              busy={busy === "status-draft"}
            >
              Unpublish
            </Button>
          )}
          {gate.status !== "archived" ? (
            <Button
              onClick={() => setStatus("archived")}
              busy={busy === "status-archived"}
              variant="ghost"
            >
              Archive
            </Button>
          ) : null}
          <Button onClick={remove} busy={busy === "delete"} variant="danger">
            Delete
          </Button>
        </div>
      </Panel>

      <Panel title={`Unlocks (${unlocks.length})`}>
        <a
          href={`/api/admin/gates/${gate.id}/unlocks`}
          className="text-[10px] font-medium uppercase tracking-[0.25em] text-[color:var(--accent)] hover:underline"
        >
          Export CSV
        </a>
        {unlocks.length === 0 ? (
          <p className="mt-4 text-xs text-zinc-500">No unlocks yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-xs">
              <thead>
                <tr className="text-[9px] uppercase tracking-[0.2em] text-zinc-600">
                  <th className="pb-2 pr-4 font-medium">SoundCloud</th>
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Email</th>
                  <th className="pb-2 pr-4 font-medium">Unlocked</th>
                  <th className="pb-2 font-medium">DLs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {unlocks.map((row) => (
                  <tr key={row.id} className="text-zinc-400">
                    <td className="py-2 pr-4 text-zinc-300">@{row.username}</td>
                    <td className="py-2 pr-4">{row.firstName ?? "—"}</td>
                    <td className="py-2 pr-4">{row.email ?? "—"}</td>
                    <td className="py-2 pr-4">
                      {row.unlockedAt
                        ? new Date(row.unlockedAt).toLocaleDateString()
                        : "in progress"}
                    </td>
                    <td className="py-2">{row.downloadCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

const labelClass =
  "text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-500";
const inputClass =
  "mt-2 w-full border border-white/12 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-[color:var(--accent)]/60 focus:outline-none";

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-white/[0.09] bg-black/40 p-5">
      <h2 className="font-display text-xl leading-none text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Button({
  children,
  onClick,
  busy,
  disabled,
  type = "button",
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  busy: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  variant?: "primary" | "ghost" | "danger";
}) {
  const styles = {
    primary:
      "border-[color:var(--accent)]/50 bg-[color:var(--accent)]/15 text-white hover:bg-[color:var(--accent)]/30",
    ghost: "border-white/15 text-zinc-300 hover:border-white/40 hover:text-white",
    danger:
      "border-red-500/40 text-red-300 hover:border-red-500/70 hover:text-red-200",
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={busy || disabled}
      className={`border px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.25em] transition disabled:cursor-not-allowed disabled:opacity-40 ${styles}`}
    >
      {busy ? "Working…" : children}
    </button>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
