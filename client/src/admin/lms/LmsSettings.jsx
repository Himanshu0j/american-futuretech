import React, { useEffect, useState } from 'react';
import { SlidersHorizontal, Save } from 'lucide-react';
import api from '../../lib/api';
import { PageHeader, Card, Field, inputClass, btnPrimary, ErrorNote, Loading } from './ui';

export default function LmsSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/admin/lms/settings');
        setSettings(res.data?.settings || {});
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Could not load LMS settings.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await api.put('/admin/lms/settings', settings);
      if (res.data?.success) {
        setSettings(res.data.settings);
        setStatus('LMS settings saved.');
        window.setTimeout(() => setStatus(''), 3000);
      } else {
        setError(res.data?.message || 'Could not save the settings.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        icon={SlidersHorizontal}
        title="LMS Settings"
        subtitle="The defaults the curriculum builder pre-fills, and the wording printed on issued certificates."
        actions={
          <button type="button" className={btnPrimary} onClick={save} disabled={saving || loading}>
            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save settings'}
          </button>
        }
      />

      <ErrorNote>{error}</ErrorNote>
      {status && (
        <div className="mb-4 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-[11px] text-emerald-200">
          {status}
        </div>
      )}

      {loading || !settings ? (
        <Card>
          <Loading />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-4 space-y-4">
            <div className="text-xs font-bold text-white">Curriculum defaults</div>
            <Field label="Default lesson duration" hint="Pre-filled on every new lesson.">
              <input
                className={inputClass}
                value={settings.defaultLessonDuration || ''}
                onChange={(e) => set('defaultLessonDuration', e.target.value)}
                placeholder="45m"
              />
            </Field>
            <Field label="Default module hours">
              <input
                type="number"
                min="1"
                className={inputClass}
                value={settings.defaultModuleHours ?? ''}
                onChange={(e) => set('defaultModuleHours', Number(e.target.value))}
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Default quiz time limit (min)">
                <input
                  type="number"
                  min="1"
                  className={inputClass}
                  value={settings.defaultQuizTimeLimit ?? ''}
                  onChange={(e) => set('defaultQuizTimeLimit', Number(e.target.value))}
                />
              </Field>
              <Field label="Default passing score (%)">
                <input
                  type="number"
                  min="1"
                  max="100"
                  className={inputClass}
                  value={settings.defaultQuizPassingScore ?? ''}
                  onChange={(e) => set('defaultQuizPassingScore', Number(e.target.value))}
                />
              </Field>
            </div>
          </Card>

          <Card className="p-4 space-y-4">
            <div className="text-xs font-bold text-white">Certificates</div>
            <Field label="Default grade / distinction" hint="Printed on certificates issued by hand.">
              <input
                className={inputClass}
                value={settings.certificateGrade || ''}
                onChange={(e) => set('certificateGrade', e.target.value)}
              />
            </Field>
            <Field label="Accreditation body">
              <textarea
                className={inputClass}
                rows={3}
                value={settings.certificateAccreditationBody || ''}
                onChange={(e) => set('certificateAccreditationBody', e.target.value)}
              />
            </Field>
          </Card>

          <Card className="p-4 space-y-4 lg:col-span-2">
            <div className="text-xs font-bold text-white">Student experience</div>
            <Field label="Welcome message">
              <input
                className={inputClass}
                value={settings.welcomeMessage || ''}
                onChange={(e) => set('welcomeMessage', e.target.value)}
              />
            </Field>
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-[11px] text-slate-300">
                <input
                  type="checkbox"
                  checked={settings.allowLessonPreview !== false}
                  onChange={(e) => set('allowLessonPreview', e.target.checked)}
                  className="rounded border-white/20 bg-[#111A2E]"
                />
                Allow free-preview lessons before enrollment
              </label>
              <label className="flex items-center gap-2 text-[11px] text-slate-300">
                <input
                  type="checkbox"
                  checked={settings.showAnnouncementsInLms !== false}
                  onChange={(e) => set('showAnnouncementsInLms', e.target.checked)}
                  className="rounded border-white/20 bg-[#111A2E]"
                />
                Show announcements on the student dashboard
              </label>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
