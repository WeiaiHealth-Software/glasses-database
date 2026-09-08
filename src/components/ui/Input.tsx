import React, { forwardRef, InputHTMLAttributes } from 'react';
import { Search, Eye, EyeOff } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className = '', wrapperClassName = '', id, ...rest }, ref) => {
    const inputId = id || rest.name;
    return (
      <div className={`w-full ${wrapperClassName}`}>
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 mb-1.5">
            {label}
            {rest.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full h-11 rounded-xl border bg-slate-50 text-sm outline-none transition-all ${
              leftIcon ? 'pl-9' : 'pl-4'
            } ${rightIcon ? 'pr-9' : 'pr-4'} ${
              error
                ? 'border-red-300 focus:ring-1 focus:ring-red-500 focus:border-red-500'
                : 'border-slate-200 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 focus:bg-white'
            } ${className}`}
            {...rest}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        ) : hint ? (
          <p className="mt-1 text-xs text-slate-400">{hint}</p>
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
        leftIcon={<Search className="w-4 h-4" />}
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
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
      />
    );
  }
);

InputPassword.displayName = 'InputPassword';
