import { z } from "zod";

const FunctionToolCallSchema = z
  .object({
    id: z.string(),
    type: z.enum(["function"]),
    function: z
      .object({
        arguments: z.string(),
        name: z.string(),
      })
      .describe(
        `https://docs.perplexity.ai/api-reference/chat-completions-post`,
      ),
  })
  .describe(
    `https://docs.perplexity.ai/api-reference/chat-completions-post`,
  );

const CustomToolCallSchema = z
  .object({
    id: z.string(),
    type: z.enum(["custom"]),
    custom: z
      .object({
        input: z.string(),
        name: z.string(),
      })
      .describe(
        `https://docs.perplexity.ai/api-reference/chat-completions-post`,
      ),
  })
  .describe(
    `https://docs.perplexity.ai/api-reference/chat-completions-post`,
  );

export const ToolCallSchema = z
  .union([FunctionToolCallSchema, CustomToolCallSchema])
  .describe(
    `https://docs.perplexity.ai/api-reference/chat-completions-post`,
  );

const ContentPartRefusalSchema = z
  .object({
    type: z.enum(["refusal"]),
    refusal: z.string(),
  })
  .describe(
    `https://docs.perplexity.ai/api-reference/chat-completions-post`,
  );

const ContentPartTextSchema = z
  .object({
    type: z.enum(["text"]),
    text: z.string(),
  })
  .describe(
    `https://docs.perplexity.ai/api-reference/chat-completions-post`,
  );

const ContentPartImageSchema = z
  .object({
    type: z.enum(["image_url"]),
    image_url: z
      .object({
        url: z.string(),
        detail: z.enum(["auto", "low", "high"]).optional(),
      })
      .describe(
        `https://docs.perplexity.ai/api-reference/chat-completions-post`,
      ),
  })
  .describe(
    `https://docs.perplexity.ai/api-reference/chat-completions-post`,
  );

const ContentPartInputAudioSchema = z
  .object({
    type: z.enum(["input_audio"]),
    input_audio: z
      .object({
        data: z.string(),
        format: z.enum(["wav", "mp3"]),
      })
      .describe(
        `https://docs.perplexity.ai/api-reference/chat-completions-post`,
      ),
  })
  .describe(
    `https://docs.perplexity.ai/api-reference/chat-completions-post`,
  );

const ContentPartFileSchema = z
  .object({
    type: z.enum(["file"]),
    file: z
      .object({
        file_data: z.string().optional(),
        file_id: z.string().optional(),
        filename: z.string().optional(),
      })
      .describe(
        `https://docs.perplexity.ai/api-reference/chat-completions-post`,
      ),
  })
  .describe(
    `https://docs.perplexity.ai/api-reference/chat-completions-post`,
  );

const ContentPartSchema = z
  .union([
    ContentPartTextSchema,
    ContentPartImageSchema,
    ContentPartInputAudioSchema,
    ContentPartFileSchema,
  ])
  .describe(
    `https://docs.perplexity.ai/api-reference/chat-completions-post`,
  );

const DeveloperMessageParamSchema = z
  .object({
    content: z.union([z.string(), z.array(ContentPartTextSchema)]),
    role: z.enum(["developer"]),
    name: z.string().optional(),
  })
  .describe(
    `https://docs.perplexity.ai/api-reference/chat-completions-post`,
  );

const SystemMessageParamSchema = z
  .object({
    content: z.union([z.string(), z.array(ContentPartTextSchema)]),
    role: z.enum(["system"]),
    name: z.string().optional(),
  })
  .describe(
    `https://docs.perplexity.ai/api-reference/chat-completions-post`,
  );

const UserMessageParamSchema = z
  .object({
    content: z.union([z.string(), z.array(ContentPartSchema)]),
    role: z.enum(["user"]),
    name: z.string().optional(),
  })
  .describe(
    `https://docs.perplexity.ai/api-reference/chat-completions-post`,
  );

const AssistantMessageParamSchema = z
  .object({
    role: z.enum(["assistant"]),
    audio: z
      .object({
        id: z.string(),
      })
      .nullable()
      .optional(),
    content: z
      .union([
        z.string(),
        z.array(ContentPartTextSchema),
        z.array(ContentPartRefusalSchema),
      ])
      .nullable()
      .optional(),

    function_call: z
      .object({
        arguments: z.string(),
        name: z.string(),
      })
      .nullable()
      .optional()
      .describe(
        `https://docs.perplexity.ai/api-reference/chat-completions-post`,
      ),
    name: z.string().optional(),
    refusal: z.string().nullable().optional(),
    tool_calls: z.array(ToolCallSchema).optional(),
  })
  .describe(
    `https://docs.perplexity.ai/api-reference/chat-completions-post`,
  );

const ToolMessageParamSchema = z
  .object({
    role: z.enum(["tool"]),
    content: z.union([
      z.string(),
      z.array(z.union([ContentPartTextSchema, ContentPartImageSchema])),
    ]),
    tool_call_id: z.string(),
  })
  .describe(
    `https://docs.perplexity.ai/api-reference/chat-completions-post`,
  );

const FunctionMessageParamSchema = z
  .object({
    role: z.enum(["function"]),
    content: z.string().nullable(),
    name: z.string(),
  })
  .describe(
    `https://docs.perplexity.ai/api-reference/chat-completions-post`,
  );

export const MessageParamSchema = z
  .union([
    DeveloperMessageParamSchema,
    SystemMessageParamSchema,
    UserMessageParamSchema,
    AssistantMessageParamSchema,
    ToolMessageParamSchema,
    FunctionMessageParamSchema,
  ])
  .describe(
    `https://docs.perplexity.ai/api-reference/chat-completions-post`,
  );
