/**
 * DeepSeek provider types.
 *
 * DeepSeek exposes an OpenAI-compatible API, so we reuse the OpenAI
 * request/response/message/tool schemas and model types.
 */
import type OpenAIProvider from "openai";
import type { z } from "zod";
import * as DeepseekAPI from "./api";
import * as DeepseekMessages from "./messages";
import type * as DeepseekModels from "./models";
import * as DeepseekTools from "./tools";

namespace Deepseek {
  export const API = DeepseekAPI;
  export const Messages = DeepseekMessages;
  export const Tools = DeepseekTools;

  export namespace Types {
    export type ChatCompletionsHeaders = z.infer<
      typeof DeepseekAPI.ChatCompletionsHeadersSchema
    >;
    export type ChatCompletionsRequest = z.infer<
      typeof DeepseekAPI.ChatCompletionRequestSchema
    >;
    export type ChatCompletionsResponse = z.infer<
      typeof DeepseekAPI.ChatCompletionResponseSchema
    >;
    export type Usage = z.infer<typeof DeepseekAPI.ChatCompletionUsageSchema>;

    export type FinishReason = z.infer<typeof DeepseekAPI.FinishReasonSchema>;
    export type Message = z.infer<typeof DeepseekMessages.MessageParamSchema>;
    export type Role = Message["role"];

    export type ChatCompletionChunk =
      OpenAIProvider.Chat.Completions.ChatCompletionChunk;
    export type Model = z.infer<typeof DeepseekModels.ModelSchema>;
    export type OrlandoModel = z.infer<typeof DeepseekModels.OrlandoModelSchema>;
  }
}

export default Deepseek;

