import Link from "next/link";

type BackLinkProps = {
  href: string;
  label?: string;
  variant?: "site" | "admin";
  className?: string;
};

export function BackLink({
  href,
  label = "Назад",
  variant = "site",
  className = "",
}: BackLinkProps) {
  const variantClass =
    variant === "admin"
      ? "border-white/10 bg-white/[0.035] text-white/70 hover:border-blue-500/45 hover:bg-blue-500/10 hover:text-blue-300"
      : "border-theme bg-card text-main hover:border-blue-500/45 hover:bg-blue-soft hover:text-blue-500";

  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${variantClass} ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
      <span className="sr-only">{label}</span>
    </Link>
  );
}
