'use client';

import { useEffect, useId, useState } from 'react';

/**
 * Draws a lesson's flowchart as inline SVG. Mermaid is loaded only in the
 * browser and runs with securityLevel 'strict'. A diagram that won't draw is
 * hidden: learners are better served by the text alone than by an error.
 * (Ported from iStartup's MermaidView, learner mode.)
 */
let counter = 0;

export default function MermaidView({ source, title }: { source: string; title?: string }) {
  const id = `mmd-${useId().replace(/:/g, '')}-${counter++}`;
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { default: mermaid } = await import('mermaid');
        mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'neutral', fontFamily: 'inherit' });
        await mermaid.parse(source);
        const { svg: out } = await mermaid.render(id, source);
        if (!cancelled) setSvg(out);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // id is stable for the component's life; re-render only when the source changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  if (failed) return null;
  if (!svg) return <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Drawing…</div>;
  return (
    <div
      role="img"
      aria-label={title ?? 'Diagram'}
      className="rounded-2xl border border-slate-200 bg-white p-4 overflow-auto [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
      // svg is mermaid.render() output for a sanitized flowchart (strict mode), not raw user HTML.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
