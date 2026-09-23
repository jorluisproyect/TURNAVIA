'use client';
import { Smartphone } from 'lucide-react';

export function PortraitGuard(){
  return <div className="portrait-guard" role="status" aria-live="polite">
    <div className="portrait-guard-card">
      <div className="portrait-phone"><Smartphone size={30}/></div>
      <strong>Usa TUCITA en vertical</strong>
      <span>Gira tu teléfono para continuar de forma más cómoda.</span>
    </div>
  </div>;
}
