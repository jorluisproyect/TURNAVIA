import Link from "next/link";
import { Route } from "lucide-react";

export function Brand() {
  return <Link href="/" className="brand" aria-label="Ir al inicio de TURNAVIA"><span className="logo"><Route size={19}/></span><span>Turnavia</span></Link>;
}
