"use client";

import { CheckCircle2, FileUp, Globe, Loader2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const STAGES = {
  file: ["Uploading", "Extracting text", "Splitting into chunks", "Embedding & indexing"],
  url: ["Checking the site", "Crawling pages", "Splitting into chunks", "Embedding & indexing"],
};

type Props = { botId: string; maxFileMb: number; crawlPages: number; disabledReason: string | null };

export function SourceUploader({ botId, maxFileMb, crawlPages, disabledReason }: Props) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<null | "file" | "url">(null);
  const [stage, setStage] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(kind: "file" | "url", body: FormData) {
    setBusy(kind);
    setError(null);
    setStage(0);
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, STAGES[kind].length - 1)), kind === "url" ? 2600 : 900);
    try {
      const res = await fetch(`/api/bots/${botId}/sources`, { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      const s = data.source;
      toast.success(`Indexed “${s.name}”`, {
        description: `${s.chunkCount} chunks${s.kind === "url" ? ` from ${s.pageCount} page${s.pageCount === 1 ? "" : "s"}` : ""} are ready to answer questions.`,
      });
      setUrl("");
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong.";
      setError(message);
      router.refresh();
    } finally {
      clearInterval(timer);
      setBusy(null);
    }
  }

  function onFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (file.size > maxFileMb * 1024 * 1024) {
      setError(`Files can be up to ${maxFileMb} MB on your plan.`);
      return;
    }
    const body = new FormData();
    body.append("file", file);
    void submit("file", body);
  }

  if (disabledReason) {
    return <div className="rounded-2xl border border-dashed border-black/10 bg-white/60 p-6 text-center text-[14px] text-muted-foreground">{disabledReason}</div>;
  }

  return (
    <Tabs defaultValue="file" className="gap-4">
      <TabsList className="w-full sm:w-fit">
        <TabsTrigger value="file" disabled={!!busy} className="flex-1 sm:flex-none">
          <FileUp /> Upload a file
        </TabsTrigger>
        <TabsTrigger value="url" disabled={!!busy} className="flex-1 sm:flex-none">
          <Globe /> Crawl a website
        </TabsTrigger>
      </TabsList>

      <TabsContent value="file">
        <button
          type="button"
          disabled={!!busy}
          onClick={() => fileInput.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            onFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition",
            dragging ? "border-iris bg-accent" : "border-black/10 bg-[#fbf8f4] hover:border-iris/40 hover:bg-white",
            busy && "cursor-progress",
          )}
        >
          {busy === "file" ? <Progress stages={STAGES.file} stage={stage} /> : (
            <>
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-iris shadow-sm ring-1 ring-black/5">
                <UploadCloud className="size-5" />
              </span>
              <p className="mt-4 font-semibold">Drop a file here, or click to browse</p>
              <p className="mt-1 text-[13px] text-muted-foreground">PDF, DOCX, TXT or Markdown · up to {maxFileMb} MB</p>
            </>
          )}
        </button>
        <input
          ref={fileInput}
          type="file"
          className="sr-only"
          accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
          onChange={(e) => {
            onFiles(e.target.files);
            e.target.value = "";
          }}
          aria-label="Upload a knowledge file"
        />
      </TabsContent>

      <TabsContent value="url">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const body = new FormData();
            body.append("url", url);
            void submit("url", body);
          }}
          className="rounded-2xl border border-black/[0.06] bg-[#fbf8f4] p-5"
        >
          {busy === "url" ? (
            <div className="py-4">
              <Progress stages={STAGES.url} stage={stage} />
            </div>
          ) : (
            <>
              <label htmlFor="crawl-url" className="text-[14px] font-medium">
                Website address
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <Input id="crawl-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yourbusiness.com" required className="h-11 flex-1 rounded-xl bg-white" />
                <Button type="submit" size="lg" className="h-11 rounded-xl px-5">
                  Crawl site
                </Button>
              </div>
              <p className="mt-2 text-[12px] text-muted-foreground">
                We follow links on the same domain, up to {crawlPages} pages on your plan, and respect robots.txt.
              </p>
            </>
          )}
        </form>
      </TabsContent>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </p>
      )}
    </Tabs>
  );
}

function Progress({ stages, stage }: { stages: string[]; stage: number }) {
  return (
    <ol className="mx-auto w-full max-w-xs space-y-2 text-left" aria-live="polite">
      {stages.map((label, i) => (
        <li key={label} className={cn("flex items-center gap-2.5 text-[14px]", i > stage && "text-muted-foreground/60")}>
          {i < stage ? <CheckCircle2 className="size-4 text-emerald-600" /> : i === stage ? <Loader2 className="size-4 animate-spin text-iris" /> : <span className="size-4 rounded-full border border-black/15" />}
          {label}
        </li>
      ))}
    </ol>
  );
}
