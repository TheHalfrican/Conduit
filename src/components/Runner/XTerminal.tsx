import { useRef, useEffect, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import { Button } from "../UI/Button";
import { useToast } from "../../hooks/useToast";

interface XTerminalProps {
  isRunning: boolean;
  writeInput: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  subscribe: (callback: (data: string) => void) => () => void;
  onDimensionsReady?: (cols: number, rows: number) => void;
}

export function XTerminal({
  isRunning,
  writeInput,
  resize,
  subscribe,
  onDimensionsReady,
}: XTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const toast = useToast();

  // Initialize terminal once
  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      scrollback: 5000,
      cursorBlink: true,
      cursorStyle: "block",
      fontFamily: "'Courier New', monospace",
      fontSize: 12,
      theme: {
        background: "#000000",
        foreground: "#00ff41",
        cursor: "#00ff41",
        cursorAccent: "#000000",
        selectionBackground: "#00ff4140",
        black: "#000000",
        red: "#ff5555",
        green: "#00ff41",
        yellow: "#ffff55",
        blue: "#5555ff",
        magenta: "#ff55ff",
        cyan: "#55ffff",
        white: "#aaaaaa",
        brightBlack: "#808080",
        brightRed: "#ff5555",
        brightGreen: "#00ff41",
        brightYellow: "#ffff55",
        brightBlue: "#5555ff",
        brightMagenta: "#ff55ff",
        brightCyan: "#55ffff",
        brightWhite: "#ffffff",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitRef.current = fitAddon;

    // Report initial dimensions
    if (onDimensionsReady) {
      onDimensionsReady(term.cols, term.rows);
    }

    // Observe container resize
    const observer = new ResizeObserver(() => {
      fitAddon.fit();
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Forward keystrokes to PTY when running
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;

    const disposable = term.onData((data) => {
      if (isRunning) {
        writeInput(data);
      }
    });

    return () => disposable.dispose();
  }, [isRunning, writeInput]);

  // Forward resize events to PTY when running
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;

    const disposable = term.onResize(({ cols, rows }) => {
      if (isRunning) {
        resize(cols, rows);
      }
    });

    return () => disposable.dispose();
  }, [isRunning, resize]);

  // Subscribe to output data
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;

    const unsub = subscribe((base64Data: string) => {
      const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const text = new TextDecoder().decode(bytes);
      term.write(text);
    });

    return unsub;
  }, [subscribe]);

  // Drag-and-drop file paths into terminal
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!isRunning) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        // Tauri exposes the real file path via the file's path property
        // In the drop event, we can get the file name at minimum
        const paths: string[] = [];
        for (let i = 0; i < files.length; i++) {
          // In Tauri, File objects have a path property with the full filesystem path
          const file = files[i] as File & { path?: string };
          paths.push(file.path || file.name);
        }
        writeInput(paths.join(" "));
      }
    },
    [isRunning, writeInput],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleCopy = useCallback(async () => {
    const term = termRef.current;
    if (!term) return;

    const buffer = term.buffer.active;
    const lines: string[] = [];
    for (let i = 0; i < buffer.length; i++) {
      const line = buffer.getLine(i);
      if (line) {
        lines.push(line.translateToString(true));
      }
    }
    // Trim trailing empty lines
    while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
      lines.pop();
    }
    const text = lines.join("\n");
    if (text) {
      await navigator.clipboard.writeText(text);
      toast.success("Output copied");
    }
  }, [toast]);

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <Button size="sm" variant="ghost" onClick={handleCopy}>
          Copy
        </Button>
      </div>
      <div
        ref={containerRef}
        className="h-[28rem] bg-black shadow-win-inset rounded-none xterm-container"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      />
    </div>
  );
}
