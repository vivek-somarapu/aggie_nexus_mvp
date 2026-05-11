'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const AddDocSchema = z.object({
  title: z.string().min(1, 'Required').max(200),
  description: z.string().max(1000).optional(),
  file_url: z.string().url('Must be a valid URL'),
  file_type: z.enum(['pdf', 'docx', 'link', 'other']),
  visibility: z.enum(['aggiex_only', 'aggiex_mce']),
});

type AddDocValues = z.infer<typeof AddDocSchema>;

export default function AddDocForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [addedTitle, setAddedTitle] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<AddDocValues>({
      resolver: zodResolver(AddDocSchema),
      defaultValues: { file_type: 'pdf', visibility: 'aggiex_mce' },
    });

  const onSubmit = async (values: AddDocValues) => {
    setServerError(null);
    const response = await fetch('/api/accelerator/internal-docs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (!response.ok) {
      const data = await response.json();
      setServerError(data.error ?? 'Upload failed.');
      return;
    }
    setAddedTitle(values.title);
    reset();
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <div className="flex flex-col items-end gap-2">
        {addedTitle && (
          <p className="text-xs text-emerald-400">
            &ldquo;{addedTitle}&rdquo; added. Reload to see it in the list.
          </p>
        )}
        <button
          onClick={() => { setIsOpen(true); setAddedTitle(null); }}
          className="rounded-md border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm text-neutral-200 transition-colors hover:border-neutral-500 hover:text-white"
        >
          + Add document
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 rounded-lg border border-neutral-700 bg-neutral-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-100">Add document</p>
        <button
          type="button"
          onClick={() => { setIsOpen(false); reset(); setServerError(null); }}
          className="text-xs text-neutral-500 hover:text-neutral-300"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <Field label="Title" error={errors.title?.message}>
          <input {...register('title')} placeholder="e.g. Week 3 Review Notes" className={INPUT} />
        </Field>

        <Field label="Description (optional)">
          <textarea {...register('description')} rows={2} className={TEXTAREA} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <select {...register('file_type')} className={INPUT}>
              <option value="pdf">PDF</option>
              <option value="docx">DOCX</option>
              <option value="link">Link</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Visible to">
            <select {...register('visibility')} className={INPUT}>
              <option value="aggiex_mce">AggieX + MCE</option>
              <option value="aggiex_only">AggieX only</option>
            </select>
          </Field>
        </div>

        <Field label="URL" error={errors.file_url?.message}>
          <input type="url" {...register('file_url')} placeholder="https://..." className={INPUT} />
        </Field>

        {serverError && (
          <p className="rounded bg-red-500/10 px-3 py-2 text-xs text-red-400">{serverError}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-neutral-100 py-2 text-sm font-medium text-neutral-900 hover:bg-white disabled:opacity-50"
        >
          {isSubmitting ? 'Adding...' : 'Add document'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium uppercase tracking-widest text-neutral-400">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

const INPUT = 'w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none';
const TEXTAREA = 'w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none resize-none';
