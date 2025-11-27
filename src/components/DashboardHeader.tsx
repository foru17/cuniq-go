'use client';

import Image from 'next/image';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useRouter } from 'next/navigation';

export default function DashboardHeader() {
  const router = useRouter();

  const handleLogoClick = () => {
    router.refresh();
  };

  return (
    <header className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-border">
      <div className="flex items-center gap-4">
        <div 
          className="relative w-12 h-12 overflow-hidden rounded-xl bg-primary/5 p-2 ring-1 ring-border cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleLogoClick}
          title="点击刷新页面"
        >
          <Image 
            src="/logo.svg" 
            alt="CUniq Logo" 
            width={48} 
            height={48} 
            className="w-full h-full object-contain dark:invert"
          />
        </div>

        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
            CUniq Go 月神卡 选号神器
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
           中国联通香港/内地一卡双号筛选工具
          </p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href="https://x.com/luoleiorg"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Follow on X"
          >
            <Image
              src="/x.svg"
              alt="X (Twitter)"
              width={16}
              height={16}
              className="w-4 h-4 dark:invert"
            />
          </a>
          <a
            href="https://github.com/foru17/cuniq-go"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="View on GitHub"
          >
            <Image
              src="/github.svg"
              alt="GitHub"
              width={20}
              height={20}
              className="w-5 h-5 dark:invert"
            />
          </a>
        </div>

      </div>
    </header>
  );
}
