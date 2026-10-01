import Link from "next/link";

export function Brand() {
  return <Link href="/" className="brand" aria-label="Ir al inicio de TUCITA">
    <svg className="brand-mark" viewBox="0 0 64 64" role="img" aria-label="TUCITA">
      <path d="M12 10h26c4 0 7 3 7 7s-3 7-7 7H27v22" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M42 24c-8 0-14 6-14 14s6 14 14 14h10" fill="none" stroke="#7ED9C7" strokeWidth="8" strokeLinecap="round"/>
      <path d="M20 47h27M23 47l-5 9M44 47l5 9" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
    </svg>
    <span className="brand-lockup"><strong>TUCITA</strong><small>Tu tiempo tiene su lugar.</small></span>
  </Link>;
}
