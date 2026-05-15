// ============================================================================
// ANSI Escape Code Constants & Helpers
// ============================================================================

/** ESC character for ANSI sequences */
const ESC = '\x1b';

// ---------------------------------------------------------------------------
// SGR (Select Graphic Rendition) Codes
// ---------------------------------------------------------------------------

/** Reset all attributes */
export const RESET = `${ESC}[0m`;

/** Bold / increased intensity */
export const BOLD = `${ESC}[1m`;

/** Dim / faint */
export const DIM = `${ESC}[2m`;

/** Italic */
export const ITALIC = `${ESC}[3m`;

/** Underline */
export const UNDERLINE = `${ESC}[4m`;

/** Reverse video (swap foreground/background) */
export const REVERSE = `${ESC}[7m`;

/** Strikethrough / crossed out */
export const STRIKETHROUGH = `${ESC}[9m`;

// ---------------------------------------------------------------------------
// Foreground Colors (standard)
// ---------------------------------------------------------------------------

export const FG_BLACK = `${ESC}[30m`;
export const FG_RED = `${ESC}[31m`;
export const FG_GREEN = `${ESC}[32m`;
export const FG_YELLOW = `${ESC}[33m`;
export const FG_BLUE = `${ESC}[34m`;
export const FG_MAGENTA = `${ESC}[35m`;
export const FG_CYAN = `${ESC}[36m`;
export const FG_WHITE = `${ESC}[37m`;

// ---------------------------------------------------------------------------
// Foreground Colors (bright)
// ---------------------------------------------------------------------------

export const FG_BRIGHT_BLACK = `${ESC}[90m`;
export const FG_BRIGHT_RED = `${ESC}[91m`;
export const FG_BRIGHT_GREEN = `${ESC}[92m`;
export const FG_BRIGHT_YELLOW = `${ESC}[93m`;
export const FG_BRIGHT_BLUE = `${ESC}[94m`;
export const FG_BRIGHT_MAGENTA = `${ESC}[95m`;
export const FG_BRIGHT_CYAN = `${ESC}[96m`;
export const FG_BRIGHT_WHITE = `${ESC}[97m`;

// ---------------------------------------------------------------------------
// Background Colors (standard)
// ---------------------------------------------------------------------------

export const BG_BLACK = `${ESC}[40m`;
export const BG_RED = `${ESC}[41m`;
export const BG_GREEN = `${ESC}[42m`;
export const BG_YELLOW = `${ESC}[43m`;
export const BG_BLUE = `${ESC}[44m`;
export const BG_MAGENTA = `${ESC}[45m`;
export const BG_CYAN = `${ESC}[46m`;
export const BG_WHITE = `${ESC}[47m`;

// ---------------------------------------------------------------------------
// Background Colors (bright)
// ---------------------------------------------------------------------------

export const BG_BRIGHT_BLACK = `${ESC}[100m`;

// ---------------------------------------------------------------------------
// Heading Color Palette
// ---------------------------------------------------------------------------

/**
 * Color assigned to each heading level (H1–H6).
 * These use bright, distinguishable colors for visual hierarchy.
 */
export const HEADING_COLORS: readonly string[] = [
  FG_BRIGHT_MAGENTA,  // H1
  FG_BRIGHT_BLUE,     // H2
  FG_BRIGHT_CYAN,     // H3
  FG_BRIGHT_GREEN,    // H4
  FG_BRIGHT_YELLOW,   // H5
  FG_BRIGHT_WHITE,    // H6
];

// ---------------------------------------------------------------------------
// Callout Styling
// ---------------------------------------------------------------------------

export interface CalloutStyle {
  icon: string;
  color: string;
  label: string;
}

export const CALLOUT_STYLES: Record<string, CalloutStyle> = {
  NOTE: { icon: 'ℹ', color: FG_BLUE, label: 'Note' },
  TIP: { icon: '💡', color: FG_GREEN, label: 'Tip' },
  IMPORTANT: { icon: '❗', color: FG_MAGENTA, label: 'Important' },
  WARNING: { icon: '⚠', color: FG_YELLOW, label: 'Warning' },
  CAUTION: { icon: '🔴', color: FG_RED, label: 'Caution' },
};

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Wrap text with an ANSI style code, automatically appending RESET.
 */
export function style(text: string, ...codes: string[]): string {
  if (codes.length === 0) return text;
  return codes.join('') + text + RESET;
}

/**
 * Combine multiple ANSI codes into a single prefix string.
 */
export function combine(...codes: string[]): string {
  return codes.join('');
}

/**
 * Generate a 256-color foreground escape sequence.
 */
export function fg256(colorIndex: number): string {
  return `${ESC}[38;5;${colorIndex}m`;
}

/**
 * Generate a 256-color background escape sequence.
 */
export function bg256(colorIndex: number): string {
  return `${ESC}[48;5;${colorIndex}m`;
}
