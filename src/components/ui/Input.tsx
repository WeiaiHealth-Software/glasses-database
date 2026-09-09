import React, { forwardRef, InputHTMLAttributes } from 'react';
import { Search, Eye, EyeOff } from 'lucide-react';

export type InputSize = 'sm' | 'md';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  wrapperClassName?: string;
  size?: InputSize;
}

const inputSizeMap: Record<InputSize, string> = {
  sm: 'h-9 rounded-xl',
  md: 'h-10 rounded-xl',
};
const padLeftMap: Record<InputSize, { withIcon: string; normal: string }> = {
  sm: { withIcon: 'pl-10', normal: 'pl-4' },
  md: { withIcon: 'pl-11', normal: 'pl-4.5' },
};
const padRightMap: Record<InputSize, { withIcon: string; normal: string }> = {
  sm: { withIcon: 'pr-10', normal: 'pr-4' },
  md: { withIcon: 'pr-11', normal: 'pr-4.5' },
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className = '', wrapperClassName = '', id, size = 'md', ...rest }, ref) => {
    const inputId = id || rest.name;
    const sz = inputSizeMap[size];
    const pl = leftIcon ? padLeftMap[size].withIcon : padLeftMap[size].normal;
    const pr = rightIcon ? padRightMap[size].withIcon : padRightMap[size].normal;
    return (
      <div className={`w-full ${wrapperClassName}`}>
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 mb-2 leading-5">
            {label}
            {rest.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full ${sz} border bg-slate-50 text-sm outline-none transition-all placeholder:text-slate-400 ${pl} ${pr} ${
              error
                ? 'border-red-300 focus:ring-1 focus:ring-red-500 focus:border-red-500'
                : 'border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:bg-white focus:shadow-[0_2px_8px_rgba(37,99,235,0.06)]'
            } ${className}`}
            {...rest}
          />
          {rightIcon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-1.5 text-xs text-red-500 leading-5">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-slate-400 leading-5">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface InputSearchProps extends Omit<InputProps, 'leftIcon'> {
  onSearch?: (value: string) => void;
}

export const InputSearch = forwardRef<HTMLInputElement, InputSearchProps>(
  ({ onSearch, className = '', ...rest }, ref) => {
    return (
      <Input
        ref={ref}
        leftIcon={<Search className="w-4.5 h-4.5" />}
        placeholder={rest.placeholder || '请输入关键词搜索...'}
        className={className}
        {...rest}
        onChange={(e) => {
          rest.onChange?.(e);
          onSearch?.(e.target.value);
        }}
      />
    );
  }
);

InputSearch.displayName = 'InputSearch';

export interface InputPasswordProps extends Omit<InputProps, 'type' | 'rightIcon'> {}

export const InputPassword = forwardRef<HTMLInputElement, InputPasswordProps>(
  (props, ref) => {
    const [show, setShow] = React.useState(false);
    return (
      <Input
        ref={ref}
        type={show ? 'text' : 'password'}
        {...props}
        rightIcon={
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="pointer-events-auto text-slate-400 hover:text-slate-600 transition-colors"
            tabIndex={-1}
          >
            {show ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
          </button>
        }
      />
    );
  }
);

InputPassword.displayName = 'InputPassword';
