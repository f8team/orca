import type { GlobalSettings } from './global-settings-types'

type ClaudeAutoSwitchPreferences = Pick<
  GlobalSettings,
  'claudeAutoSwitchThresholdPercent' | 'claudeAutoSwitchExcludedAccountIds'
>

/** The usage lines Settings offers; 100 switches only once the selected account is at its limit. */
export const CLAUDE_AUTO_SWITCH_THRESHOLD_PRESETS = [80, 90, 95, 100] as const

export const DEFAULT_CLAUDE_AUTO_SWITCH_THRESHOLD_PERCENT = 90

/** The line the selected account must reach before Orca switches, from a stored value that may be stale or hand-edited. */
export function getClaudeAutoSwitchThresholdPercent(settings: ClaudeAutoSwitchPreferences): number {
  const stored = settings.claudeAutoSwitchThresholdPercent
  const offered = CLAUDE_AUTO_SWITCH_THRESHOLD_PRESETS.find((preset) => preset === stored)
  return offered ?? DEFAULT_CLAUDE_AUTO_SWITCH_THRESHOLD_PERCENT
}

/** Accounts take part unless turned off, so an account added later joins without a visit to Settings. */
export function isClaudeAccountInAutoSwitch(
  settings: ClaudeAutoSwitchPreferences,
  accountId: string
): boolean {
  return !settings.claudeAutoSwitchExcludedAccountIds?.includes(accountId)
}

/** The exclusion list after turning one account on or off for automatic switching. */
export function withClaudeAccountInAutoSwitch(
  settings: ClaudeAutoSwitchPreferences,
  accountId: string,
  included: boolean
): string[] {
  const excluded = (settings.claudeAutoSwitchExcludedAccountIds ?? []).filter(
    (id) => id !== accountId
  )
  return included ? excluded : [...excluded, accountId]
}
