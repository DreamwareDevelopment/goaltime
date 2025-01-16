import { generateText } from "ai";

import { buildMessages, zep } from "../lib";
import { openai } from "@ai-sdk/openai";

export async function helpAgent(sessionId: string) {
  const memory = await zep.memory.get(sessionId);
  const messages = memory.messages;
  const systemPrompt = `{
    role: "You are to help the user understand how to use this agent. 
    Tell them the relevant capabilities of this agent or just the one relevant to them.
    You are to respond to the user in a friendly and helpful manner with concise answers befitting an sms conversation.",
    capabilities: [
      "give accountability update on an event",
      "change scheduling preferences for a goal",
      "end conversation",
      "inquiry about one or more goals",
      "inquiry about one or more events, either upcoming or past",
      "reschedule an upcoming event",
    ],
    context: "${JSON.stringify(memory.context, null, 2)}"
  }`;
  const messagesToSend = buildMessages(systemPrompt, messages);
  const response = await generateText({
    model: openai("gpt-4o-mini"),
    messages: messagesToSend,
  })
  return response.text;
}
