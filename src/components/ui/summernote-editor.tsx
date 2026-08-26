"use client";

type JQuerySummernote = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (selector: HTMLElement): { summernote: (...args: any[]) => any };
  fn: { summernote?: unknown };
};

declare global {
  interface Window {
    jQuery?: JQuerySummernote;
    $?: JQuerySummernote;
  }
}

import * as React from "react";
import { useTheme } from "@/components/switchcn";

export type SummernoteEditorRef = {
  isEmpty: () => boolean;
};

type SummernoteEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
};

const SummernoteEditor = React.forwardRef<
  SummernoteEditorRef,
  SummernoteEditorProps
>(({ value, onChange, placeholder, height = 300 }, ref) => {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const editorInitialized = React.useRef(false);
  const { colorMode } = useTheme();
  const isDark = colorMode === "dark";

  React.useImperativeHandle(ref, () => ({
    isEmpty: () => {
      if (loaded && textareaRef.current) {
        const $ = window.$;
        if ($) {
          return $(textareaRef.current).summernote("isEmpty");
        }
      }
      return (value ?? "").trim().length === 0;
    },
  }));

  // Load jQuery and Summernote scripts/styles from CDN
  React.useEffect(() => {
    const loadAssets = async () => {
      if (!document.getElementById("summernote-style")) {
        const link = document.createElement("link");
        link.id = "summernote-style";
        link.rel = "stylesheet";
        link.href =
          "https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/summernote-lite.min.css";
        document.head.appendChild(link);
      }

      if (!document.getElementById("summernote-dark-style")) {
        const style = document.createElement("style");
        style.id = "summernote-dark-style";
        style.textContent = `
          .summernote-dark .note-editor {
            background-color: var(--card);
            color: var(--card-foreground);
            border-color: var(--border) !important;
          }
          .summernote-dark .note-toolbar {
            background-color: var(--muted) !important;
            border-color: var(--border) !important;
          }
          .summernote-dark .note-toolbar .note-btn {
            background-color: transparent !important;
            color: var(--foreground) !important;
            border-color: var(--border) !important;
          }
          .summernote-dark .note-toolbar .note-btn:hover,
          .summernote-dark .note-toolbar .note-btn.active {
            background-color: var(--accent) !important;
          }
          .summernote-dark .note-editing-area .note-editable {
            background-color: var(--card) !important;
            color: var(--card-foreground) !important;
          }
          .summernote-dark .note-editing-area .note-codable {
            background-color: var(--card) !important;
            color: var(--card-foreground) !important;
          }
          .summernote-dark .note-statusbar {
            background-color: var(--muted) !important;
            border-color: var(--border) !important;
          }
          .summernote-dark .note-statusbar .note-resizebar .note-icon-bar {
            border-top-color: var(--muted-foreground) !important;
          }
          .summernote-dark .note-placeholder {
            color: var(--muted-foreground) !important;
          }
          .summernote-dark .dropdown-menu {
            background-color: var(--popover) !important;
            color: var(--popover-foreground) !important;
            border-color: var(--border) !important;
          }
          .summernote-dark .dropdown-item:hover,
          .summernote-dark .dropdown-item:focus {
            background-color: var(--accent) !important;
            color: var(--accent-foreground) !important;
          }
          .summernote-dark .note-modal .note-modal-content {
            background-color: var(--card) !important;
            color: var(--card-foreground) !important;
            border-color: var(--border) !important;
          }
          .summernote-dark .note-modal .note-modal-header {
            border-color: var(--border) !important;
          }
          .summernote-dark .note-modal .note-modal-footer {
            border-color: var(--border) !important;
          }
          .summernote-dark .note-modal .note-input {
            background-color: var(--input) !important;
            color: var(--foreground) !important;
            border-color: var(--border) !important;
          }
        `;
        document.head.appendChild(style);
      }

      // 2. Load jQuery if not present
      if (!window.jQuery) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://code.jquery.com/jquery-3.5.1.min.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load jQuery"));
          document.body.appendChild(script);
        });
      }

      // Ensure window.$ points to window.jQuery
      window.$ = window.jQuery;

      // 3. Load Summernote JS if not present
      if (!window.jQuery!.fn.summernote) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src =
            "https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/summernote-lite.min.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Summernote"));
          document.body.appendChild(script);
        });
      }

      setLoaded(true);
    };

    loadAssets().catch((err) => console.error(err));
  }, []);

  // Initialize and destroy Summernote
  React.useEffect(() => {
    if (!loaded || !textareaRef.current) return;

    const $ = window.$!;
    const $el = $(textareaRef.current);

    $el.summernote({
      height: height,
      placeholder: placeholder || "",
      dialogsInBody: true,
      callbacks: {
        onChange: (contents: string) => {
          onChange(contents);
        },
      },
    });

    editorInitialized.current = true;

    // Set initial value with a slight delay to ensure editor DOM is fully prepared
    if (value) {
      setTimeout(() => {
        if (editorInitialized.current && textareaRef.current) {
          $el.summernote("code", value);
        }
      }, 100);
    }

    return () => {
      if (editorInitialized.current) {
        $el.summernote("destroy");
        editorInitialized.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, height, placeholder]);

  // Sync value changes from React to Summernote
  React.useEffect(() => {
    if (!loaded || !editorInitialized.current || !textareaRef.current) return;

    const $ = window.$!;
    const $el = $(textareaRef.current);

    const timer = setTimeout(() => {
      if (!editorInitialized.current || !textareaRef.current) return;
      const currentVal = $el.summernote("code");
      if (currentVal !== value && value !== undefined) {
        $el.summernote("code", value || "");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [value, loaded]);

  return (
    <div
      className={`w-full border rounded-md overflow-hidden ${isDark ? "summernote-dark" : "bg-white text-black"}`}
    >
      <textarea
        ref={textareaRef}
        defaultValue={value || ""}
        style={{
          display: loaded ? "none" : "block",
          width: "100%",
          minHeight: height,
          padding: 10,
        }}
      />
      {!loaded && (
        <div
          className="flex items-center justify-center p-4 text-sm text-muted-foreground bg-muted animate-pulse"
          style={{ height }}
        >
          Loading editor...
        </div>
      )}
    </div>
  );
});

SummernoteEditor.displayName = "SummernoteEditor";

export default SummernoteEditor;
