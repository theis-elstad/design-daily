export function RocketIconPaths() {
  return (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Rocket body */}
      <path d="M20 4C20 4 28 12 28 22C28 26 24 30 20 30C16 30 12 26 12 22C12 12 20 4 20 4Z" />
      {/* Window */}
      <circle cx="20" cy="17" r="3" />
      {/* Left fin */}
      <path d="M12 24L7 30L12 28" />
      {/* Right fin */}
      <path d="M28 24L33 30L28 28" />
      {/* Exhaust */}
      <path d="M17 30L16 36L20 33L24 36L23 30" />
    </g>
  )
}

export function DavidIconPaths() {
  return (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Hair */}
      <path d="M14 14C12 12 13 8 16 6C17 5 19 4 20 4C21 4 23 5 24 6C27 8 28 12 26 14" />
      {/* Head */}
      <path d="M14 18C14 10 17 4 20 4C23 4 26 10 26 18" />
      {/* Jaw */}
      <path d="M14 18C14 22 16 26 20 27C24 26 26 22 26 18" />
      {/* Neck */}
      <path d="M17 27L16 34" />
      <path d="M23 27L24 34" />
      {/* Shoulders */}
      <path d="M16 34C14 35 8 37 6 40L6 46" />
      <path d="M24 34C26 35 32 37 34 40L34 46" />
      {/* Base */}
      <path d="M4 46L36 46" />
    </g>
  )
}
