import type { CSSProperties, ReactNode } from 'react';
import { Icon } from './Icon';

/* ----------------------------- Button ----------------------------- */
type ButtonVariant = 'primary' | 'soft' | 'ghost' | 'solid';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  style?: CSSProperties;
}

const BTN_H: Record<ButtonSize, number> = { sm: 40, md: 52, lg: 60 };

export function Button({
  children, variant = 'primary', size = 'md', fullWidth, disabled,
  iconLeft, iconRight, onClick, type = 'button', style,
}: ButtonProps) {
  const base: CSSProperties = {
    height: BTN_H[size],
    padding: size === 'sm' ? '0 14px' : '0 20px',
    borderRadius: 'var(--radius-pill)',
    border: 'none',
    fontFamily: 'var(--font-body)',
    fontWeight: 800,
    fontSize: size === 'lg' ? 'var(--text-lg)' : 'var(--text-md)',
    cursor: disabled ? 'default' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: fullWidth ? '100%' : undefined,
    opacity: disabled ? 0.5 : 1,
    transition: 'transform var(--dur-fast) var(--ease-out), filter var(--dur-fast)',
  };
  const variants: Record<ButtonVariant, CSSProperties> = {
    primary: { background: 'var(--primary)', color: 'var(--on-primary)', boxShadow: 'var(--shadow-primary)' },
    solid:   { background: 'var(--primary)', color: 'var(--on-primary)' },
    soft:    { background: 'var(--primary-soft)', color: 'var(--primary-hover)' },
    ghost:   { background: 'transparent', color: 'var(--text-body)' },
  };
  return (
    <button type={type} onClick={disabled ? undefined : onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {iconLeft}{children}{iconRight}
    </button>
  );
}

/* --------------------------- IconButton --------------------------- */
type IconButtonVariant = 'soft' | 'ghost' | 'solid';

interface IconButtonProps {
  children: ReactNode;
  label: string;
  variant?: IconButtonVariant;
  onClick?: () => void;
  style?: CSSProperties;
}

export function IconButton({ children, label, variant = 'soft', onClick, style }: IconButtonProps) {
  const variants: Record<IconButtonVariant, CSSProperties> = {
    soft:  { background: 'var(--surface)', color: 'var(--text-body)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-xs)' },
    ghost: { background: 'transparent', color: 'var(--text-muted)' },
    solid: { background: 'var(--primary)', color: '#fff' },
  };
  return (
    <button
      type="button" aria-label={label} onClick={onClick}
      style={{
        width: 44, height: 44, borderRadius: 'var(--radius-md)', border: 'none',
        display: 'grid', placeItems: 'center', cursor: 'pointer', flex: 'none', ...variants[variant], ...style,
      }}
    >
      {children}
    </button>
  );
}

/* ------------------------------ Chip ------------------------------ */
interface ChipProps {
  children: ReactNode;
  selected?: boolean;
  color?: string;
  onClick?: () => void;
  style?: CSSProperties;
}

export function Chip({ children, selected, color = 'var(--primary)', onClick, style }: ChipProps) {
  return (
    <button
      type="button" onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: 40, padding: '0 14px', borderRadius: 'var(--radius-pill)',
        border: selected ? '1.5px solid transparent' : '1.5px solid var(--border)',
        background: selected ? color : 'var(--surface)',
        color: selected ? '#fff' : 'var(--text-body)',
        fontWeight: 800, fontSize: 'var(--text-sm)', cursor: 'pointer', whiteSpace: 'nowrap',
        transition: 'background var(--dur-fast), color var(--dur-fast)', ...style,
      }}
    >
      {children}
    </button>
  );
}

/* ------------------------------ Input ----------------------------- */
interface InputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  iconLeft?: ReactNode;
  search?: boolean;
  autoFocus?: boolean;
}

export function Input({ value, onChange, placeholder, type = 'text', iconLeft, autoFocus }: InputProps) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 10, height: 'var(--control-h)',
      padding: '0 16px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)',
      background: 'var(--surface)',
    }}>
      {iconLeft && <span style={{ color: 'var(--text-faint)', display: 'grid' }}>{iconLeft}</span>}
      <input
        value={value} onChange={onChange} placeholder={placeholder} type={type} autoFocus={autoFocus}
        style={{
          flex: 1, border: 'none', outline: 'none', background: 'transparent',
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-strong)',
        }}
      />
    </label>
  );
}

/* ------------------------------ Switch ---------------------------- */
interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function Switch({ checked, onChange }: SwitchProps) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      style={{
        width: 50, height: 30, borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer',
        background: checked ? 'var(--primary)' : 'var(--border-strong)', position: 'relative',
        transition: 'background var(--dur-base)', flex: 'none',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3, width: 24, height: 24, borderRadius: '50%',
        background: '#fff', boxShadow: 'var(--shadow-sm)', transition: 'left var(--dur-base) var(--ease-spring)',
      }} />
    </button>
  );
}

/* ------------------------- SegmentedControl ----------------------- */
interface SegOption { value: string; label: string }
interface SegmentedControlProps {
  options: SegOption[];
  value: string;
  onChange: (v: string) => void;
}

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${options.length}, 1fr)`, gap: 4,
      background: 'var(--cream-200)', borderRadius: 'var(--radius-pill)', padding: 4,
    }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value} type="button" onClick={() => onChange(o.value)}
            style={{
              height: 40, border: 'none', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 'var(--text-sm)',
              // NB: do NOT transition the background shorthand across var() colors (README gotcha).
              background: on ? 'var(--surface)' : 'transparent',
              color: on ? 'var(--text-strong)' : 'var(--text-muted)',
              boxShadow: on ? 'var(--shadow-sm)' : 'none',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export { Icon };
