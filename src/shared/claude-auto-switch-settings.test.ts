import { describe, expect, it } from 'vitest'
import {
  getClaudeAutoSwitchThresholdPercent,
  isClaudeAccountInAutoSwitch,
  withClaudeAccountInAutoSwitch
} from './claude-auto-switch-settings'

describe('getClaudeAutoSwitchThresholdPercent', () => {
  it('uses 90% until a line is chosen', () => {
    expect(getClaudeAutoSwitchThresholdPercent({})).toBe(90)
  })

  it('keeps a line Settings offers', () => {
    expect(getClaudeAutoSwitchThresholdPercent({ claudeAutoSwitchThresholdPercent: 80 })).toBe(80)
    expect(getClaudeAutoSwitchThresholdPercent({ claudeAutoSwitchThresholdPercent: 100 })).toBe(100)
  })

  it('falls back to 90% for a value Settings does not offer', () => {
    for (const stored of [0, 42, 101, Number.NaN]) {
      expect(
        getClaudeAutoSwitchThresholdPercent({ claudeAutoSwitchThresholdPercent: stored })
      ).toBe(90)
    }
  })
})

describe('claude auto-switch accounts', () => {
  it('counts every account in until it is turned off', () => {
    expect(isClaudeAccountInAutoSwitch({}, 'a')).toBe(true)
    expect(isClaudeAccountInAutoSwitch({ claudeAutoSwitchExcludedAccountIds: ['a'] }, 'a')).toBe(
      false
    )
  })

  it('turns one account off and on without touching the others', () => {
    const settings = { claudeAutoSwitchExcludedAccountIds: ['b'] }

    expect(withClaudeAccountInAutoSwitch(settings, 'a', false)).toEqual(['b', 'a'])
    expect(withClaudeAccountInAutoSwitch(settings, 'b', true)).toEqual([])
    expect(withClaudeAccountInAutoSwitch(settings, 'b', false)).toEqual(['b'])
  })
})
