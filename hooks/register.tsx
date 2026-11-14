import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

const isBusy = atom({ plugin: 'prompt-master', key: 'isBusy' } as const, false)

const SYSTEM_PROMPT = `You rewrite a person's rough draft into a clear, well-structured prompt for an AI assistant.

Rules:
- Keep the person's intent, scope and constraints exactly as given. Never add requirements, steps or assumptions they did not state.
- Fix grammar and ambiguity, and make the ask concrete and specific.
- Add structure (short paragraphs, a numbered list) only when the draft is long or multi-part enough to need it. A short draft stays short.
- Keep their tone and any technical terms they used.
- Reply with ONLY the rewritten prompt. No preamble, no explanation, no quotes or markdown fences around it.`

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    // A crash mid-rewrite could leave isBusy stuck true from a prior session.
    await update($, isBusy, () => false)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) {
      return next(e)
    }

    const busy = await read($, isBusy)
    const { Box, Button } = $.ui.resolve(e)

    return (
      <Box>
        <Button
          key="prompt-master"
          label={busy ? 'Rewriting…' : '✦ Prompt Master'}
          hotkey="m"
          onPress={async () => {
            if (await read($, isBusy)) {
              return
            }

            const { text } = await $.prompt.read()
            if (!text.trim()) {
              $.ui.toast('Nothing to rewrite — type a draft first')
              return
            }

            await update($, isBusy, () => true)
            try {
              const r = await $.model.complete({
                model: 'sonnet',
                system: SYSTEM_PROMPT,
                prompt: text,
                effort: 'low',
                timeoutMs: 20000,
              })

              if (r.isAnswered && r.text.trim()) {
                await $.prompt.fill({ text: r.text.trim(), mode: 'replace' })
              } else {
                $.ui.toast(
                  r.isAnswered ? 'Rewrite came back empty' : `Rewrite failed: ${r.reason}`,
                )
              }
            } finally {
              await update($, isBusy, () => false)
            }
          }}
        />
      </Box>
    )
  })
}
