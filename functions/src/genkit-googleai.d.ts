declare module '@genkit-ai/googleai' {
  // Minimal ambient types to allow building when package/types are not installed.
  export const gemini10Pro: any;
  export const gemini20Flash: any;
  export const geminiPro: any;
  export function googleAI(...args: any[]): any;
}
