import { useState, useRef } from "react";
import { Upload, File, Loader2, CheckCircle2, XCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PdfUploadProps {
  onTextExtracted: (text: string) => void;
  className?: string;
}

export function PdfUpload({ onTextExtracted, className }: PdfUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [extractedCharCount, setExtractedCharCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

  async function parseResume(selectedFile: File) {
    if (!BASE) {
      setStatus("error");
      setErrorMessage("API URL not configured");
      return;
    }

    setLoading(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        throw new Error("You must be signed in to parse resumes");
      }

      const formData = new FormData();
      formData.append("resume", selectedFile);

      const res = await fetch(`${BASE}/api/parse-pdf`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || `Upload failed: ${res.status}`);
      }

      const data = await res.json();
      const extractedText = data.text || data.extractedText || "";
      setExtractedCharCount(extractedText.length);
      setStatus("success");
      onTextExtracted(extractedText);
      toast.success("PDF parsed successfully");
    } catch (e) {
      setStatus("error");
      const message = e instanceof Error ? e.message : "Failed to parse PDF";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function handleFileSelect(selectedFile: File) {
    if (!selectedFile.type.includes("pdf")) {
      toast.error("Only PDF files are allowed");
      return;
    }
    setFile(selectedFile);
    setStatus("idle");
    setErrorMessage("");
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.currentTarget.classList.add("bg-primary/5");
  }

  function handleDragLeave(e: React.DragEvent) {
    e.currentTarget.classList.remove("bg-primary/5");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.currentTarget.classList.remove("bg-primary/5");
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.currentTarget.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }

  function handleClear() {
    setFile(null);
    setStatus("idle");
    setErrorMessage("");
    setExtractedCharCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className={cn("w-full space-y-3", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-lg border-2 border-dashed transition-colors p-6 cursor-pointer",
          "hover:border-primary/50",
          status === "success" && "border-green-500/30 bg-green-500/5",
          status === "error" && "border-red-500/30 bg-red-500/5",
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleInputChange}
          className="hidden"
        />

        {!file && status === "idle" && (
          <div className="flex flex-col items-center justify-center text-center">
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Drop your resume PDF here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">PDF only</p>
          </div>
        )}

        {file && status === "idle" && (
          <div className="flex flex-col items-center justify-center text-center">
            <File className="h-8 w-8 text-blue-500 mb-2" />
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm font-medium">Extracting text from PDF...</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
            <p className="text-sm font-medium">{extractedCharCount.toLocaleString()} characters extracted</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center text-center">
            <XCircle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-sm font-medium text-red-600">{errorMessage}</p>
          </div>
        )}
      </div>

      {file && status === "idle" && (
        <div className="flex gap-2">
          <Button
            onClick={() => parseResume(file)}
            disabled={loading}
            className="flex-1"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Parse Resume
          </Button>
          <Button
            variant="outline"
            onClick={handleClear}
            size="icon"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {(status === "success" || status === "error") && (
        <Button
          variant="outline"
          onClick={handleClear}
          className="w-full"
        >
          Clear
        </Button>
      )}
    </div>
  );
}
