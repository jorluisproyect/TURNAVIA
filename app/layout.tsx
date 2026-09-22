import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaRegister } from '@/components/PwaRegister';

export const metadata: Metadata = {
  title:'TUCITA · Tu servicio, a tu hora',
  description:'Citas, turnos y reservas para profesionales, negocios y clientes',
  manifest:'/manifest.json'
};

export const viewport: Viewport = { themeColor:'#0f766e' };

export default function RootLayout({children}:{children:React.ReactNode}){
  return (
    <html lang="es">
      <body>
        <PwaRegister/>
        {children}
      </body>
    </html>
  );
}
