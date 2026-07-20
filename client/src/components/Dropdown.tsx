import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export interface DropdownOption {
  id: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** "default" matches the sidebar project select; "compact" matches the uppercase environment select. */
  variant?: 'default' | 'compact';
}

/** Thin wrapper around the Radix-based Select primitives (components/ui/select.tsx) with this app's two visual styles baked in. */
export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled,
  variant = 'default',
}: DropdownProps) {
  const isCompact = variant === 'compact';
  const isDisabled = disabled || options.length === 0;

  return (
    <Select value={value} onValueChange={onChange} disabled={isDisabled}>
      <SelectTrigger
        className={
          isCompact
            ? 'bg-neutral-900 text-xs font-semibold uppercase tracking-wider pl-3 pr-2.5'
            : undefined
        }
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.id} value={opt.id}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
