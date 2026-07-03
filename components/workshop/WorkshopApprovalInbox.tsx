'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

type PendingBatch = {
  batchId: number;
  batchName: string;
  engineerSubmittedAt: string | null;
};

export function WorkshopApprovalInbox() {
  const [pending, setPending] = useState<PendingBatch[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch('/api/workshop/notifications');
        const json = (await response.json()) as {
          success: boolean;
          data?: PendingBatch[];
        };
        if (!cancelled && json.success && json.data) {
          setPending(json.data);
        }
      } catch {
        if (!cancelled) setPending([]);
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  if (pending.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <Button asChild size="sm" variant="outline" className="gap-1.5">
        <Link href={`/workshop/categorize/${pending[0]?.batchId}`}>
          <Bell className="h-3.5 w-3.5" />
          {pending.length} awaiting approval
        </Link>
      </Button>
    </div>
  );
}
