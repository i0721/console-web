import { Checkbox } from '@heroui/react/checkbox';

type CheckboxChangeProps =
  | Readonly<{ disabled: true; onCheckedChange?: never }>
  | Readonly<{ disabled?: false; onCheckedChange: (checked: boolean) => void }>
  | Readonly<{ disabled: boolean; onCheckedChange: (checked: boolean) => void }>;

export type CheckboxFieldProps = Readonly<{
  label: string;
  description?: string;
  checked: boolean;
}> &
  CheckboxChangeProps;

export function CheckboxField({
  label,
  description,
  checked,
  disabled = false,
  onCheckedChange,
}: CheckboxFieldProps) {
  return (
    <Checkbox
      className="flex flex-row items-start gap-3 text-sm"
      isDisabled={disabled}
      isSelected={checked}
      {...(onCheckedChange ? { onChange: onCheckedChange } : {})}
    >
      <Checkbox.Control className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border border-border-strong bg-surface text-white data-[selected]:border-brand data-[selected]:bg-brand">
        <Checkbox.Indicator className="pointer-events-none">✓</Checkbox.Indicator>
      </Checkbox.Control>
      <Checkbox.Content className="flex min-w-0 flex-col items-start">
        <span className="block font-semibold text-ink">{label}</span>
        {description ? (
          <span className="mt-1 block text-xs leading-5 text-ink-muted">{description}</span>
        ) : null}
      </Checkbox.Content>
    </Checkbox>
  );
}
