import { Description } from '@heroui/react/description';
import { FieldError } from '@heroui/react/field-error';
import { Label } from '@heroui/react/label';
import { Radio } from '@heroui/react/radio';
import { RadioGroup } from '@heroui/react/radio-group';
import type { FieldTextProps } from './field-contract';
import { useId } from 'react';

export type RadioOption = Readonly<{
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}>;

export type RadioGroupFieldProps = FieldTextProps &
  Readonly<{
    value: string;
    options: readonly RadioOption[];
    presentation?: 'cards' | 'rows';
    disabled?: boolean;
    onValueChange: (value: string) => void;
  }>;

export function RadioGroupField({
  label,
  hint,
  error,
  value,
  options,
  disabled = false,
  onValueChange,
  presentation = 'cards',
}: RadioGroupFieldProps) {
  const descriptionId = useId();
  return (
    <RadioGroup
      className="ui-field"
      isDisabled={disabled}
      isInvalid={Boolean(error)}
      value={value}
      onChange={onValueChange}
    >
      <Label className="ui-field-label">{label}</Label>
      <div className={presentation === 'rows' ? 'grid gap-2' : 'surface-filter-grid'}>
        {options.map((option, index) => (
          <Radio
            aria-label={option.label}
            {...(option.description ? { 'aria-describedby': `${descriptionId}-${index}` } : {})}
            className="group min-w-0 w-full text-sm"
            key={option.value}
            value={option.value}
            {...(option.disabled ? { isDisabled: true } : {})}
          >
            <Radio.Content
              className={`ui-choice-content border border-border bg-surface group-data-[selected]:border-brand group-data-[selected]:bg-brand-soft ${presentation === 'rows' ? 'rounded-control px-3 py-2' : 'rounded-panel min-h-20 p-4'}`}
            >
              <Radio.Control className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-border-strong bg-surface group-data-[selected]:border-brand">
                <Radio.Indicator className="pointer-events-none">
                  {/* 项目单选 dot：几何固定 10×10；仅 selected 时可见（group 根 data-selected）。
                    非空子节点避免 vendor `.radio__indicator:empty::before` 的默认 dot。 */}
                  <span
                    aria-hidden="true"
                    className="block size-2.5 rounded-full bg-brand opacity-0 transition-opacity group-data-[selected]:opacity-100"
                  />
                </Radio.Indicator>
              </Radio.Control>
              <span className="flex min-w-0 flex-col items-start">
                <span className="block font-semibold text-ink">{option.label}</span>
                {option.description ? (
                  <span
                    id={`${descriptionId}-${index}`}
                    className="mt-1 block text-xs leading-5 text-ink-muted"
                  >
                    {option.description}
                  </span>
                ) : null}
              </span>
            </Radio.Content>
          </Radio>
        ))}
      </div>
      {error ? (
        <FieldError className="ui-field-error">{error}</FieldError>
      ) : hint ? (
        <Description className="ui-field-hint">{hint}</Description>
      ) : null}
    </RadioGroup>
  );
}
