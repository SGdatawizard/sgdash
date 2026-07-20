import clsx from 'clsx';
import type { Status } from '@/lib/types';
import { STATUS_LABEL, STATUS_DOT } from '@/lib/status';

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide2 text-ink/70">
      <span className={clsx('h-1.5 w-1.5 rounded-full', STATUS_DOT[status])} />
      {STATUS_LABEL[status]}
    </span>
  );
}
