import type { archestraApiTypes } from "@shared";
import type { PartialUIMessage } from "@/components/chatbot-demo";
import type { DualLlmResult, Interaction, InteractionUtils } from "./common";

export default class PerplexityChatCompletionInteraction
  implements InteractionUtils
{
  private interaction: Interaction;
  private request: archestraApiTypes.GetInteractionResponses["200"]["request"] &
    {
      model: string;
      messages: Array<{
        role: "system" | "user" | "assistant" | "tool";
        content: string | null;
        tool_call_id?: string;
        tool_calls?: Array<{
          id: string;
          type: "function";
          function: {
            name: string;
            arguments: string;
          };
        }>;
      }>;
    };
  private response: archestraApiTypes.GetInteractionResponses["200"]["response"] &
    {
      choices: Array<{
        message: {
          role: "assistant";
          content: string | null;
          tool_calls?: Array<{
            id: string;
            type: "function";
            function: {
              name: string;
              arguments: string;
            };
          }>;
        };
        finish_reason: string | null;
      }>;
    };

  modelName: string;

  constructor(interaction: Interaction) {
    this.interaction = interaction;
    this.request = interaction.request as this["request"];
    this.response = interaction.response as this["response"];
    this.modelName = interaction.model || this.request.model || "unknown";
  }

  getLastUserMessage(): string {
    // Find the last user message in the request
    for (let i = this.request.messages.length - 1; i >= 0; i--) {
      const message = this.request.messages[i];
      if (message.role === "user") {
        if (typeof message.content === "string") {
          return message.content;
        }
        return "";
      }
    }
    return "";
  }

  getLastAssistantResponse(): string {
    const choice = this.response.choices[0];
    if (!choice) return "";
    return choice.message.content || "";
  }

  isLastMessageToolCall(): boolean {
    const choice = this.response.choices[0];
    if (!choice) return false;
    return (
      choice.finish_reason === "tool_calls" &&
      (choice.message.tool_calls?.length ?? 0) > 0
    );
  }

  getLastToolCallId(): string | null {
    const choice = this.response.choices[0];
    if (!choice?.message.tool_calls) return null;
    const lastToolCall = choice.message.tool_calls[
      choice.message.tool_calls.length - 1
    ];
    return lastToolCall?.id ?? null;
  }

  getToolNamesUsed(): string[] {
    const choice = this.response.choices[0];
    if (!choice?.message.tool_calls) return [];
    return choice.message.tool_calls.map((tc) => tc.function.name);
  }

  getToolNamesRequested(): string[] {
    if (!this.request.messages) return [];
    // Find the last assistant message with tool_calls
    for (let i = this.request.messages.length - 1; i >= 0; i--) {
      const message = this.request.messages[i];
      if (message.role === "assistant" && message.tool_calls) {
        return message.tool_calls.map((tc) => tc.function.name);
      }
    }
    return [];
  }

  getToolNamesRefused(): string[] {
    // Perplexity doesn't have a tool refusal mechanism in the response
    return [];
  }

  getToolRefusedCount(): number {
    // Perplexity doesn't have a tool refusal mechanism in the response
    return 0;
  }

  mapToUiMessages(dualLlmResults?: DualLlmResult[]): PartialUIMessage[] {
    const messages: PartialUIMessage[] = [];

    // Process request messages
    for (const message of this.request.messages) {
      if (message.role === "user") {
        messages.push({
          role: "user",
          content:
            typeof message.content === "string" ? message.content : "",
        });
      } else if (message.role === "assistant") {
        const assistantMessage: PartialUIMessage = {
          role: "assistant",
          content: "",
        };

        if (message.tool_calls && message.tool_calls.length > 0) {
          assistantMessage.toolCalls = message.tool_calls.map((tc) => ({
            id: tc.id,
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments || "{}"),
          }));
        }

        messages.push(assistantMessage);
      } else if (message.role === "tool") {
        // Tool results are handled by matching tool_call_id
        // This is typically shown in the UI as part of the assistant's response
      }
    }

    // Add the response message
    const choice = this.response.choices[0];
    if (choice) {
      const responseMessage: PartialUIMessage = {
        role: "assistant",
        content: choice.message.content || "",
      };

      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        responseMessage.toolCalls = choice.message.tool_calls.map((tc) => ({
          id: tc.id,
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments || "{}"),
        }));
      }

      // Add dual LLM results if available
      if (dualLlmResults && dualLlmResults.length > 0) {
        responseMessage.dualLlmResults = dualLlmResults;
      }

      messages.push(responseMessage);
    }

    return messages;
  }
}
