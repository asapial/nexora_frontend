import { cn } from "@/lib/utils";
import { RiCameraLine } from "react-icons/ri";
import { useRef } from "react";

export function ProfileAvatar({ name, src, size = "lg", onUploadSuccess }: {
  name: string;
  src: string | null | undefined;
  size?: "sm" | "md" | "lg";
  onUploadSuccess?: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const dim = size === "lg" ? "w-24 h-24 text-3xl" : size === "md" ? "w-14 h-14 text-xl" : "w-10 h-10 text-sm";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(
        `https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`,
        { method: "POST", body: formData }
      );

      const data = await res.json();

      if (data.success) {
        onUploadSuccess?.(data.data.url); // ✅ uploaded URL পাঠাও
      } else {
        console.error("ImgBB upload failed:", data);
      }
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  return (
    <div className={cn("relative flex-shrink-0", dim)}>
      {src
        ? <img src={src} alt={name} className={cn(dim, "rounded-2xl object-cover border-2 border-border")} />
        : <div className={cn(dim, "rounded-2xl flex items-center justify-center font-extrabold border-2",
            "bg-teal-600/15 dark:bg-teal-400/12 text-teal-700 dark:text-teal-300 border-teal-300/50 dark:border-teal-600/30")}>
            {initials}
          </div>
      }

      {/* ✅ hidden file input এখানেই */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {onUploadSuccess && (
        <button
          onClick={() => fileRef.current?.click()}
          className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl
                     bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600
                     border-2 border-background flex items-center justify-center
                     text-white text-sm shadow-lg shadow-teal-600/25 transition-all hover:scale-105">
          <RiCameraLine />
        </button>
      )}
    </div>
  );
}