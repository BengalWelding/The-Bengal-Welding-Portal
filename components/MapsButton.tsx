import React from 'react';

/** Build a Google Maps directions URL from an address (+ optional postcode), or null if there's nothing usable. */
export function addressToMapsHref(address: string | null | undefined, postcode?: string | null): string | null {
  const query = [address, postcode]
    .map((p) => (p ?? '').trim())
    .filter(Boolean)
    .join(', ')
    .trim();
  if (!query) return null;
  // api=1 directions link: opens the Google Maps app on mobile, the website on desktop.
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

type MapsButtonProps = {
  address: string | null | undefined;
  postcode?: string | null;
  /** Smaller control for dense tables */
  size?: 'sm' | 'md';
  className?: string;
  /** Use on table rows so clicking directions does not select the row */
  stopPropagation?: boolean;
};

/**
 * Quick-directions control: opens Google Maps directions to the site address.
 * Mirrors PhoneCallButton so it sits naturally next to the call button.
 */
export default function MapsButton({
  address,
  postcode,
  size = 'md',
  className = '',
  stopPropagation,
}: MapsButtonProps) {
  const href = addressToMapsHref(address, postcode);
  if (!href) return null;

  const sizeCls = size === 'sm' ? 'w-7 h-7 min-w-[1.75rem]' : 'w-8 h-8 min-w-[2rem]';
  const iconCls = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const label = `Directions to ${[address, postcode].map((p) => (p ?? '').trim()).filter(Boolean).join(', ')}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
      className={`inline-flex items-center justify-center rounded-lg border border-[#333333] bg-[#111111] text-[#F2C200] hover:bg-[#F2C200] hover:text-black hover:border-[#F2C200] transition-colors shrink-0 ${sizeCls} ${className}`}
      title={label}
      aria-label={label}
    >
      <i className={`fas fa-location-dot ${iconCls}`} />
    </a>
  );
}
