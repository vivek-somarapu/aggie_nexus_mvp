'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const AddDocSchema = z.object({
  title: z.string().min(1, 'Required').max(200),
  description: z.string().max(1000).optional(),
  file_url: z.string().optional(),
  file_type: z.enum(['pdf', 'docx', 'link', 'other']),
  visibility: z.enum(['aggiex_only', 'aggiex_mce']),
});

type AddDocValues = z.infer<typeof AddDocSchema>;
type SourceMode = 'file' | 'url';

function detectFileType(filename: string): 'pdf' | 'docx' | 'other' {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx' || ext === 'doc') return 'docx';
  return 'other';
}

export default function AddDocForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [sourceMode, setSourceMode] = useState<SourceMode>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [addedTitle, setAddedTitle] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } =
    useForm<AddDocValues>({
      resolver: zodResolver(AddDocSchema),
      defaultValues: { file_type: 'pdf', visibility: 'aggiex_mce' },
    });

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (file) {
      setValue('file_type', detectFileType(file.name));
    }
  }

  function handleClose() {
    setIsOpen(false);
    reset();
    setServerError(null);
    setSelectedFile(null);
  }

  const onSubmit = async (values: AddDocValues) => {
    setServerError(null);

    let fileUrl: string;

    if (sourceMode === 'file') {
      if (!selectedFile) {
        setServerError('Please select a file to upload.');
        return;
      }
      const formData = new FormData();
      formData.append('file', selectedFile);
      const uploadResponse = await fetch('/api/upload/internal-docs', {
        method: 'POST',
        body: formData,
      });
      if (!uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        setServerError(uploadData.error ?? 'File upload failed.');
        return;
      }
      const { publicUrl } = await uploadResponse.json();
      fileUrl = publicUrl;
    } else {
      if (!values.file_url) {
        setServerError('Please enter a URL.');
        return;
      }
      try {
        new URL(values.file_url);
      } catch {
        setServerError('Please enter a valid URL.');
        return;
      }
      fileUrl = values.file_url;
    }

    const response = await fetch('/api/accelerator/internal-docs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, file_url: fileUrl }),
    });
    if (!response.ok) {
      const responseData = await response.json();
      setServerError(responseData.error ?? 'Failed to save document.');
      return;
    }
    setAddedTitle(values.title);
    reset();
    setSelectedFile(null);
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
          onClick={handleClose}
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

        {/* Source toggle */}
        <div className="flex rounded-md border border-neutral-800 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setSourceMode('file')}
            className={`flex-1 py-1.5 transition-colors ${
              sourceMode === 'file'
                ? 'bg-neutral-700 text-neutral-100'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Upload file
          </button>
          <button
            type="button"
            onClick={() => setSourceMode('url')}
            className={`flex-1 py-1.5 transition-colors ${
              sourceMode === 'url'
                ? 'bg-neutral-700 text-neutral-100'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Enter URL
          </button>
        </div>

        {sourceMode === 'file' ? (
          <Field label="File">
            <label className={`${INPUT} flex items-center gap-2 cursor-pointer`}>
              <input
                type="file"
                className="sr-only"
                onChange={handleFileChange}
              />
              <span className={`truncate ${selectedFile ? 'text-neutral-100' : 'text-neutral-600'}`}>
                {selectedFile ? selectedFile.name : 'Choose file…'}
              </span>
            </label>
          </Field>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select {...register('file_type')} className={INPUT}>
                <option value="pdf">PDF</option>
                <option value="docx">DOCX</option>
                <option value="link">Link</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="URL" error={errors.file_url?.message}>
              <input type="url" {...register('file_url')} placeholder="https://…" className={INPUT} />
            </Field>
          </div>
        )}

        <Field label="Visible to">
          <select {...register('visibility')} className={INPUT}>
            <option value="aggiex_mce">AggieX + MCE</option>
            <option value="aggiex_only">AggieX only</option>
          </select>
        </Field>

        {serverError && (
          <p className="rounded bg-red-500/10 px-3 py-2 text-xs text-red-400">{serverError}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-neutral-100 py-2 text-sm font-medium text-neutral-900 hover:bg-white disabled:opacity-50"
        >
          {isSubmitting ? 'Adding…' : 'Add document'}
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
