import Link from "next/link";

export function Brand() {
  return <Link href="/" className="brand" aria-label="Ir al inicio de TUCITA">
    <img className="brand-mark" src="/icons/tucita-brand.svg" alt="" aria-hidden="true"/>
    <span className="brand-lockup">
      <strong>TUCITA</strong>
      <small>AGENDA • PAGA • CONFIRMA</small>
    </span>
  </Link>;
}
