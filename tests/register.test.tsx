import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'prompt-master',
  component: 'AbovePrompt',
  requestId: 'prompt-master',
  props: {
    hasSurvey: false,
    isCollapsed: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 60,
    scroll: { offset: 0, bodyRows: 10 },
    view: {},
  },
} as const

test('rewrites the draft and fills it back in, on every surface', async ($, on) => {
  on('prompt.read', () => ({ value: { text: 'fix the thing in the file idk', cursor: 30 } }))
  const usage = { input_tokens: 10, output_tokens: 8, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }
  on('model.complete', (_, e) => {
    expect(e.prompt).toBe('fix the thing in the file idk')
    return { value: { isAnswered: true, text: 'Fix the bug in auth.ts.', usage } }
  })

  let filled: string | undefined
  on('prompt.fill', (_, e) => {
    filled = e.text
    return { isFilled: true }
  })

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    filled = undefined
    const ui = await $.ui.mount({ ...BAND, surface })

    await ui.press({ key: 'prompt-master' })

    expect(filled).toBe('Fix the bug in auth.ts.')
    await ui.unmount()
  }
})

test('does nothing on an empty draft', async ($, on) => {
  on('prompt.read', () => ({ value: { text: '   ', cursor: 3 } }))
  on('model.complete', () => {
    throw new Error('should not call the model for an empty draft')
  })

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await ui.press({ key: 'prompt-master' })
  await ui.unmount()
})

test('a busy flag left stuck by a crashed session is cleared at startup', async ($, on) => {
  const ref = { plugin: 'prompt-master', key: 'isBusy' } as const
  let stored = { value: true, version: 1 }
  on('state.get', ref, () => ({ value: { value: stored.value, version: stored.version } }))
  on('state.set', ref, (_, e) => {
    stored = { value: e.value, version: stored.version + 1 }
    return { value: { isSet: true, version: stored.version } }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  expect(stored.value).toBe(false)

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })

  expect((await ui.find({ key: 'prompt-master' }))?.text).toBe('✦ Prompt Master')
  await ui.unmount()
})
