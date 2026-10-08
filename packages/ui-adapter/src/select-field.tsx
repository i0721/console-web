import { Description } from '@heroui/react/description';
import { FieldError } from '@heroui/react/field-error';
import { Label } from '@heroui/react/label';
import { ListBox } from '@heroui/react/list-box';
import { Select } from '@heroui/react/select';
import type { FieldTextProps } from './field-contract';

export type SelectOption = Readonly<{
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
}>;

export type SelectFieldProps = FieldTextProps &
  Readonly<{
    name?: string;
    value?: string | null;
    defaultValue?: string;
    options: readonly SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    defaultOpen?: boolean;
    onValueChange?: (value: string) => void;
  }>;

export function SelectField({
  label,
  hint,
  error,
  options,
  value,
  defaultValue,
  placeholder,
  disabled = false,
  defaultOpen = false,
  onValueChange,
  name,
}: SelectFieldProps) {
  const disabledKeys = options.filter((option) => option.disabled).map((option) => option.value);
  return (
    <Select
      className="ui-field"
      defaultOpen={defaultOpen}
      disabledKeys={disabledKeys}
      fullWidth
      isDisabled={disabled}
      isInvalid={Boolean(error)}
      onChange={(key) => {
        if (key !== null) onValueChange?.(String(key));
      }}
      {...(defaultValue ? { defaultValue } : {})}
      {...(name ? { name } : {})}
      {...(placeholder ? { placeholder } : {})}
      {...(value !== undefined ? { value } : {})}
    >
      <Label className="ui-field-label">{label}</Label>
      <Select.Trigger className="ui-field-control flex items-center justify-between gap-3">
        <Select.Value className="min-w-0 flex-1 truncate text-left" />
        <Select.Indicator className="size-4 shrink-0 text-ink-muted" />
      </Select.Trigger>
      {error ? (
        <FieldError className="ui-field-error">{error}</FieldError>
      ) : hint ? (
        <Description className="ui-field-hint">{hint}</Description>
      ) : null}
      <Select.Popover className="ui-overlay-surface ui-anchored-overlay-match-trigger">
        <ListBox className="ui-listbox">
          {options.map((option) => (
            <ListBox.Item
              className="ui-option"
              id={option.value}
              key={option.value}
              textValue={option.label}
            >
              <span className="min-w-0">
                <Label className="block truncate font-medium">{option.label}</Label>
                {option.description ? (
                  <Description className="mt-0.5 block text-xs text-ink-muted">
                    {option.description}
                  </Description>
                ) : null}
              </span>
              <ListBox.ItemIndicator className="text-brand" />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
