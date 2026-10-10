// fal.ai-backed hero video generator (Kling image-to-video, start → end frame).
//
// Sibling of generate-ai.ts. The homepage hero reels the Chairman sent
// (4 October 2026) are one object changing in a continuous shot; stills
// cannot do that. Kling's `tail_image_url` films the change from one
// existing keyframe to another, so every clip starts and ends on a picture
// already in data/stock/manifest.json, and the clips chain into a loop.
//
// Usage:
//   npm run gen:video -- --slug hero-earn-fly \
//     --start public/images/ai/hero-card-desk.jpg \
//     --end public/images/ai/hero-window-coast.jpg \
//     --prompt "..."
//
// FAL_KEY=skip for a dry run (guard + inputs only, no network, no spend).
//
// Same permit/ban line as generate-ai.ts — the prompt goes through the
// same bannedSubjects() tripwire. Output: public/videos/<slug>.mp4 (raw
// from fal; the workflow re-encodes it for the web) and a provenance row in
// data/stock/videos.json carrying the model, both keyframes and the full
// prompt.

import fs from "node:fs";
import path from "node:path";
import { bannedSubjects } from "./generate-ai";

const DEFAULT_MODEL = "fal-ai/kling-video/v2.5-turbo/pro/image-to-video";
const VIDEO_DIR = "public/videos";
const PROVENANCE_PATH = "data/stock/videos.json";
const KEYFRAME_WIDTH = 1280;

interface Args {
  slug: string;
  start: string;
  end: string;
  prompt: string;
  model: string;
  duration: "5" | "10";
  /** Re-download a request fal.ai already finished (and billed) instead of
   *  submitting a new one. The first runs on 5 October 2026 generated three
   *  clips and then lost them to a missing ffmpeg on the runner. */
  requestId?: string;
}

export interface VideoEntry {
  slug: string;
  file: string;
  generator: string;
  model: string;
  start: string;
  end: string;
  prompt: string;
  duration: number;
  generated_at: string;
}

function parseArgs(argv: string[]): Args {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k.startsWith("--")) out[k.slice(2)] = argv[++i] ?? "";
  }
  const a: Args = {
    slug: out.slug ?? "",
    start: out.start ?? "",
    end: out.end ?? "",
    prompt: out.prompt ?? "",
    model: out.model || DEFAULT_MODEL,
    duration: out.duration === "10" ? "10" : "5",
    requestId: out["request-id"] || undefined,
  };
  if (!/^[a-z0-9-]+$/.test(a.slug)) throw new Error("--slug must be kebab-case [a-z0-9-]+");
  if (!a.prompt) throw new Error('Required: --prompt "<motion prompt>"');
  for (const f of [a.start, a.end]) {
    if (!f || !fs.existsSync(f)) throw new Error(`Keyframe not found: ${f || "(missing --start/--end)"}`);
    if (!/^public\/images\//.test(f)) throw new Error(`Keyframes must be site images under public/images/: ${f}`);
  }
  return a;
}

async function dataUri(file: string): Promise<string> {
  const { default: sharp } = await import("sharp");
  const buf = await sharp(fs.readFileSync(file))
    .resize({ width: KEYFRAME_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

async function falJson(url: string, key: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Key ${key}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`fal.ai ${res.status} ${res.statusText} — ${(await res.text()).slice(0, 400)}`);
  return res.json();
}

async function submitAndWait(args: Args, key: string): Promise<string> {
  const queued = await falJson(`https://queue.fal.run/${args.model}`, key, {
    method: "POST",
    body: JSON.stringify({
      prompt: args.prompt,
      image_url: await dataUri(args.start),
      tail_image_url: await dataUri(args.end),
      duration: args.duration,
      negative_prompt: "text, letters, numbers, logo, watermark, people, faces, hands, blur, distortion, low quality",
    }),
  });
  // Re-dispatch with request_id=<this id> to recover the clip if a later step fails.
  console.log(`Queued ${queued.request_id}`);

  // Kling takes a few minutes; poll the queue's own status URL.
  const deadline = Date.now() + 20 * 60_000;
  for (;;) {
    if (Date.now() > deadline) throw new Error("Timed out waiting for fal.ai");
    await new Promise((r) => setTimeout(r, 10_000));
    const st = await falJson(queued.status_url, key);
    console.log(`  ${st.status}${st.queue_position != null ? ` (queue ${st.queue_position})` : ""}`);
    if (st.status === "COMPLETED") return queued.response_url;
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("FAL_KEY env var not set (FAL_KEY=skip for a dry run).");

  const violations = bannedSubjects(args.prompt);
  if (violations.length > 0) {
    throw new Error(`REFUSED — documentation, not illustration:\n  · ${violations.join("\n  · ")}`);
  }

  const dest = path.join(VIDEO_DIR, `${args.slug}.mp4`);
  if (key === "skip") {
    console.log(`[dry-run] prompt passes the subject guard`);
    console.log(`[dry-run] ${args.model}: ${args.start} → ${args.end}, ${args.duration}s → ${dest}`);
    return;
  }

  let resultUrl: string;
  if (args.requestId) {
    // Queue results live under the app id (owner/app), not the full path.
    const app = args.model.split("/").slice(0, 2).join("/");
    resultUrl = `https://queue.fal.run/${app}/requests/${args.requestId}`;
    console.log(`Fetching finished request ${args.requestId} (no new generation)`);
  } else {
    resultUrl = await submitAndWait(args, key);
  }
  const result = await falJson(resultUrl, key);
  const url: string | undefined = result?.video?.url;
  if (!url) throw new Error(`fal.ai returned no video: ${JSON.stringify(result).slice(0, 300)}`);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));

  const rows: VideoEntry[] = fs.existsSync(PROVENANCE_PATH)
    ? JSON.parse(fs.readFileSync(PROVENANCE_PATH, "utf-8"))
    : [];
  const entry: VideoEntry = {
    slug: args.slug,
    file: `videos/${args.slug}.mp4`,
    generator: `${args.model.replace(/^fal-ai\//, "").replace(/\//g, " ")} via fal.ai`,
    model: args.model,
    start: args.start.replace(/^public\//, ""),
    end: args.end.replace(/^public\//, ""),
    prompt: args.prompt,
    duration: Number(args.duration),
    generated_at: new Date().toISOString(),
  };
  const next = rows.filter((r) => r.slug !== args.slug).concat(entry).sort((a, b) => a.slug.localeCompare(b.slug));
  fs.writeFileSync(PROVENANCE_PATH, JSON.stringify(next, null, 2) + "\n");
  console.log(`✓ ${dest} (${Math.round(fs.statSync(dest).size / 1024)} KB)`);
}

if (process.argv[1] && process.argv[1].endsWith("generate-video.ts")) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
