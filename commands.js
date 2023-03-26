import "dotenv/config";
import { InstallGlobalCommands } from "./utils.js";

const AI_COMMAND = {
  name: "ai",
  description: "Interact with ChatGPT AI",
  options: [
    {
      type: 3,
      name: "prompt",
      description: "The prompt you want to send to ChatGPT",
      required: true,
    },
  ],
  type: 1,
};

const ALL_COMMANDS = [AI_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
