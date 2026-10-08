import { Switch } from '@heroui/react/switch';

export type SwitchFieldProps = Readonly<{
  label: string;
  description: string;
  checked: boolean;
  presentation?: 'card' | 'row';
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}>;

export function SwitchField({
  label,
  description,
  checked,
  disabled = false,
  onCheckedChange,
  presentation = 'card',
}: SwitchFieldProps) {
  return (
    <Switch
      className={`group flex items-start justify-between gap-4 ${presentation === 'row' ? 'py-2' : 'rounded-panel border border-border bg-surface p-4'}`}
      isDisabled={disabled}
      isSelected={checked}
      onChange={onCheckedChange}
    >
      <Switch.Content className="flex min-w-0 flex-col items-start">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-ink-muted">{description}</span>
      </Switch.Content>
      <Switch.Control className="mt-1 flex h-6 w-11 shrink-0 items-center rounded-full bg-border-strong p-0.5 transition-colors group-data-[selected=true]:bg-brand">
        <Switch.Thumb className="size-5 rounded-full bg-surface shadow-sm" />
      </Switch.Control>
    </Switch>
  );
}
