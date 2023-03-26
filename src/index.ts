import "dotenv/config";
import express from "express";
import fetch from "node-fetch";
import { InteractionType, InteractionResponseType } from "discord-interactions";
import { VerifyDiscordRequest } from "./utils";
import { getChatGPTResponse } from "./chatgpt";

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

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});
