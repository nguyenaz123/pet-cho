"use client";

import Notice from "@/components/ui/Notice";

export default function SetupNotice({ missing }: { missing: string[] }) {
  return (
    <Notice title="Setup needed">
      <p className="mb-4 text-muted">These server env vars are missing:</p>
      <ul className="mb-4 list-disc space-y-1 pl-5 font-mono text-[14px]">
        {missing.map((key) => (
          <li key={key}>{key}</li>
        ))}
      </ul>
      <ol className="list-decimal space-y-2 pl-5">
        <li>Copy .env.local.example to .env.local and fill it in</li>
        <li>Run npm run db:migrate</li>
        <li>Restart npm run dev</li>
      </ol>
    </Notice>
  );
}
