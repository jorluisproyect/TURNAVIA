import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaRegister } from '@/components/PwaRegister';
import { PortraitGuard } from '@/components/PortraitGuard';
import { SupportFloating } from '@/components/SupportFloating';

export const metadata: Metadata = {
  title:'TUCITA · Tu tiempo tiene su lugar',
  description:'Reserva, asegura y gestiona citas para profesionales, negocios y clientes.',
  manifest:'/manifest.json',
  applicationName:'TUCITA',
  appleWebApp:{
    capable:true,
    title:'TUCITA',
    statusBarStyle:'default'
  },
  formatDetection:{telephone:false},
  icons:{icon:'/icons/tucita-brand.svg',apple:'/icons/icon-192.png'}
};

export const viewport: Viewport = { themeColor:'#0f766e' };

export default function RootLayout({children}:{children:React.ReactNode}){
  return (
    <html lang="es">
      <body>
        <PwaRegister/>
        <PortraitGuard/>
        {children}
        <SupportFloating/>
      </body>
    </html>
  );
}
