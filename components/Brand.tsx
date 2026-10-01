import Link from "next/link";

export function Brand() {
  return <Link href="/" className="brand" aria-label="Ir al inicio de TUCITA">
    <svg className="brand-mark" viewBox="0 0 72 64" role="img" aria-label="TUCITA">
      <path d="M9 10h25c4 0 7 3 7 7s-3 7-7 7H23v22" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M48 23c-8 0-14 6-14 15s6 15 14 15h13" fill="none" stroke="#7ED9C7" strokeWidth="8" strokeLinecap="round"/>
      <path d="M19 47h35M22 47l-5 9M50 47l5 9" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
    </svg>
    <span className="brand-lockup"><strong>TUCITA</strong><small>Tu tiempo tiene su lugar.</small></span>
  </Link>;
}
