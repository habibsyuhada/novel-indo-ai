'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/comments');
  }, [router]);

  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <span className="loading loading-spinner loading-lg"></span>
    </div>
  );
}
