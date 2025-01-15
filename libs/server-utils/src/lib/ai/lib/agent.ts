import { CoreTool, generateText, LanguageModel } from "ai";

export class Agent<TOOLS extends Record<string, CoreTool>, OUTPUT = never> {
  constructor(
    private readonly tools: TOOLS,
    private readonly model: LanguageModel,
  ) {}

  async generateText(prompt: string): Promise<OUTPUT> {
    const { experimental_output } = await generateText<TOOLS, OUTPUT>({
      model: this.model,
      tools: this.tools,
      prompt,
    });

    return experimental_output;
  }
}
