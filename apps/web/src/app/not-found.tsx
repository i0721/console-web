'use client';

import { StateSurface } from '@community-go/ui-adapter/state-surface';
import { FileQuestion } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { proceedAfterLeaveConfirm } from '../host/leave-confirm';

export default function NotFoundPage() {
  const router = useRouter();
  return (
    <StateSurface
      actionLabel="返回工作台"
      description="当前地址没有对应页面，请从侧边栏选择有效入口。"
      icon={<FileQuestion className="size-5" />}
      state="empty"
      title="404 Not Found"
      onAction={() => {
        void proceedAfterLeaveConfirm('/').then((proceed) => {
          if (proceed) void router.replace('/');
        });
      }}
    />
  );
}
