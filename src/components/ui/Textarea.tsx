import React, { forwardRef } from 'react';
import { TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', wrapperClassName = '', id, rows = 3, ...rest }, ref) => {
    const inputId = id || rest.name;
    return (
      <div className={`w-full ${wrapperClassName}`}>
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 mb-1.5">
            {label}
            {rest.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={`w-full rounded-xl border bg-slate-50 text-sm outline-none transition-all px-4 py-2.5 resize-y ${
            error
              ? 'border-red-300 focus:ring-1 focus:ring-red-500 focus:border-red-500'
              : 'border-slate-200 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 focus:bg-white'
          } ${className}`}
          {...rest}
        />
        {error ? (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        ) : hint ? (
          <p className="mt-1 text-xs text-slate-400">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
