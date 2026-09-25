import React from "react";
import { Svg, Path, Circle, Rect, Polyline, Polygon } from "@react-pdf/renderer";

interface IconProps {
  size?: number;
  color?: string;
}

/**
 * Native vector SVG Location Pin icon for @react-pdf/renderer.
 * Eliminates all emoji font corruption, zero-width byte errors, and text overlap.
 */
export function PinIcon({ size = 10, color = "#0D9488" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"
        fill={color}
      />
    </Svg>
  );
}

/**
 * Native vector SVG Clock / Duration icon.
 */
export function ClockIcon({ size = 10, color = "#64748B" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" fill="none" />
      <Polyline points="12 7 12 12 15 15" stroke={color} strokeWidth="2" fill="none" />
    </Svg>
  );
}

/**
 * Native vector SVG Lightbulb / Tip icon.
 */
export function LightbulbIcon({ size = 10, color = "#0D9488" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M9 21h6m-5 3h4m-7-9.5a6.5 6.5 0 1 1 10 0c-.8 1-1.5 2.5-1.5 3.5h-7c0-1-.7-2.5-1.5-3.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/**
 * Native vector SVG Calendar icon.
 */
export function CalendarIcon({ size = 10, color = "#0D9488" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" fill="none" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Native vector SVG Compass icon (Wander.AI brand).
 */
export function CompassIcon({ size = 12, color = "#0D9488" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
      <Polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={color} />
    </Svg>
  );
}

/**
 * Native vector SVG Wallet / Currency icon.
 */
export function WalletIcon({ size = 10, color = "#0D9488" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <Path d="M16 3H4a2 2 0 0 0-2 2v2h18V5a2 2 0 0 0-2-2z" stroke={color} strokeWidth="2" fill="none" />
      <Circle cx="16" cy="14" r="1.5" fill={color} />
    </Svg>
  );
}

/**
 * Native vector SVG Checkmark icon.
 */
export function CheckIcon({ size = 10, color = "#0D9488" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

/**
 * Strips raw emojis and unmapped unicode symbols that cause standard Helvetica font in
 * @react-pdf/renderer to fail with zero-width byte errors and character overlap artifacts.
 */
export function sanitizePDFText(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}]/gu,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}
