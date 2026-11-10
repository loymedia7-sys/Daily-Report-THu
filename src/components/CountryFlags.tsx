import React from 'react';

/**
 * Authentic Kingdom of Cambodia Flag
 * Blue, Red, Blue horizontal stripes with the Angkor Wat temple silhouette
 */
export const CambodiaFlag: React.FC<{ className?: string }> = ({ className = "w-5 h-3.5" }) => (
  <svg 
    className={`${className} inline-block shrink-0 rounded-xs shadow-2xs`} 
    viewBox="0 0 640 480" 
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Cambodia Flag"
  >
    <g fillRule="evenodd">
      <path fill="#032ea1" d="M0 0h640v480H0z"/>
      <path fill="#e00025" d="M0 120h640v240H0z"/>
      {/* Angkor Wat white emblem */}
      <g fill="#ffffff">
        <path d="M192 336h256v14H192zm16-24h224v14H208zm8-64h16v56h-16zm40 0h16v56h-16zm48 0h16v56h-16zm48 0h16v56h-16zm48 0h16v56h-16zm-176 8h16v40h-16zm208 0h16v40h-16z"/>
        <path d="M296 172l24-42 24 42v150h-48zm-88 56l20-36 20 36v100h-40zm176 0l20-36 20 36v100h-40z"/>
      </g>
    </g>
  </svg>
);

/**
 * Authentic United States Flag / English Flag
 */
export const USAFlag: React.FC<{ className?: string }> = ({ className = "w-5 h-3.5" }) => (
  <svg 
    className={`${className} inline-block shrink-0 rounded-xs shadow-2xs`} 
    viewBox="0 0 640 480" 
    xmlns="http://www.w3.org/2000/svg"
    aria-label="USA Flag"
  >
    <g fillRule="evenodd">
      <path fill="#bd3d44" d="M0 0h640v480H0z"/>
      <path stroke="#fff" strokeWidth="37" d="M0 55.5h640M0 129.5h640M0 203.5h640M0 277.5h640M0 351.5h640M0 425.5h640"/>
      <path fill="#192f5d" d="M0 0h260v258.5H0z"/>
      {/* Star Grid */}
      <g fill="#fff">
        <circle cx="28" cy="26" r="6"/>
        <circle cx="68" cy="26" r="6"/>
        <circle cx="108" cy="26" r="6"/>
        <circle cx="148" cy="26" r="6"/>
        <circle cx="188" cy="26" r="6"/>
        <circle cx="228" cy="26" r="6"/>
        <circle cx="48" cy="52" r="6"/>
        <circle cx="88" cy="52" r="6"/>
        <circle cx="128" cy="52" r="6"/>
        <circle cx="168" cy="52" r="6"/>
        <circle cx="208" cy="52" r="6"/>
        <circle cx="28" cy="78" r="6"/>
        <circle cx="68" cy="78" r="6"/>
        <circle cx="108" cy="78" r="6"/>
        <circle cx="148" cy="78" r="6"/>
        <circle cx="188" cy="78" r="6"/>
        <circle cx="228" cy="78" r="6"/>
        <circle cx="48" cy="104" r="6"/>
        <circle cx="88" cy="104" r="6"/>
        <circle cx="128" cy="104" r="6"/>
        <circle cx="168" cy="104" r="6"/>
        <circle cx="208" cy="104" r="6"/>
        <circle cx="28" cy="130" r="6"/>
        <circle cx="68" cy="130" r="6"/>
        <circle cx="108" cy="130" r="6"/>
        <circle cx="148" cy="130" r="6"/>
        <circle cx="188" cy="130" r="6"/>
        <circle cx="228" cy="130" r="6"/>
        <circle cx="48" cy="156" r="6"/>
        <circle cx="88" cy="156" r="6"/>
        <circle cx="128" cy="156" r="6"/>
        <circle cx="168" cy="156" r="6"/>
        <circle cx="208" cy="156" r="6"/>
        <circle cx="28" cy="182" r="6"/>
        <circle cx="68" cy="182" r="6"/>
        <circle cx="108" cy="182" r="6"/>
        <circle cx="148" cy="182" r="6"/>
        <circle cx="188" cy="182" r="6"/>
        <circle cx="228" cy="182" r="6"/>
        <circle cx="48" cy="208" r="6"/>
        <circle cx="88" cy="208" r="6"/>
        <circle cx="128" cy="208" r="6"/>
        <circle cx="168" cy="208" r="6"/>
        <circle cx="208" cy="208" r="6"/>
        <circle cx="28" cy="234" r="6"/>
        <circle cx="68" cy="234" r="6"/>
        <circle cx="108" cy="234" r="6"/>
        <circle cx="148" cy="234" r="6"/>
        <circle cx="188" cy="234" r="6"/>
        <circle cx="228" cy="234" r="6"/>
      </g>
    </g>
  </svg>
);
