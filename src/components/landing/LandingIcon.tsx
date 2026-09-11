export function LandingIcon({ name, color = "currentColor" }: { name: string; color?: string }) {
  const common = { width: 20, height: 20, fill: "none", stroke: color, strokeWidth: 1.8 };
  if (name === "Play") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={color}>
        <path d="M8 5v14l11-7z" />
      </svg>
    );
  }
  return (
    <svg {...common} viewBox="0 0 24 24">
      {name === "Brain" ? <path d="M12 4a4 4 0 0 0-4 4v1a3 3 0 0 0-2 2.5V15a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-3.5A3 3 0 0 0 16 9V8a4 4 0 0 0-4-4z" /> : null}
      {name === "MessageSquareOff" ? (
        <>
          <path d="M4 4l16 16" />
          <path d="M8 8H6a2 2 0 0 0-2 2v7l3-2h7" />
        </>
      ) : null}
      {name === "BookOpen" ? <path d="M4 6c4-2 8-2 8 0v13c0-2-4-2-8 0V6zm8 0c4-2 8-2 8 0v13c0-2-4-2-8 0V6z" /> : null}
      {name === "Video" ? <path d="M4 7h10v10H4zM14 11l6-3v8l-6-3z" /> : null}
      {name === "Users" ? <path d="M9 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm8 0a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 17 11zM4 19a5 5 0 0 1 10 0M15 19a4 4 0 0 1 6 0" /> : null}
      {name === "Building2" ? <path d="M4 20V6h8v14M12 10h8v10M7 20v-3M16 20v-3M7 10h2M7 14h2" /> : null}
      {name === "Target" ? <path d="M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9zm0-4a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0-4a1 1 0 1 0-1-1 1 1 0 0 0 1 1z" /> : null}
      {name === "TrendingUp" ? <path d="M4 17l6-6 4 4 6-8M14 7h6v6" /> : null}
      {name === "ArrowRight" ? <path d="M5 12h14M13 6l6 6-6 6" /> : null}
      {name === "MessageCircle" ? <path d="M21 12a8 8 0 0 1-11 7L4 20l1-5a8 8 0 1 1 16-3z" /> : null}
      {name === "LogIn" ? <path d="M10 17l5-5-5-5M15 12H3M21 21V3h-8" /> : null}
    </svg>
  );
}
