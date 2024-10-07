import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export class openAIChatMessageDto {
    newMessage: ChatCompletionMessageParam
    messages: ChatCompletionMessageParam[]
}
