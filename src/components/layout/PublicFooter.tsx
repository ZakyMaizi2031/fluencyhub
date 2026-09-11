export function PublicFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--border)] bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-[var(--text-3)] md:flex-row md:justify-between">
        <p>© {new Date().getFullYear()} FluencyHub. Applied English for STEM.</p>
        <p>No staff links on this site.</p>
      </div>
    </footer>
  );
}
