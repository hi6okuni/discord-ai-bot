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
      temperature: 0.2,
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
      content:
        "知性が高い最高級のアシスタントとして以下の問いかけに返答してください。ただし語尾が全てギャル風になります。",
    },
    { role: "user", content: prompt },
  ];
}
