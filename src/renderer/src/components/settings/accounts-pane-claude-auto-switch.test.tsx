// @vitest-environment happy-dom

import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { GlobalSettings } from '../../../../shared/global-settings-types'
import type { ClaudeManagedAccountSummary } from '../../../../shared/managed-account-types'
import { i18n } from '../../i18n/i18n'
import {
  ClaudeAutoSwitchOptions,
  getClaudeAutoSwitchDescription
} from './accounts-pane-claude-auto-switch'

function account(
  id: string,
  overrides: Partial<ClaudeManagedAccountSummary> = {}
): ClaudeManagedAccountSummary {
  return {
    id,
    email: `${id}@example.test`,
    managedAuthRuntime: 'host',
    wslDistro: null,
    authMethod: 'subscription-oauth',
    createdAt: 1,
    updatedAt: 1,
    lastAuthenticatedAt: 1,
    ...overrides
  }
}

function renderOptions(
  settings: Partial<GlobalSettings> = {},
  accounts = [account('a'), account('b'), account('c')]
) {
  const updateSettings = vi.fn()
  const view = render(
    <ClaudeAutoSwitchOptions
      accounts={accounts}
      settings={settings}
      updateSettings={updateSettings}
    />
  )
  return { ...view, updateSettings }
}

function accountSwitch(container: HTMLElement, id: string): HTMLButtonElement {
  return container.querySelector<HTMLButtonElement>(
    `[aria-labelledby="claude-auto-switch-account-${id}"]`
  )!
}

function lineOption(container: HTMLElement, label: string): HTMLButtonElement {
  return Array.from(container.querySelectorAll<HTMLButtonElement>('[role="radio"]')).find(
    (option) => option.textContent === label
  )!
}

describe('Claude auto-switch options', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  afterEach(() => {
    cleanup()
  })

  it('starts at 90% with every account taking part', () => {
    const { container } = renderOptions()

    expect(lineOption(container, '90%').getAttribute('aria-checked')).toBe('true')
    expect(['a', 'b', 'c'].map((id) => accountSwitch(container, id).dataset.state)).toEqual([
      'checked',
      'checked',
      'checked'
    ])
  })

  it('stores the line picked', () => {
    const { container, updateSettings } = renderOptions()

    fireEvent.click(lineOption(container, 'At limit'))

    expect(updateSettings).toHaveBeenCalledWith({ claudeAutoSwitchThresholdPercent: 100 })
  })

  it('warns that waiting for the limit lets running work stop first', () => {
    const note = 'Orca waits until the account is out'

    expect(renderOptions().container.textContent).not.toContain(note)
    cleanup()
    expect(
      renderOptions({ claudeAutoSwitchThresholdPercent: 100 }).container.textContent
    ).toContain(note)
  })

  it('turns one account off, and back on, without touching the others', () => {
    const off = renderOptions({ claudeAutoSwitchExcludedAccountIds: ['c'] })

    fireEvent.click(accountSwitch(off.container, 'b'))
    expect(off.updateSettings).toHaveBeenCalledWith({
      claudeAutoSwitchExcludedAccountIds: ['c', 'b']
    })

    fireEvent.click(accountSwitch(off.container, 'c'))
    expect(off.updateSettings).toHaveBeenLastCalledWith({ claudeAutoSwitchExcludedAccountIds: [] })
  })

  it('says when fewer than two signed-in accounts are left to switch between', () => {
    const needsTwo = 'Turn on at least two signed-in accounts'

    expect(renderOptions().container.textContent).not.toContain(needsTwo)
    cleanup()
    expect(
      renderOptions({ claudeAutoSwitchExcludedAccountIds: ['b', 'c'] }).container.textContent
    ).toContain(needsTwo)
    cleanup()
    expect(
      renderOptions({ claudeAutoSwitchExcludedAccountIds: ['c'] }, [
        account('a'),
        account('b', { needsSignIn: true }),
        account('c')
      ]).container.textContent
    ).toContain(needsTwo)
  })

  it('describes the line in use', () => {
    expect(getClaudeAutoSwitchDescription({})).toContain('reaches 90% of its 5-hour or weekly')
    expect(getClaudeAutoSwitchDescription({ claudeAutoSwitchThresholdPercent: 80 })).toContain(
      'reaches 80%'
    )
    expect(getClaudeAutoSwitchDescription({ claudeAutoSwitchThresholdPercent: 100 })).toContain(
      'hits its 5-hour or weekly limit'
    )
  })
})
