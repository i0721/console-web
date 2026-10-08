'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useFrontendTranslation } from '@community-go/i18n';
import { PageLoadingSurface } from '@community-go/surface-foundation/states-operations';
import { Skeleton } from '@community-go/ui-adapter/skeleton';
import { FormElementsPage } from '../../src/form-elements-page';

const DatePickerField = dynamic(
  () =>
    import('@community-go/ui-adapter/date-picker-field').then((module) => module.DatePickerField),
  { ssr: false, loading: () => <Skeleton className="h-control w-full" /> },
);

export default function FormElementsRoute() {
  const { t } = useFrontendTranslation();
  return (
    <Suspense fallback={<PageLoadingSurface kind="form" label={t('uiElements.fieldsTitle')} />}>
      <FormElementsPage datePicker={DatePickerField} />
    </Suspense>
  );
}
