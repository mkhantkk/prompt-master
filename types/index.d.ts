export type RewriteState = {
  isBusy: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'prompt-master': { isBusy: boolean }
  }
}
