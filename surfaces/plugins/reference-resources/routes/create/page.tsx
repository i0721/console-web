'use client';

import { Page, PageHeader, Section } from '@community-go/surface-foundation/layout';
import { Action } from '@community-go/ui-adapter/action';
import { SelectField, TextField } from '@community-go/ui-adapter/form-field';
import { FormActions } from '@community-go/surface-foundation/form-actions';
import { route, RouteLink, usePluginNavigation } from '@community-go/plugin-framework/plugin';
import { usePreferencesPort } from '@community-go/plugin-framework/preferences';
import { useWorkspacePort } from '@community-go/plugin-framework/workspace';
import { useFrontendTranslation } from '@community-go/i18n';
import type { Preferences } from '@community-go/surface/preferences-model';
import { useEffect, useState } from 'react';

const CREATE_PAGE_ID = 'reference-resources.create';
const CREATE_DRAFT_FIELDS = ['name', 'kind'] as const;

export default function ReferenceResourcesCreatePage() {
  const { t } = useFrontendTranslation();
  const { navigate } = usePluginNavigation();
  const preferencesPort = usePreferencesPort<Preferences>();
  const workspacePort = useWorkspacePort<(typeof CREATE_DRAFT_FIELDS)[number]>();

  // 本地草稿自动保存（操作偏好 autosaveDrafts，默认关）：mount 后恢复已存草稿
  // （保持未提交语义；经 effect 读取保证 workspace store 已 hydration）；
  // 字段变化自动保存；提交成功/放弃后清除。
  const [name, setName] = useState('');
  const [kind, setKind] = useState('sample');

  // 恢复草稿：mount 后读取（Host 门控保证 workspace store 已 hydration——
  // 见 providers workspaceHasHydrated；仅当表单仍为空时应用，避免覆盖用户输入）。
  useEffect(() => {
    const draft = workspacePort.restorePageState(CREATE_PAGE_ID)?.draft;
    const draftName = typeof draft?.name === 'string' ? draft.name : '';
    const draftKind = typeof draft?.kind === 'string' ? draft.kind : '';
    if (draftName !== '') {
      setName((current) => (current === '' ? draftName : current));
    }
    if (draftKind !== '') {
      setKind(draftKind);
    }
    // 只恢复一次（首帧）。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 注册页面描述（白名单：name/kind）；卸载注销。
  useEffect(() => {
    return workspacePort.registerPageState({
      pageId: CREATE_PAGE_ID,
      version: 1,
      draftFields: CREATE_DRAFT_FIELDS,
      allowListState: false,
    });
  }, [workspacePort]);

  // 字段变化自动保存（autosaveDrafts 开时；render 后立即落盘，不经 rAF 合并——
  // 避免竞态丢失最后输入）。
  const autosaveEnabled = preferencesPort.getSnapshot().actionPreferences.autosaveDrafts;
  useEffect(() => {
    if (!autosaveEnabled) return;
    workspacePort.savePageState(CREATE_PAGE_ID, { draft: { name, kind } });
  }, [autosaveEnabled, name, kind, workspacePort]);

  const clearDraft = () => workspacePort.clearPageState(CREATE_PAGE_ID);

  const submit = () => {
    // 创建成功去向（操作偏好 → createSuccessDestination，真实成功回调后执行）：
    // - list（默认）：返回列表；
    // - continue：留在本页继续创建（重置表单）；
    // - detail：本参考场景无真实新建实体详情目标（create 不产生后端记录），
    //   该选项不适用——见 settings 操作偏好说明，不伪装跳转。
    const destination = preferencesPort.getSnapshot().actionPreferences.createSuccessDestination;
    if (destination === 'continue') {
      clearDraft();
      setName('');
      setKind('sample');
      return;
    }
    clearDraft(); // 业务提交成功：清除本地草稿
    void navigate(route('reference-resources'));
  };

  // 自动聚焦首个可编辑字段（操作偏好 focusFirstField，默认关）：开时进入页面
  // 聚焦第一个文本输入。
  const focusFirstField = preferencesPort.getSnapshot().actionPreferences.focusFirstField;
  useEffect(() => {
    if (!focusFirstField) return;
    const frame = requestAnimationFrame(() => {
      const input = document.querySelector<HTMLInputElement>(
        '#create-form input[type="text"], #create-form input:not([type])',
      );
      input?.focus();
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Page>
      <PageHeader
        eyebrow="Reference · File Routes"
        title={t('referenceResources.create.title')}
        description={t('referenceResources.create.description')}
        actions={
          <RouteLink target={route('reference-resources')}>
            {t('referenceResources.create.back')}
          </RouteLink>
        }
      />
      <Section title={t('referenceResources.create.title')}>
        <form
          className="grid gap-5 p-5"
          id="create-form"
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
          <SelectField
            label={t('referenceResources.common.kind')}
            options={[
              { label: t('referenceResources.common.sample'), value: 'sample' },
              { label: 'Guide', value: 'guide' },
              { label: 'Template', value: 'template' },
            ]}
            value={kind}
            onValueChange={setKind}
          />
          <FormActions
            primary={<Action type="submit">{t('referenceResources.create.submit')}</Action>}
            secondary={
              <RouteLink target={route('reference-resources')}>
                {t('referenceResources.create.cancel')}
              </RouteLink>
            }
          />
        </form>
      </Section>
    </Page>
  );
}
