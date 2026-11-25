'use client';

import { useEffect, useState } from 'react';
import { Award, ExternalLink, Link2, MailCheck } from 'lucide-react';
import type { PeersResponse } from '@/lib/connect/types';

const STATUS_STYLE: Record<string, string> = {
  VALID: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  EXPIRED: 'text-amber-800 bg-amber-50 border-amber-200',
  REVOKED: 'text-rose-700 bg-rose-50 border-rose-200',
};

/**
 * "Connected apps": the signed-in person's results from other ScienceWerx apps,
 * fetched server-side by /api/connect/peers. Renders nothing when there is
 * nothing to show (signed out, no peers configured, peers down, no account there).
 */
export default function ConnectedApps() {
  const [data, setData] = useState<PeersResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/connect/peers')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData(null));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) return null;

  if (data.needsVerification) {
    return (
      <section aria-label="Connected apps" className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center gap-3 text-sm text-slate-600">
        <MailCheck className="w-5 h-5 text-brand-600 shrink-0" />
        Verify your email to see your results from other ScienceWerx apps.
      </section>
    );
  }

  if (data.cards.length === 0 && data.certificates.length === 0) return null;

  return (
    <section aria-labelledby="connected-apps-heading" className="space-y-4">
      <h2 id="connected-apps-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2">
        <Link2 className="w-5 h-5 text-brand-600" /> Connected apps
      </h2>

      {data.cards.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.cards.map((card) => (
            <div key={`${card.app}-${card.title}`} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{card.appName}</div>
              <div className="text-base font-bold text-slate-900 mt-1">{card.title}</div>
              <div className="text-sm font-semibold text-brand-700 mt-1">{card.headline}</div>
              {card.lines.length > 0 && (
                <dl className="mt-3 space-y-1 text-xs">
                  {card.lines.map((line, i) => (
                    <div key={i} className="flex justify-between gap-3">
                      <dt className="text-slate-500">{line.label}</dt>
                      <dd className="text-slate-800 font-medium text-right">{line.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <a
                href={card.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-800 self-start"
              >
                Open in {card.appName} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      )}

      {data.certificates.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-brand-600" /> Your certificates
          </h3>
          <ul className="mt-3 divide-y divide-slate-100">
            {data.certificates.map((cert) => (
              <li key={`${cert.app}-${cert.code}`} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{cert.title}</div>
                  <div className="text-xs text-slate-500">{cert.issuer} · {cert.appName}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[11px] font-bold border rounded-full px-2 py-0.5 ${STATUS_STYLE[cert.status] ?? ''}`}>
                    {cert.status}
                  </span>
                  <a
                    href={cert.verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1"
                  >
                    Verify <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
