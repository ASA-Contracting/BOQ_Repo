type IconProps = { className?: string };

export function IconSearch({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" focusable="false" aria-hidden="true">
      <path
        d="M8.7 3.5a5.2 5.2 0 1 1 0 10.4 5.2 5.2 0 0 1 0-10.4Zm0 1.4a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Zm4.24 7.26 3.1 3.1a.7.7 0 0 1-.99.99l-3.1-3.1a.7.7 0 0 1 .99-.99Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconClear({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M4.28 3.22 8 6.94l3.72-3.72a.75.75 0 1 1 1.06 1.06L9.06 8l3.72 3.72a.75.75 0 1 1-1.06 1.06L8 9.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06L6.94 8 3.22 4.28a.75.75 0 0 1 1.06-1.06Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconFilter({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M3 4.25h10M4.8 8h6.4M6.7 11.75h2.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconParentTrail({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M4 3.5v7A2.5 2.5 0 0 0 6.5 13H12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 7.5h7" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
      <circle cx="4" cy="3" r="1.35" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="12" cy="7.5" r="1.35" fill="none" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

export function IconExpandAll({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M4 6 8 9.8 12 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconCollapseAll({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M4 10 8 6.2 12 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconBookmarkStar({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M4.5 2.75h7l.55 2.2 2.2.55-2.2.55-.55 2.2-2.2-.55-2.2.55.55-2.2-2.2-.55 2.2-.55.55-2.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconArchive({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M3 4.5h10v1.5H3V4.5Zm1.5 3h7v5h-7v-5Zm1.5 1v3h4v-3h-4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconBoxSeam({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M2.5 5.5 8 2.75 13.5 5.5V10.5L8 13.25 2.5 10.5V5.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M8 2.75v10.5M2.5 5.5 8 8.25l5.5-2.75" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function IconCashCoin({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="4.75" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 5.75v4.5M6.25 8h3.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function IconTag({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M3.5 3.5h4.2l5.3 5.3-4.2 4.2-5.3-5.3V3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="6.1" cy="6.1" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function IconNodePlus({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M4 3.5v7A2.5 2.5 0 0 0 6.5 13H12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M4 7.5h7M8 4.5v6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconUpload({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M8 10V3.5M5.5 6 8 3.5 10.5 6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M3.5 12.5h9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconDownload({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M8 3.5v6.5M5.5 7 8 9.5 10.5 7" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M3.5 12.5h9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconPlus({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M8 3.5v9M3.5 8h9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconPen({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M10.5 3.5 12.5 5.5 5.5 12.5H3.5v-2l7-7Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

export function IconX({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M4.5 4.5l7 7m0-7-7 7" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconBranchCount({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 3.5v7A2.5 2.5 0 0 0 6.5 13H12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 7.5h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="4" cy="3" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="7.5" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="13" r="1.6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
