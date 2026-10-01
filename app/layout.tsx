import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaRegister } from '@/components/PwaRegister';
import { PortraitGuard } from '@/components/PortraitGuard';
import { SupportFloating } from '@/components/SupportFloating';

export const metadata: Metadata = {
  title:'TUCITA · Agenda, paga y confirma',
  description:'Agenda, paga y confirma citas con profesionales y negocios desde un solo lugar.',
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
