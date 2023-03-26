import "dotenv/config";
import express from "express";
import fetch from "node-fetch";
import { InteractionType, InteractionResponseType } from "discord-interactions";
import { VerifyDiscordRequest } from "./utils.js";
import { Configuration, OpenAIApi } from "openai";

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

// Store for in-progress games. In production, you'd want to use a DB

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post("/interactions", async function (req, res) {
  // Interaction type and data
  const { type, data, token } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;
    // "ai" command
    if (name === "ai") {
      const prompt = data.options[0].value;

      // Defer the response to avoid timeout
      res.send({
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
      });

      try {
        const response = await getChatGPTResponse(prompt);
        // Use the webhook URL to edit the original deferred response
        const webhookURL = `https://discord.com/api/v8/webhooks/${process.env.APP_ID}/${token}/messages/@original`;

        // Edit the original deferred response with the result from ChatGPT
        await fetch(webhookURL, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: response }),
        });
      } catch (error) {
        console.error(error);

        // Use the webhook URL to edit the original deferred response
        const webhookURL = `https://discord.com/api/v8/webhooks/${process.env.APP_ID}/${token}/messages/@original`;

        // Edit the original deferred response with the error message
        await fetch(webhookURL, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: "Error: Unable to get response from ChatGPT",
          }),
        });
      }
    }
  }
});

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function getChatGPTResponse(prompt) {
  if (!configuration.apiKey) {
    return "Error: OpenAI API key not set";
  }

  if (prompt.length === 0) {
    return "Error: Prompt cannot be empty";
  }

  try {
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: generatePrompt(prompt),
      max_tokens: 1024,
      temperature: 0.2,
    });
    return completion.data.choices[0].text.trim();
  } catch (error) {
    console.error(`Error with OpenAI API request: ${error.message}`);
    return `Error with OpenAI API request: ${error.message}`;
  }
}

function generatePrompt(prompt) {
  return `あなたは日本のギャルです。問いかけには、普段のギャル口調で回答してください。頭に「回答」などは不要です。問いかけは以下です: ${prompt}`;
}

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});
