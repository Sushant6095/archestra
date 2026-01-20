/**
 * Perplexity AI provider types
 * Perplexity is OpenAI-compatible, so we reuse OpenAI-style types
 */
import type { z } from "zod";
import * as PerplexityAPI from "./api";
import * as PerplexityMessages from "./messages";
import type * as PerplexityModels from "./models";
import * as PerplexityTools from "./tools";

namespace Perplexity {
  export const API = PerplexityAPI;
  export const Messages = PerplexityMessages;
  export const Tools = PerplexityTools;

  export namespace Types {
    export type ChatCompletionsHeaders = z.infer<
      typeof PerplexityAPI.ChatCompletionsHeadersSchema
    >;
    export type ChatCompletionsRequest = z.infer<
      typeof PerplexityAPI.ChatCompletionRequestSchema
    >;
    export type ChatCompletionsResponse = z.infer<
      typeof PerplexityAPI.ChatCompletionResponseSchema
    >;
    export type Usage = z.infer<typeof PerplexityAPI.ChatCompletionUsageSchema>;

    export type FinishReason = z.infer<typeof PerplexityAPI.FinishReasonSchema>;
    export type Message = z.infer<typeof PerplexityMessages.MessageParamSchema>;
    export type Role = Message["role"];

    export type ChatCompletionChunk = {
      id: string;
      object: "chat.completion.chunk";
      created: number;
      model: string;
      choices: Array<{
        index: number;
        delta: {
          role?: "assistant";
          content?: string | null;
          tool_calls?: Array<{
            index: number;
            id: string;
            type: "function";
            function: {
              name?: string;
              arguments?: string;
            };
          }>;
        };
        finish_reason?: string | null;
      }>;
    };
    export type Model = z.infer<typeof PerplexityModels.ModelSchema>;
    export type OrlandoModel = z.infer<typeof PerplexityModels.OrlandoModelSchema>;
  }
}

export default Perplexity;
