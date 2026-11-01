export function placeholderImage(label: string, background = "#1E3A5F") {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="560" viewBox="0 0 800 560">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${background}"/>
          <stop offset="100%" stop-color="#0F172A"/>
        </linearGradient>
      </defs>
      <rect width="800" height="560" fill="url(#g)"/>
      <circle cx="640" cy="-20" r="180" fill="rgba(255,255,255,0.08)"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        fill="white" font-family="Georgia, serif" font-size="36" font-weight="600">${label}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
