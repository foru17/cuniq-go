import TotalCount from '@/components/TotalCount';

type PromoSectionProps = {
  totalCount: number;
  lastUpdated: number;
};

export default function PromoSection({ totalCount, lastUpdated }: PromoSectionProps) {
  return (
    <div className="flex flex-col xl:flex-row gap-6 items-stretch">
      {/* Promo Module */}
      <div className="flex-1 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-6 shadow-sm flex flex-col justify-center min-h-[140px]">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between h-full">
          <div className="space-y-3 flex-1 min-w-0">
            {/* 第一段 */}
            <p className="text-base text-muted-foreground leading-relaxed xl:whitespace-nowrap xl:overflow-hidden xl:text-ellipsis">
              {/* CUniq Go 月神卡：暗色模式调整为更亮的紫罗兰/靛蓝 */}
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent font-extrabold">
                CUniq Go 月神卡
              </span>
              {' '}: {/* 低成本：暗色模式调整为更亮的琥珀金/橙色 */}
              <span className="bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-300 dark:to-orange-400 bg-clip-text text-transparent font-bold">
                低成本
              </span>
              持有{' '}
              {/* 香港：暗色模式调整为更亮的紫红/紫色 */}
              <span className="bg-gradient-to-r from-fuchsia-600 to-purple-600 dark:from-fuchsia-400 dark:to-purple-400 bg-clip-text text-transparent font-bold">
                香港 +852
              </span>
              {' '}与{' '}
              {/* 内地：暗色模式调整为更亮的亮红/玫瑰红 */}
              <span className="bg-gradient-to-r from-red-500 to-rose-600 dark:from-red-400 dark:to-rose-400 bg-clip-text text-transparent font-bold">
                内地 +86
              </span>
              {' '}双号，支持海外手机{' '}
              {/* eSIM：暗色模式调整为更亮的青/蓝，更有科技感 */}
              <span className="bg-gradient-to-r from-cyan-500 to-blue-500 dark:from-cyan-300 dark:to-blue-400 bg-clip-text text-transparent font-bold">
                eSIM
              </span>
              {' '}激活。
            </p>

            {/* 第二段 */}
            <p className="text-base text-muted-foreground leading-relaxed xl:whitespace-nowrap xl:overflow-hidden xl:text-ellipsis">
              本项目已在
              {/* 优化了 GitHub 链接的结构，增加了安全属性 rel="noopener noreferrer"，并微调了 hover 效果 */}
              <a
                href="https://github.com/foru17/cuniq-go"
                target='_blank'
                rel="noopener noreferrer"
                className="font-semibold text-foreground decoration-slate-400/50 dark:decoration-slate-600/50 underline-offset-4 hover:underline hover:text-primary transition-colors cursor-pointer"
              > GitHub 开源
              </a>
              ，数据源来自 CUniq 官网公开渠道，
              {/* 更新频率：暗色模式调整为更亮的荧光绿/青绿 */}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-300 dark:to-teal-400 bg-clip-text text-transparent font-bold">
                每 15 分钟自动同步
              </span>
              ，助您发现心仪靓号。
            </p>
          </div>
          <div className="flex-shrink-0 self-center">
            <a
              href="https://store.cuniq.com/tc/services-plan/cuniq-go/cuniq-go-monthly"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-gradient-to-r from-red-400 to-rose-500 dark:from-red-700 dark:to-rose-900 text-primary-foreground dark:text-white font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow-md active:scale-95 whitespace-nowrap"
            >
              CUniq 网上商城-月神卡 
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Total Count Module */}
      <div className="w-full xl:w-[200px] flex-shrink-0">
        <TotalCount count={totalCount} lastUpdated={lastUpdated} />
      </div>
    </div>
  );
}
