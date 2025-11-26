import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://cuniq.zuoluo.tv'),
  title: {
    default: 'CUniq Go 月神卡 选号神器 - 香港联通一卡双号筛选工具',
    template: '%s | CUniq Go',
  },
  description: 'CUniq月神卡选号神器，专为靓号爱好者打造。HK$9/月低成本持有香港+852与内地+86一卡双号，支持实体卡/eSIM。本工具支持多维度靓号筛选（AABB/ABAB/连号/尾号过滤），每15分钟自动同步官网数据，比手动刷号更高效。',
  keywords: ['CUniq', '月神卡', '香港联通', '一卡双号', '靓号', 'eSIM', '852号码', '86号码', '选号工具', 'AABB', '连号', 'HK$9套餐', '无押金'],
  authors: [{ name: 'Luo Lei', url: 'https://luolei.org' }],
  creator: 'Luo Lei',
  publisher: 'Luo Lei',
  openGraph: {
    title: 'CUniq Go 月神卡 选号神器 - HK$9/月 一卡双号',
    description: 'HK$9/月低成本持有香港+852与内地+86一卡双号。支持AABB/连号/尾号过滤等多种靓号筛选，数据实时同步。',
    url: 'https://cuniq.zuoluo.tv',
    siteName: 'CUniq Go',
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CUniq Go 月神卡 选号神器 - HK$9/月 一卡双号',
    description: 'HK$9/月低成本持有香港+852与内地+86一卡双号。支持AABB/连号/尾号过滤等多种靓号筛选。',
    creator: '@luoleiorg',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.variable}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {process.env.NEXT_PUBLIC_GA_ID && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
          )}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
