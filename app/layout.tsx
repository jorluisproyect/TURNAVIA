import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaRegister } from '@/components/PwaRegister';
import { GlobalDemoBar } from '@/components/GlobalDemoBar';
export const metadata: Metadata = { title:'Turnavia · Tu consulta, a tu hora', description:'Agenda médica inteligente', manifest:'/manifest.json' };
export const viewport: Viewport = { themeColor:'#0f766e' };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body><PwaRegister/><GlobalDemoBar/>{children}</body></html>}
