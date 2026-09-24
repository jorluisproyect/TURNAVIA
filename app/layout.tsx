import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaRegister } from '@/components/PwaRegister';
import { PortraitGuard } from '@/components/PortraitGuard';

export const metadata: Metadata = {
  title:'TUCITA · Tu servicio, a tu hora',
  description:'Citas, turnos y reservas para profesionales, negocios y clientes',
  manifest:'/manifest.json',
  applicationName:'TUCITA',
  appleWebApp:{
    capable:true,
    title:'TUCITA',
    statusBarStyle:'default'
  },
  formatDetection:{telephone:false}
};

export const viewport: Viewport = { themeColor:'#0f766e' };

export default function RootLayout({children}:{children:React.ReactNode}){
  return (
    <html lang="es">
      <body>
        <PwaRegister/>
        <PortraitGuard/>
        {children}
      </body>
    </html>
  );
}
