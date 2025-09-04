// src/openai-assistant.js
import OpenAI from "openai";

export default class OpenAIAssistant {
  constructor(apiKey) {
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true, // ⚠️ only for demos
    });
    this.assistant = null;
    this.thread = null; // will hold thread ID only
  }

  async initialize() {
    // Create assistant
    this.assistant = await this.client.beta.assistants.create({
      name: "HeyGen Assistant",
      instructions: "You are a helpful assistant for HeyGen avatar streaming.",
      model: "gpt-4.1", // ✅ use supported model
    });

    // Create thread and store only ID
    const thread = await this.client.beta.threads.create();
    this.thread = thread.id;

    console.log("✅ Assistant initialized:", this.assistant.id);
    console.log("✅ Thread created:", this.thread);
  }

  async sendMessage(message) {
    if (!this.thread || !this.assistant) {
      throw new Error("Assistant not initialized. Call initialize() first.");
    }

    // Add user message to thread
    await this.client.beta.threads.messages.create(this.thread, {
      role: "user",
      content: message,
    });

    // Run assistant
    const run = await this.client.beta.threads.runs.create(this.thread, {
      assistant_id: this.assistant.id,
    });

    // Poll until run completes
    let runStatus;
    do {
      runStatus = await this.client.beta.threads.runs.retrieve(this.thread, run.id);
      if (runStatus.status === "in_progress") {
        await new Promise((res) => setTimeout(res, 1000));
      }
    } while (runStatus.status === "in_progress");

    // Get last message
    const messages = await this.client.beta.threads.messages.list(this.thread);
    const lastMessage = messages.data[0];

    return lastMessage?.content[0]?.text?.value || "No response";
  }
}
