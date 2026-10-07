'use client';

import { Page, PageHeader, Section } from '@community-go/surface-foundation/layout';
import { Action } from '@community-go/ui-adapter/action';
import { TextField } from '@community-go/ui-adapter/form-field';
import { FormActions } from '@community-go/surface-foundation/form-actions';
import { useRegisterDirtySource } from '@community-go/plugin-framework/leave-confirm';
import { useNotificationsPort } from '@community-go/plugin-framework/notifications';
import { route, RouteLink, usePluginNavigation } from '@community-go/plugin-framework/plugin';
import { usePreferencesPort } from '@community-go/plugin-framework/preferences';
import { useFrontendTranslation } from '@community-go/i18n';
import { ConfirmDialog } from '@community-go/ui-adapter/overlays';
import type { Preferences } from '@community-go/surface/preferences-model';
import { useState } from 'react';

import { getReferenceResources } from '../../data';

export default function ReferenceResourcesEditPage() {
  const { t } = useFrontendTranslation();
  const { navigate } = usePluginNavigation();
  const notifications = useNotificationsPort();
  const preferencesPort = usePreferencesPort<Preferences>();
  const resource = getReferenceResources()[0] ?? null;
  const initialName = resource?.name ?? '';
  const [name, setName] = useState(initialName);
  // 已保存基线（state：stay 保存后更新 → 触发重渲使 dirty 变 false）。
  const [savedName, setSavedName] = useState(initialName);
  const dirty = name.trim() !== savedName.trim();

  // 离开确认（SET-005-001）：name 被改动视为未提交输入；取消导航不改路由/标签/进度。
  useRegisterDirtySource({
    pageId: 'reference-resources.edit',
    message: () => t('referenceResources.edit.unsavedMessage'),
    isDirty: () => dirty,
  });

  const submit = () => {
    // 真实本地保存成功回调：publish 通知；随后按操作偏好 → editSuccessDestination：
    // - stay（默认）：留在本页，已保存值作为新的未提交基线（不再 dirty）；
    // - list：返回列表；
    // - detail：进入详情。
    const destination = preferencesPort.getSnapshot().actionPreferences.editSuccessDestination;
    const target =
      destination === 'list'
        ? route('reference-resources')
        : destination === 'detail'
          ? route('reference-resources.detail')
          : null;
    notifications.publish({
      category: 'success',
      severity: 'info',
      title: t('referenceResources.edit.savedTitle'),
      description: t('referenceResources.edit.savedDescription'),
      ...(target ? { target: { routeId: target.routeId } } : {}),
    });
    if (target) {
      void navigate(target);
      return;
    }
    // stay：本次保存值成为新的基线（不再视为未提交）。
    setSavedName(name);
  };

  // 重置表单到初始值（操作偏好 confirmReset，默认开：重置前确认）。
  const resetToInitial = () => {
    setName(initialName);
    setSavedName(initialName);
  };
  const confirmResetEnabled = preferencesPort.getSnapshot().actionPreferences.confirmReset;

  return (
    <Page>
      <PageHeader
        eyebrow="Reference · File Routes"
        title={t('referenceResources.edit.title')}
        description={t('referenceResources.edit.description')}
        actions={
          <RouteLink target={route('reference-resources.detail')}>
            {t('referenceResources.edit.back')}
          </RouteLink>
        }
      />
      <Section title={t('referenceResources.edit.title')}>
        <form
          className="grid gap-5 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <TextField
            label={t('referenceResources.common.name')}
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
          />
          <FormActions
            primary={<Action type="submit">{t('referenceResources.edit.submit')}</Action>}
            secondary={
              <>
                {confirmResetEnabled ? (
                  <ConfirmDialog
                    cancelLabel={t('referenceResources.edit.resetCancel')}
                    confirmLabel={t('referenceResources.edit.resetConfirm')}
                    description={t('referenceResources.edit.resetDescription')}
                    failureMessage={t('referenceResources.edit.resetFailed')}
                    impact={t('referenceResources.edit.resetImpact')}
                    title={t('referenceResources.edit.resetTitle')}
                    triggerLabel={t('referenceResources.edit.reset')}
                    onConfirm={resetToInitial}
                  />
                ) : (
                  <Action onPress={resetToInitial} variant="secondary">
                    {t('referenceResources.edit.reset')}
                  </Action>
                )}
                <RouteLink target={route('reference-resources.detail')}>
                  {t('referenceResources.edit.cancel')}
                </RouteLink>
              </>
            }
          />
        </form>
      </Section>
    </Page>
  );
}
