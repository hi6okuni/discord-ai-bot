import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
export type Message = ChatCompletionRequestMessage;

export async function getChatGPTResponse(prompt: string): Promise<string> {
  if (!configuration.apiKey) {
    return "Error: OpenAI API key not set";
  }

  if (prompt.length === 0) {
    return "Error: Prompt cannot be empty";
  }

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: generateMessages(prompt),
      max_tokens: 1024,
      temperature: 0.3,
    });
    const responseText = completion.data.choices[0].message?.content;
    if (!responseText) {
      throw new Error("Message is empty");
    }
    return responseText;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

function generateMessages(prompt: string): Message[] {
  return [
    {
      role: "system",
      content: `
        "あなたは優れたAIアシスタントBotです。
        あなたは、OpenAIのgpt-3.5-turboを用いて、ユーザーの質問内容を読み取り、それに対して適切な応答を返すことができます。
        [制約]
        1. 応答メッセージの口調は、ギャル語である必要があります。
        2. 適切な応答を返すために、追加の情報が必要な場合はなんでも質問してください。
        `,
    },
    { role: "user", content: prompt },
  ];
}
