'use client';

import { useCallback, useEffect, useState } from 'react';
import { Award, Copy, Check, Users, UserMinus } from 'lucide-react';

interface TeamData {
  shared: boolean;
  ready: boolean;
  learners: { userId: string; name: string; email: string; role: string; percent: number; grade: { percent: number; letter: string } | null; certificateCode: string | null }[];
  pendingInvites: { id: string; email: string }[];
  membersNotEnrolled: number;
}

/** The admin's "share the company course with the team" panel on the course page. */
export default function TeamPanel({ courseId }: { courseId: string }) {
  const [team, setTeam] = useState<TeamData | null>(null);
  const [emails, setEmails] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [links, setLinks] = useState<{ email: string; link: string; emailed: boolean }[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/courses/${courseId}/team`);
    if (res.ok) setTeam(await res.json());
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  const share = async (body: { emails?: string[]; everyone?: boolean }) => {
    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/courses/${courseId}/team`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMessage(data.error || 'Could not share the course.');
      return;
    }
    setLinks(data.invited ?? []);
    const parts = [];
    if (data.enrolled) parts.push(`${data.enrolled} member${data.enrolled === 1 ? '' : 's'} added`);
    if (data.invited?.length) parts.push(`${data.invited.length} invited`);
    if (data.alreadyElsewhere?.length) parts.push(`${data.alreadyElsewhere.length} skipped (account in another company)`);
    setMessage(parts.length ? parts.join(' · ') : 'Nobody new to add.');
    setEmails('');
    load();
  };

  const remove = async (userId: string) => {
    if (!confirm('Remove this person from the course? Their progress is kept, but they lose access.')) return;
    await fetch(`/api/courses/${courseId}/team`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    load();
  };

  if (!team || !team.ready) return null;
  const list = emails.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean);

  return (
    <section className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
      <div>
        <h2 className="font-bold text-slate-900 flex items-center gap-2"><Users className="w-5 h-5 text-brand-600" /> Share with your team</h2>
        <p className="text-xs text-slate-500 mt-1">
          Everyone you add takes this course on their own: their own progress, quizzes and certificate. You see how far each person is,
          never their answers.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="team-emails" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Work emails</label>
        <textarea
          id="team-emails"
          rows={2}
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          placeholder="name@company.com, another@company.com"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || list.length === 0}
            onClick={() => share({ emails: list })}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50"
          >
            Invite {list.length > 1 ? `${list.length} people` : ''}
          </button>
          {team.membersNotEnrolled > 0 && (
            <button
              type="button"
              disabled={busy}
              onClick={() => share({ everyone: true })}
              className="px-4 py-2 rounded-xl text-sm font-bold border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
            >
              Add everyone already in {team.membersNotEnrolled === 1 ? 'the company (1)' : `the company (${team.membersNotEnrolled})`}
            </button>
          )}
        </div>
        {message && <p className="text-sm text-slate-700">{message}</p>}
        {links.length > 0 && (
          <ul className="space-y-1 text-xs">
            {links.map((l) => (
              <li key={l.email} className="flex items-center gap-2">
                <span className="text-slate-700">{l.email}</span>
                <span className="text-slate-500">{l.emailed ? '· emailed' : '· email not sent, share the link yourself'}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(l.link);
                    setCopied(l.email);
                    setTimeout(() => setCopied(null), 1500);
                  }}
                  className="ml-auto inline-flex items-center gap-1 text-brand-700 font-semibold"
                >
                  {copied === l.email ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} Copy link
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {(team.learners.length > 0 || team.pendingInvites.length > 0) && (
        <ul className="divide-y divide-slate-100 border-t border-slate-100">
          {team.learners.map((l) => (
            <li key={l.userId} className="py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="font-semibold text-slate-900 min-w-[10rem]">{l.name}</span>
              <span className="text-slate-500">{l.role}</span>
              <span className="text-slate-700">{l.percent}%{l.grade ? ` · grade ${l.grade.letter}` : ''}</span>
              {l.certificateCode && (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold"><Award className="w-4 h-4" /> {l.certificateCode}</span>
              )}
              <button type="button" onClick={() => remove(l.userId)} className="ml-auto text-slate-400 hover:text-red-600" aria-label={`Remove ${l.name}`}>
                <UserMinus className="w-4 h-4" />
              </button>
            </li>
          ))}
          {team.pendingInvites.map((i) => (
            <li key={i.id} className="py-2.5 flex items-center gap-4 text-sm text-slate-500">
              <span className="min-w-[10rem]">{i.email}</span>
              <span>Invited, not joined yet</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
