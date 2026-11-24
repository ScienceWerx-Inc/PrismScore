'use client';

import React, { useId } from 'react';

/** Shared faceted 3D violet prism logo icon used in header, footer, and report preview. */
export function PrismBrandMark({ className = 'w-10 h-8' }: { className?: string }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 44 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`prismLeftTop-${uid}`} x1="22" y1="3" x2="10" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#b197fc" />
        </linearGradient>
        <linearGradient id={`prismLeftBottom-${uid}`} x1="3" y1="33" x2="22" y2="23" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id={`prismRight-${uid}`} x1="22" y1="3" x2="41" y2="33" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5b3df5" />
          <stop offset="100%" stopColor="#3b1d9e" />
        </linearGradient>
      </defs>
      {/* Left-top bright lavender refracting facet */}
      <polygon points="22,3 3,33 22,23" fill={`url(#prismLeftTop-${uid})`} />
      {/* Lower-left deeper violet base facet */}
      <polygon points="3,33 41,33 22,23" fill={`url(#prismLeftBottom-${uid})`} />
      {/* Right rich indigo-purple shadow facet */}
      <polygon points="22,3 41,33 22,23" fill={`url(#prismRight-${uid})`} />
      {/* Crisp white inner prism ridge */}
      <path
        d="M22 3L22 23M22 23L3 33M22 23L41 33M22 3L3 33L41 33L22 3Z"
        stroke="rgba(255,255,255,0.42)"
        strokeWidth="1.15"
        strokeLinejoin="round"
      />
    </svg>
  );
}

