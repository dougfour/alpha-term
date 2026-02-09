import { Alert } from "../lib/api.js";

// ANSI colors
export const GREEN = "\x1b[92m";
export const CYAN = "\x1b[96m";
export const YELLOW = "\x1b[93m";
export const RED = "\x1b[91m";
export const RESET = "\x1b[0m";
export const BOLD = "\x1b[1m";
export const MAGENTA = "\x1b[95m";
export const DIM = "\x1b[2m";
export const CLEAR_LINE = "\x1b[2K";
export const WHITE = "\x1b[97m";

// Box drawing
export const BOX_TL = "┌", BOX_TR = "┐", BOX_BL = "└", BOX_BR = "┘";
export const BOX_H = "─", BOX_V = "│";
export const BOX_ML = "├", BOX_MR = "┤";

// Neon palette for author color-cycling
const NEON_PALETTE = [
  "\x1b[96m", // bright cyan
  "\x1b[95m", // bright magenta
  "\x1b[93m", // bright yellow
  "\x1b[92m", // bright green
  "\x1b[91m", // bright red
  "\x1b[94m", // bright blue
];
const handleColorMap = new Map<string, string>();
let paletteIndex = 0;

export function getAuthorColor(handle: string): string {
  let color = handleColorMap.get(handle);
  if (!color) {
    color = NEON_PALETTE[paletteIndex % NEON_PALETTE.length];
    handleColorMap.set(handle, color);
    paletteIndex++;
  }
  return color;
}

export function wrapText(text: string, width: number = 60): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(" ");
    let current = "";
    for (const word of words) {
      if (current.length + word.length + 1 <= width) {
        current += (current ? " " : "") + word;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

export function formatTime(createdAt: string): string {
  try {
    // Ensure timestamp is parsed as UTC
    let isoStr = createdAt;
    if (!isoStr.endsWith("Z") && !isoStr.includes("+")) {
      isoStr += "Z";
    }
    const dt = new Date(isoStr);
    const hours = dt.getHours().toString().padStart(2, "0");
    const minutes = dt.getMinutes().toString().padStart(2, "0");
    const seconds = dt.getSeconds().toString().padStart(2, "0");
    const tzName = new Intl.DateTimeFormat("en-US", { timeZoneName: "short" })
      .formatToParts(dt)
      .find((p) => p.type === "timeZoneName")?.value || "";
    return `${hours}:${minutes}:${seconds} ${tzName}`;
  } catch {
    return createdAt;
  }
}

export function colorizeText(text: string): string {
  return text
    .replace(/\$[A-Z]{1,10}\b/g, `${YELLOW}${BOLD}$&${RESET}`)
    .replace(/@\w+/g, `${CYAN}$&${RESET}`)
    .replace(/#\w+/g, `${MAGENTA}$&${RESET}`);
}

export function renderAlert(alert: Alert, isLast: boolean = true): string {
  const author = alert.author_handle;
  const displayName = alert.author_name;
  const text = alert.tweet_text;
  const timeStr = formatTime(alert.created_at);
  const authorColor = getAuthorColor(author);

  const bottom = isLast ? BOX_BL : BOX_ML;
  const right = isLast ? BOX_BR : BOX_MR;

  const authorLine = displayName
    ? `${BOLD}${WHITE}${displayName}${RESET}  ${authorColor}@${author}${RESET}`
    : `${authorColor}@${author}${RESET}`;

  const lines: string[] = [];
  lines.push(`${authorColor}${BOX_V}${RESET}  ${YELLOW}🔔${RESET}  ${authorLine}`);
  lines.push(`${authorColor}${BOX_V}${RESET}  ${CYAN}${BOX_H.repeat(30)}${RESET}`);

  const wrapped = wrapText(text);
  for (const line of wrapped) {
    lines.push(`${authorColor}${BOX_V}${RESET}  ${colorizeText(line)}`);
  }

  lines.push(`${authorColor}${BOX_V}${RESET}`);
  lines.push(`${authorColor}${BOX_V}${RESET}  ${GREEN}*${RESET} ${timeStr}`);
  lines.push(`${authorColor}${bottom}${BOX_H.repeat(75)}${right}${RESET}`);

  return lines.join("\n");
}

export function printBanner(): void {
  console.log();
  console.log(`${CYAN}╔═╗${RESET}  ${CYAN}╦${RESET}    ${CYAN}╔═╗${RESET}  ${CYAN}╦ ╦${RESET}  ${CYAN}╔═╗${RESET}    ${YELLOW}═╦═${RESET}  ${YELLOW}╔═╗${RESET}  ${YELLOW}╦═╗${RESET}  ${YELLOW}╔╦╗${RESET}`);
  console.log(`${CYAN}╠═╣${RESET}  ${CYAN}║${RESET}    ${CYAN}╠═╝${RESET}  ${CYAN}╠═╣${RESET}  ${CYAN}╠═╣${RESET}     ${YELLOW}║${RESET}   ${YELLOW}╠═${RESET}   ${YELLOW}╠╦╝${RESET}  ${YELLOW}║║║${RESET}`);
  console.log(`${CYAN}╩ ╩${RESET}  ${CYAN}╩═╝${RESET}  ${CYAN}╩${RESET}    ${CYAN}╩ ╩${RESET}  ${CYAN}╩ ╩${RESET}     ${YELLOW}╩${RESET}   ${YELLOW}╚═╝${RESET}  ${YELLOW}╩╚═${RESET}  ${YELLOW}╩ ╩${RESET}`);
  console.log(`${GREEN}══════════════════════════════════════════════════${RESET}`);
  console.log(`${MAGENTA}       <<< NEON ALPHA TERMINAL ALERTS >>>${RESET}`);
  console.log();
}
