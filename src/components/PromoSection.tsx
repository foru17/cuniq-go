import TotalCount from '@/components/TotalCount';
import StoreCtaLink from '@/components/StoreCtaLink';
import { getCarrier } from '@/lib/carrier';

type PromoSectionProps = {
  totalCount: number;
  lastUpdated: number;
};

const carrier = getCarrier();

function PromoCopy() {
  if (carrier.id === 'cmhk') {
    return (
      <div className="min-w-0 flex-1 space-y-2.5">
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          <span className="bg-linear-to-r from-sky-600 to-blue-600 bg-clip-text font-extrabold text-transparent dark:from-sky-400 dark:to-blue-400">
            CMHK 选号神器
          </span>
          ：一站式筛选中国移动香港官网在售
          <strong className="font-semibold text-foreground">香港 +852</strong>
          {' '}号码，支持普通号池与
          <strong className="font-semibold text-foreground"> C/D 级靓号 </strong>
          分开浏览。
        </p>

        <p className="text-[15px] leading-relaxed text-muted-foreground">
          数据来自中国移动香港官网公开选号接口，
          <strong className="font-semibold text-foreground">每 15 分钟自动同步并逐号复核在售状态</strong>
          。本站为第三方筛选工具，与中国移动香港无关联，号码可用性以
          <a
            href={carrier.storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            {' '}官网{' '}
          </a>
          实际下单为准。
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1 space-y-2.5">
      <p className="text-[15px] leading-relaxed text-muted-foreground">
        <span className="bg-linear-to-r from-violet-600 to-indigo-600 bg-clip-text font-extrabold text-transparent dark:from-violet-400 dark:to-indigo-400">
          CUniq Go 月神卡
        </span>
        ：低成本持有
        <strong className="font-semibold text-foreground">香港 +852</strong>
        {' '}与{' '}
        <strong className="font-semibold text-foreground">内地 +86</strong>
        {' '}双号，支持海外手机
        <strong className="font-semibold text-foreground"> eSIM </strong>
        激活。
      </p>

      <p className="text-[15px] leading-relaxed text-muted-foreground">
        本项目已在
        <a
          href="https://github.com/foru17/cuniq-go"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          {' '}GitHub 开源
        </a>
        ，数据源来自 CUniq 官网公开渠道，
        <strong className="font-semibold text-foreground">每 15 分钟自动同步</strong>
        ，助您发现心仪靓号。
      </p>
    </div>
  );
}

export default function PromoSection({ totalCount, lastUpdated }: PromoSectionProps) {
  return (
    <div className="flex w-full flex-col items-stretch gap-6 xl:flex-row">
      {/* Promo Module */}
      <div className="flex min-h-[140px] flex-1 flex-col justify-center rounded-2xl border border-border bg-card/40 p-6 shadow-sm">
        <div className="flex h-full flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <PromoCopy />

          <div className="shrink-0 self-center">
            <StoreCtaLink placement="promo" />
          </div>
        </div>
      </div>

      {/* Total Count Module */}
      <div className="w-full shrink-0 xl:w-[200px]">
        <TotalCount count={totalCount} lastUpdated={lastUpdated} />
      </div>
    </div>
  );
}
