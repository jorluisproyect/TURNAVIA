import Link from "next/link";

export function Brand() {
  return <Link href="/" className="brand" aria-label="Ir al inicio de TUCITA">
    <svg className="brand-mark" viewBox="0 0 72 64" role="img" aria-label="TUCITA">
      <path d="M7 14H31M19 14V50" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M65 20c-4-4-9-6-14-6-10 0-18 8-18 18s8 18 18 18c5 0 10-2 14-6" fill="none" stroke="#7ED9C7" strokeWidth="8" strokeLinecap="round"/>
    </svg>
    <span className="brand-lockup"><strong>TUCITA</strong><small>Tu tiempo tiene su lugar.</small></span>
  </Link>;
}
