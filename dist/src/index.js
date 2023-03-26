import "dotenv/config";
import express from "express";
import fetch from "node-fetch";
import { InteractionType, InteractionResponseType } from "discord-interactions";
import { VerifyDiscordRequest } from "./utils.js";
import { getChatGPTResponse } from "./chatgpt.js";
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));
app.post("/interactions", async function (req, res) {
    const { type, data, token } = req.body;
    if (type === InteractionType.PING) {
        return res.send({ type: InteractionResponseType.PONG });
    }
    if (type === InteractionType.APPLICATION_COMMAND) {
        const { name } = data;
        if (name === "ai") {
            const prompt = data.options[0].value;
            res.send({
                type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
            });
            try {
                const response = await getChatGPTResponse(prompt);
                const webhookURL = `https://discord.com/api/v8/webhooks/${process.env.APP_ID}/${token}/messages/@original`;
                await fetch(webhookURL, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ content: response }),
                });
            }
            catch (error) {
                console.error(error);
                const webhookURL = `https://discord.com/api/v8/webhooks/${process.env.APP_ID}/${token}/messages/@original`;
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
//# sourceMappingURL=index.js.map