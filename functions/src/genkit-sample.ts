// Genkit imports and configuration
import { genkit, z } from 'genkit/beta';
import { gemini10Pro, googleAI } from "@genkit-ai/googleai";
import { onCallGenkit } from 'firebase-functions/https';

// Configure Genkit with the GoogleAI plugin and default model
const ai = genkit({
  plugins: [googleAI()],
  model: gemini10Pro,
});

// Define a simple flow that prompts an LLM to generate menu suggestions.
export const menuSuggestionFlow = ai.defineFlow(
  {
    name: "menuSuggestionFlow",
    inputSchema: z.string().describe("A restaurant theme").default("seafood"),
    outputSchema: z.string(),
    streamSchema: z.string(),
  },
  async (subject: string) => {
    // Construct a request and send it to the model API.
    const prompt = `Suggest an item for the menu of a ${subject} themed restaurant`;
    // Use the simple generate(prompt) form which returns a response object
    const res = await ai.generate(prompt);
    // Return the text output (SDK returns as res.outputText or similar)
    // Fallback to JSON.stringify if structure differs.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const text = (res as any).outputText ?? JSON.stringify(res);
    return text as string;
  }
);

export const menuSuggestion = onCallGenkit(
  {
    // Uncomment to enable AppCheck. This can reduce costs by ensuring only your
    // Verified app users can use your API. Read more at
    // https://firebase.google.com/docs/app-check/cloud-functions
    // enforceAppCheck: true,

    // authPolicy can be any callback that accepts an AuthData (a uid and
    // tokens dictionary) and the request data. The isSignedIn() and hasClaim()
    // helpers can be used to simplify. The following will require the user to
    // have the email_verified claim, for example.
    // authPolicy: hasClaim("email_verified"),
  },
  menuSuggestionFlow
);
