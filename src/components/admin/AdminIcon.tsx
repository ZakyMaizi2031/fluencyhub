export function AdminIcon({ name, size = 16, color = "currentColor" }: { name: string; size?: number; color?: string }) {
  const common = { width: size, height: size, fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, style: { display: "inline-block", flexShrink: 0 } };
  
  if (name === "DollarSign") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M12 1v22" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    );
  }
  if (name === "TrendingUp") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M23 6l-9.5 9.5-5-5L1 18" />
        <path d="M17 6h6v6" />
      </svg>
    );
  }
  if (name === "Users") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <path d="M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  if (name === "Clock") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="M12 6v6l4 2" />
      </svg>
    );
  }
  if (name === "BookOpen") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    );
  }
  if (name === "Video") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M23 7l-7 5 7 5V7z" />
        <path d="M1 5h15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H1z" />
      </svg>
    );
  }

  // fallback empty svg
  return <svg {...common} viewBox="0 0 24 24" />;
}
