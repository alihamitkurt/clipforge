import { NextResponse } from "next/server";
import ffmpeg from "fluent-ffmpeg";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os";

// HARDCODED: Confirmed working path
const FFMPEG_PATH = "C:\\Users\\aliha\\OneDrive\\Masaüstü\\ClipForge\\clipforge-app\\node_modules\\@ffmpeg-installer\\win32-x64\\ffmpeg.exe";
ffmpeg.setFfmpegPath(FFMPEG_PATH);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DURATION = 30;

async function downloadFile(url: string, dest: string) {
  const res = await axios({ url, responseType: "stream", timeout: 30000 });
  const writer = fs.createWriteStream(dest);
  res.data.pipe(writer);
  return new Promise<void>((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

function isImage(url: string) {
  return /\.(jpe?g|png|webp|gif|bmp)(\?.*)?$/i.test(url);
}

function runFfmpeg(cmd: ffmpeg.FfmpegCommand, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cmd
      .on("start", (c) => console.log(">>> CMD:", c.slice(0, 300)))
      .on("stderr", (l) => console.log(">>> FFmpeg:", l))
      .on("error", (e) => { console.error(">>> ERROR:", e.message); reject(e); })
      .on("end", () => { console.log(">>> DONE"); resolve(); })
      .save(outputPath);
  });
}

export async function POST(req: Request) {
  console.log(">>> Render started");
  const tempFiles: string[] = [];

  try {
    const body = await req.json();
    const { videoUrl, editPlan } = body;
    const timeline: any[] = editPlan?.timeline || [];

    if (!videoUrl) return NextResponse.json({ error: "No videoUrl" }, { status: 400 });

    const tmpDir = os.tmpdir();
    const imgSrc = isImage(videoUrl);
    const srcExt = imgSrc ? (videoUrl.match(/\.(jpe?g|png|webp|gif)/i)?.[0] ?? ".jpg") : ".mp4";
    const srcPath = path.join(tmpDir, `src-${Date.now()}${srcExt}`);
    const outPath = path.join(tmpDir, `out-${Date.now()}.mp4`);
    tempFiles.push(srcPath, outPath);

    // 1. Download source
    console.log(">>> Downloading source");
    await downloadFile(videoUrl, srcPath);

    // 2. Find audio layers
    const audioClips: { path: string; start: number }[] = [];
    for (const action of timeline) {
      if (action.effect === "audio" && action.url) {
        try {
          const ap = path.join(tmpDir, `aud-${Date.now()}-${audioClips.length}.mp3`);
          await downloadFile(action.url, ap);
          audioClips.push({ path: ap, start: parseFloat(action.start) || 0 });
          tempFiles.push(ap);
          console.log(">>> Audio downloaded:", ap);
        } catch (e: any) {
          console.warn(">>> Audio DL failed:", e.message);
        }
      }
    }

    // 3. Build command based on scenario
    let cmd: ffmpeg.FfmpegCommand;

    if (imgSrc) {
      // === SCENARIO A: IMAGE SOURCE ===
      if (audioClips.length > 0) {
        // Image + Audio → use simple map, no complex filters
        cmd = ffmpeg()
          .input(srcPath)
          .inputOptions(["-loop", "1", "-framerate", "30"])
          .input(audioClips[0].path) // use first audio track
          .outputOptions([
            "-map", "0:v",
            "-map", "1:a",
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-crf", "28",
            "-c:a", "aac",
            "-b:a", "128k",
            "-vf", "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p",
            "-shortest",
            `-t`, `${DURATION}`,
            "-movflags", "+faststart",
            "-y"
          ]);
      } else {
        // Image only → no audio
        cmd = ffmpeg()
          .input(srcPath)
          .inputOptions(["-loop", "1", "-framerate", "30"])
          .outputOptions([
            "-map", "0:v",
            "-an",
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-crf", "28",
            "-vf", "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p",
            `-t`, `${DURATION}`,
            "-movflags", "+faststart",
            "-y"
          ]);
      }
    } else {
      // === SCENARIO B: VIDEO SOURCE ===
      if (audioClips.length > 0) {
        // Video + extra audio → mix
        cmd = ffmpeg()
          .input(srcPath)
          .input(audioClips[0].path)
          .outputOptions([
            "-map", "0:v",
            "-map", "1:a",
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-crf", "28",
            "-c:a", "aac",
            "-b:a", "128k",
            "-vf", "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p",
            "-shortest",
            `-t`, `${DURATION}`,
            "-movflags", "+faststart",
            "-y"
          ]);
      } else {
        // Video only
        cmd = ffmpeg()
          .input(srcPath)
          .outputOptions([
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-crf", "28",
            "-c:a", "aac",
            "-vf", "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p",
            `-t`, `${DURATION}`,
            "-movflags", "+faststart",
            "-y"
          ]);
      }
    }

    await runFfmpeg(cmd, outPath);

    // 4. Upload to Supabase
    if (!fs.existsSync(outPath)) throw new Error("Output not created");
    const buf = fs.readFileSync(outPath);
    const fileName = `render-${Date.now()}.mp4`;
    const { error: upErr } = await supabase.storage.from("videos").upload(fileName, buf, { contentType: "video/mp4" });
    if (upErr) throw upErr;

    const { data: { publicUrl } } = supabase.storage.from("videos").getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl, appliedActions: ["Render complete"], skippedActions: [] });

  } catch (err: any) {
    console.error(">>> CRASH:", err.message);
    return NextResponse.json({ url: null, error: err.message }, { status: 200 });
  } finally {
    tempFiles.forEach(f => { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (_) {} });
  }
}
