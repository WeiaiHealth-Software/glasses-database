import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'default' | 'primary' | 'ghost' | 'danger' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-xs rounded-xl',
  md: 'h-10 px-5 text-sm rounded-xl',
  lg: 'h-12 px-6 text-base rounded-2xl',
};

const variantClasses: Record<ButtonVariant, string> = {
  default:
    'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-brand-600 font-bold shadow-sm',
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 font-bold shadow-sm disabled:bg-brand-300 disabled:cursor-not-allowed hover:shadow-md hover:-translate-y-[1px] transition-all',
  ghost:
    'text-slate-500 hover:bg-slate-100 hover:text-slate-700 font-semibold',
  danger:
    'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 font-bold shadow-sm',
  icon:
    'h-10 w-10 p-0 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-brand-600 flex items-center justify-center border border-slate-200 bg-white shadow-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'default',
      size = 'md',
      loading,
      leftIcon,
      rightIcon,
      children,
      className = '',
      disabled,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-150 outline-none disabled:opacity-60 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        {...rest}
      >
        {loading ? (
          <Loader2 className="w-4.5 h-4.5 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
