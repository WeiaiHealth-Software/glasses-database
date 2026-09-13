import React, { useState, useCallback, Children, isValidElement, cloneElement } from 'react';

export type TabsVariant = 'primary' | 'secondary';

export interface TabItemProps {
  label: React.ReactNode;
  value: string;
  disabled?: boolean;
  children?: React.ReactNode;
  badge?: React.ReactNode;
}

export const TabItem: React.FC<TabItemProps> = ({ children }) => <>{children}</>;

export interface TabsProps {
  variant?: TabsVariant;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  tabsClassName?: string;
  size?: 'sm' | 'md';
}

export const Tabs: React.FC<TabsProps> = ({
  variant = 'primary',
  defaultValue,
  value: controlledValue,
  onChange,
  children,
  className = '',
  tabsClassName = '',
  size = 'md',
}) => {
  const [innerValue, setInnerValue] = useState<string | undefined>(defaultValue);
  const current = controlledValue ?? innerValue;

  const items = Children.toArray(children)
    .filter(isValidElement)
    .map((el) => el as React.ReactElement<TabItemProps>);

  const handleClick = useCallback(
    (v: string, disabled?: boolean) => {
      if (disabled) return;
      if (controlledValue === undefined) setInnerValue(v);
      onChange?.(v);
    },
    [controlledValue, onChange]
  );

  const activeTab = items.find((it) => it.props.value === current);

  const padY = size === 'sm' ? 'py-2' : 'py-2.5';
  const padX = size === 'sm' ? 'px-4' : 'px-5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className={className}>
      <div
        role="tablist"
        className={`flex flex-wrap items-center gap-1.5 ${
          variant === 'primary' ? 'bg-slate-100/70 p-1.5 rounded-2xl' : 'border-b border-slate-200 gap-0'
        } ${tabsClassName}`}
      >
        {items.map((item) => {
          const { value, label, disabled, badge } = item.props;
          const active = value === current;
          if (variant === 'primary') {
            return (
              <button
                key={value}
                role="tab"
                aria-selected={active}
                disabled={disabled}
                onClick={() => handleClick(value, disabled)}
                className={`inline-flex items-center gap-2 rounded-xl font-bold transition-all ${padX} ${padY} ${textSize} ${
                  active
                    ? 'bg-brand-600 text-white shadow-sm'
                    : disabled
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-600 hover:bg-white hover:text-slate-800'
                }`}
              >
                {label}
                {badge}
              </button>
            );
          }
          return (
            <button
              key={value}
              role="tab"
              aria-selected={active}
              disabled={disabled}
              onClick={() => handleClick(value, disabled)}
              className={`relative inline-flex items-center gap-2 font-bold transition-all flex-1 min-w-0 justify-center ${padX} ${padY} ${textSize} ${
                active
                  ? 'text-brand-600'
                  : disabled
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
              {badge}
              <span
                className={`absolute left-0 right-0 -bottom-px h-0.5 rounded-full transition-all ${
                  active ? 'bg-brand-600 scale-x-100' : 'scale-x-0'
                }`}
              />
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className="mt-6">
        {activeTab ? (
          cloneElement(activeTab, { ...activeTab.props })
        ) : items[0] ? (
          cloneElement(items[0], { ...items[0].props })
        ) : null}
      </div>
    </div>
  );
};
