import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { PwaRegister } from '@/components/PwaRegister';
import { GlobalDemoBar } from '@/components/GlobalDemoBar';

export const metadata: Metadata = {
  title:'Turnavia · Tu servicio, a tu hora',
  description:'Citas, turnos y reservas para profesionales, negocios y clientes',
  manifest:'/manifest.json'
};

export const viewport: Viewport = { themeColor:'#0f766e' };

export default function RootLayout({children}:{children:React.ReactNode}){
  return (
    <html lang="es">
      <body>
        <PwaRegister/>
        <Suspense fallback={null}>
          <GlobalDemoBar/>
        </Suspense>
        {children}
      </body>
    </html>
  );
}
