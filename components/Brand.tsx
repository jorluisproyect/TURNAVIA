import Link from "next/link";
import { Route } from "lucide-react";

export function Brand() {
  return <Link href="/" className="brand" aria-label="Ir al inicio de TUCITA"><span className="logo"><Route size={19}/></span><span>TUCITA</span></Link>;
}
