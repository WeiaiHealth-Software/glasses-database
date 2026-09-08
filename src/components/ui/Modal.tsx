import React, { useEffect } from 'react';
import { X, AlertTriangle, CheckCircle2, Info, AlertCircle } from 'lucide-react';
import { Button } from './Button';

export type ModalType = 'default' | 'confirm' | 'success' | 'warning' | 'danger' | 'info';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  loading?: boolean;
  hideFooter?: boolean;
  hideCancel?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  confirmDanger?: boolean;
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const iconMap: Record<Exclude<ModalType, 'default'>, { Icon: typeof X; color: string; bg: string }> = {
  confirm: { Icon: AlertCircle, color: 'text-brand-600', bg: 'bg-brand-50' },
  success: { Icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  warning: { Icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
  danger: { Icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
  info: { Icon: Info, color: 'text-brand-500', bg: 'bg-brand-50' },
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  type = 'default',
  confirmText = '确定',
  cancelText = '取消',
  onConfirm,
  loading,
  hideFooter,
  hideCancel,
  size = 'md',
  confirmDanger,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const iconInfo = type !== 'default' ? iconMap[type] : null;

  const defaultFooter = !hideFooter && (
    <div className="flex justify-end gap-2">
      {!hideCancel && (
        <Button variant="default" onClick={onClose} size="md">
          {cancelText}
        </Button>
      )}
      <Button
        variant={confirmDanger ? 'danger' : 'primary'}
        loading={loading}
        onClick={() => onConfirm?.()}
        size="md"
      >
        {confirmText}
      </Button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${sizeMap[size]} bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
      >
        <div className="px-6 pt-5 pb-4 flex items-start gap-3 border-b border-slate-100">
          {iconInfo && (
            <div className={`shrink-0 w-10 h-10 rounded-full ${iconInfo.bg} flex items-center justify-center`}>
              <iconInfo.Icon className={`w-5 h-5 ${iconInfo.color}`} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 text-base leading-6">{title}</h3>
            {description && <p className="mt-1 text-sm text-slate-500 leading-5">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 -mr-1 -mt-1 w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
        {children && (
          <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
        )}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          {footer ?? defaultFooter}
        </div>
      </div>
    </div>
  );
};

export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  loading?: boolean;
  type?: Exclude<ModalType, 'default'>;
  danger?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  type = 'warning',
  danger,
  ...props
}) => (
  <Modal
    {...props}
    type={danger ? 'danger' : type}
    size="sm"
    hideCancel={false}
    confirmDanger={danger}
  />
);
