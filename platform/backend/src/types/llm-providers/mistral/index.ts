/**
 * Mistral Type Definitions
 *
 * Mistral is an AI provider with an OpenAI-compatible API.
 * See: https://docs.mistral.ai/api/
 *
 * NOTE: Mistral types are very similar to OpenAI since Mistral implements the OpenAI API.
 * The main differences are:
 * - Mistral requires API keys
 * - Mistral provides models like mistral-large-latest, mistral-medium-latest, pixtral-12b
 */
import type OpenAIProvider from "openai";
import type { z } from "zod";
import * as MistralAPI from "./api";
import * as MistralMessages from "./messages";
import type * as MistralModels from "./models";
import * as MistralTools from "./tools";

namespace Mistral {
  export const API = MistralAPI;
  export const Messages = MistralMessages;
  export const Tools = MistralTools;

  export namespace Types {
    export type ChatCompletionsHeaders = z.infer<
      typeof MistralAPI.ChatCompletionsHeadersSchema
    >;
    export type ChatCompletionsRequest = z.infer<
      typeof MistralAPI.ChatCompletionRequestSchema
    >;
    export type ChatCompletionsResponse = z.infer<
      typeof MistralAPI.ChatCompletionResponseSchema
    >;
    export type Usage = z.infer<typeof MistralAPI.ChatCompletionUsageSchema>;

    export type FinishReason = z.infer<typeof MistralAPI.FinishReasonSchema>;
    export type Message = z.infer<typeof MistralMessages.MessageParamSchema>;
    export type Role = Message["role"];

    // Mistral uses OpenAI-compatible streaming format
    export type ChatCompletionChunk =
      OpenAIProvider.Chat.Completions.ChatCompletionChunk;
    export type Model = z.infer<typeof MistralModels.ModelSchema>;
  }
}

export default Mistral;
