import React from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  indeterminate?: boolean;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked: controlled,
  defaultChecked,
  onChange,
  label,
  disabled,
  indeterminate,
  className = '',
}) => {
  const [inner, setInner] = React.useState(!!defaultChecked);
  const isControlled = controlled !== undefined;
  const value = isControlled ? !!controlled : inner;

  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);

  return (
    <label
      className={`inline-flex items-center gap-2 text-sm cursor-pointer select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <span className="relative inline-flex shrink-0">
        <input
          ref={ref}
          type="checkbox"
          className="peer sr-only"
          checked={value}
          disabled={disabled}
          onChange={(e) => {
            const v = e.target.checked;
            if (!isControlled) setInner(v);
            onChange?.(v);
          }}
        />
        <span
          className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${
            value || indeterminate
              ? 'bg-brand-600 border-brand-600'
              : 'bg-white border-slate-300 peer-hover:border-brand-400'
          }`}
        >
          {indeterminate ? (
            <span className="w-2 h-0.5 bg-white rounded-full" />
          ) : (
            value && <Check className="w-3 h-3 text-white" strokeWidth={3} />
          )}
        </span>
      </span>
      {label && <span className="text-slate-700">{label}</span>}
    </label>
  );
};

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked: controlled,
  defaultChecked,
  onChange,
  disabled,
  label,
  size = 'md',
  className = '',
}) => {
  const [inner, setInner] = React.useState(!!defaultChecked);
  const isControlled = controlled !== undefined;
  const value = isControlled ? !!controlled : inner;

  const dims = size === 'sm' ? { w: 'w-8', h: 'h-4', dot: 'w-3 h-3', active: 'translate-x-4' }
                            : { w: 'w-11', h: 'h-6', dot: 'w-5 h-5', active: 'translate-x-5' };

  return (
    <label
      className={`inline-flex items-center gap-2 cursor-pointer select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={value}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          const v = !value;
          if (!isControlled) setInner(v);
          onChange?.(v);
        }}
        className={`relative inline-flex items-center shrink-0 rounded-full transition-colors ${dims.w} ${dims.h} ${
          value ? 'bg-brand-600' : 'bg-slate-200'
        }`}
      >
        <span
          className={`inline-block rounded-full bg-white shadow-sm transition-transform ${dims.dot} ${
            value ? dims.active : 'translate-x-0.5'
          }`}
        />
      </button>
      {label && <span className="text-sm text-slate-700">{label}</span>}
    </label>
  );
};

export interface RadioGroupProps<T extends string = string> {
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
  options: { label: React.ReactNode; value: T; disabled?: boolean; description?: string }[];
  variant?: 'radio' | 'button';
  name?: string;
  className?: string;
}

export function RadioGroup<T extends string = string>({
  value: controlled,
  defaultValue,
  onChange,
  options,
  variant = 'radio',
  name = 'radio-group',
  className = '',
}: RadioGroupProps<T>) {
  const [inner, setInner] = React.useState<T | undefined>(defaultValue);
  const current = controlled ?? inner;

  if (variant === 'button') {
    return (
      <div className={`inline-flex bg-slate-100/70 p-1 rounded-xl gap-0.5 ${className}`}>
        {options.map((opt) => {
          const active = opt.value === current;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={opt.disabled}
              onClick={() => {
                if (opt.disabled) return;
                if (controlled === undefined) setInner(opt.value);
                onChange?.(opt.value);
              }}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                active
                  ? 'bg-white text-brand-600 shadow-sm'
                  : opt.disabled
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {options.map((opt) => {
        const active = opt.value === current;
        return (
          <label
            key={opt.value}
            className={`flex items-start gap-2.5 text-sm cursor-pointer select-none ${
              opt.disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <span className="relative mt-0.5 shrink-0">
              <input
                type="radio"
                name={name}
                className="peer sr-only"
                checked={active}
                disabled={opt.disabled}
                onChange={() => {
                  if (opt.disabled) return;
                  if (controlled === undefined) setInner(opt.value);
                  onChange?.(opt.value);
                }}
              />
              <span
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                  active ? 'border-brand-600' : 'border-slate-300'
                }`}
              >
                {active && <span className="w-2 h-2 rounded-full bg-brand-600" />}
              </span>
            </span>
            <div>
              <div className={`font-medium ${active ? 'text-brand-700' : 'text-slate-700'}`}>{opt.label}</div>
              {opt.description && <div className="text-xs text-slate-400 mt-0.5">{opt.description}</div>}
            </div>
          </label>
        );
      })}
    </div>
  );
}
