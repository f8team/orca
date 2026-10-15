import { translate } from '@/i18n/i18n'
import {
  CLAUDE_AUTO_SWITCH_THRESHOLD_PRESETS,
  getClaudeAutoSwitchThresholdPercent,
  isClaudeAccountInAutoSwitch,
  withClaudeAccountInAutoSwitch
} from '../../../../shared/claude-auto-switch-settings'
import type { GlobalSettings } from '../../../../shared/global-settings-types'
import type { ClaudeRateLimitAccountsState } from '../../../../shared/managed-account-types'
import { Label } from '../ui/label'
import { SettingsSegmentedControl, SettingsSwitch } from './SettingsFormControls'

type ClaudeAutoSwitchSettings = Pick<
  GlobalSettings,
  'claudeAutoSwitchThresholdPercent' | 'claudeAutoSwitchExcludedAccountIds'
>

/** The switch's description, naming the line the user picked. */
export function getClaudeAutoSwitchDescription(settings: ClaudeAutoSwitchSettings): string {
  const thresholdPercent = getClaudeAutoSwitchThresholdPercent(settings)
  return thresholdPercent >= 100
    ? translate(
        'accounts.claude.autoSwitchDescriptionAtLimit',
        'When the selected account hits its 5-hour or weekly limit, new Claude sessions start on the account with the most room left. Running sessions keep their account.'
      )
    : translate(
        'accounts.claude.autoSwitchDescriptionAt',
        'When the selected account reaches {{value0}}% of its 5-hour or weekly limit, new Claude sessions start on the account with the most room left. Running sessions keep their account.',
        { value0: thresholdPercent }
      )
}

type ClaudeAutoSwitchOptionsProps = {
  accounts: ClaudeRateLimitAccountsState['accounts']
  settings: ClaudeAutoSwitchSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void
}

/** The line and the accounts automatic switching uses, shown once the switch is on. */
export function ClaudeAutoSwitchOptions({
  accounts,
  settings,
  updateSettings
}: ClaudeAutoSwitchOptionsProps): React.JSX.Element {
  const thresholdPercent = getClaudeAutoSwitchThresholdPercent(settings)
  const usableInRotation = accounts.filter(
    (account) => !account.needsSignIn && isClaudeAccountInAutoSwitch(settings, account.id)
  ).length

  return (
    <div className="ml-4 space-y-4 border-l border-border pl-4">
      <div className="flex items-start justify-between gap-4 max-md:flex-col">
        <div className="min-w-0 shrink space-y-0.5">
          <Label>{translate('accounts.claude.autoSwitchThreshold', 'Switch at')}</Label>
          <p className="text-xs text-muted-foreground">
            {translate(
              'accounts.claude.autoSwitchThresholdDescription',
              'How close the selected account gets to a limit before new sessions move on.'
            )}
          </p>
        </div>
        <SettingsSegmentedControl
          value={thresholdPercent}
          onChange={(next) => updateSettings({ claudeAutoSwitchThresholdPercent: next })}
          ariaLabel={translate(
            'accounts.claude.autoSwitchThresholdAriaLabel',
            'Usage that starts a switch'
          )}
          size="sm"
          options={CLAUDE_AUTO_SWITCH_THRESHOLD_PRESETS.map((preset) => ({
            value: preset,
            label:
              preset >= 100
                ? translate('accounts.claude.autoSwitchAtLimit', 'At limit')
                : `${preset}%`
          }))}
        />
      </div>
      {thresholdPercent >= 100 ? (
        <p className="-mt-2 text-xs text-muted-foreground">
          {translate(
            'accounts.claude.autoSwitchAtLimitNote',
            'Orca waits until the account is out, so a session running on it stops first.'
          )}
        </p>
      ) : null}

      <div className="space-y-2">
        <div className="space-y-0.5">
          <Label>
            {translate('accounts.claude.autoSwitchAccounts', 'Accounts to switch between')}
          </Label>
          <p className="text-xs text-muted-foreground">
            {translate(
              'accounts.claude.autoSwitchAccountsDescription',
              'Orca never switches to or away from an account that is off. You can still pick it yourself.'
            )}
          </p>
        </div>
        <ul className="divide-y divide-border/60 rounded-md border border-border/70">
          {accounts.map((account) => {
            const labelId = `claude-auto-switch-account-${account.id}`
            const included = isClaudeAccountInAutoSwitch(settings, account.id)
            return (
              <li key={account.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span id={labelId} className="truncate text-sm">
                    {account.email}
                  </span>
                  {account.needsSignIn ? (
                    <span className="truncate text-[11px] text-muted-foreground">
                      {translate(
                        'accounts.claude.signInRequired',
                        'Sign in again to use this account'
                      )}
                    </span>
                  ) : null}
                </div>
                <SettingsSwitch
                  checked={included}
                  ariaLabelledBy={labelId}
                  onChange={() =>
                    updateSettings({
                      claudeAutoSwitchExcludedAccountIds: withClaudeAccountInAutoSwitch(
                        settings,
                        account.id,
                        !included
                      )
                    })
                  }
                />
              </li>
            )
          })}
        </ul>
        {usableInRotation < 2 ? (
          <p className="text-xs text-muted-foreground">
            {translate(
              'accounts.claude.autoSwitchNeedsTwo',
              'Turn on at least two signed-in accounts so there is one to switch to.'
            )}
          </p>
        ) : null}
      </div>
    </div>
  )
}
