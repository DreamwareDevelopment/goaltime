import { Zep } from '@getzep/zep-cloud';
import { CoreMessage } from 'ai';

export * from './agent';
export * from './events';
export * from './goals';
export * from './user';
export * from './zep';

export function zepMessageToCoreMessage(message: Zep.Message): CoreMessage {
  return {
    role: message.role as "user" | "assistant",
    content: message.content,
  }
}

export function buildMessages(systemPrompt: string, messages: Zep.Message[] | undefined): CoreMessage[] {
  const messagesToSend: CoreMessage[] = []
  messagesToSend.push({
    role: "system",
    content: systemPrompt,
  })
  messagesToSend.push(...zepMessagesToCoreMessages(messages))
  return messagesToSend;
}

export function zepMessagesToCoreMessages(messages: Zep.Message[] | undefined): CoreMessage[] {
  const messagesToSend: CoreMessage[] = []
  if (messages) {
    for (const message of messages) {
      if (message.role === "user" || message.role === "assistant") {
        messagesToSend.push(zepMessageToCoreMessage(message))
      }
    }
  }
  return messagesToSend;
}