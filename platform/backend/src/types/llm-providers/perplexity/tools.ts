import { z } from "zod";

export const FunctionDefinitionParametersSchema = z
  .record(z.string(), z.unknown())
  .optional()
  .describe(`
    https://docs.perplexity.ai/api-reference/chat-completions-post

    The parameters the functions accepts, described as a JSON Schema object. See the
    [guide](https://docs.perplexity.ai/api-reference/chat-completions-post) for examples,
    and the [JSON Schema reference](https://json-schema.org/understanding-json-schema/) for
    documentation about the format.

    Omitting parameters defines a function with an empty parameter list.
  `);

const FunctionDefinitionSchema = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    parameters: FunctionDefinitionParametersSchema,
    strict: z.boolean().nullable().optional(),
  })
  .describe(
    `https://docs.perplexity.ai/api-reference/chat-completions-post`,
  );

const FunctionToolSchema = z
  .object({
    type: z.enum(["function"]),
    function: FunctionDefinitionSchema,
  })
  .describe(
    `https://docs.perplexity.ai/api-reference/chat-completions-post`,
  );

const CustomToolSchema = z
  .object({
    type: z.enum(["custom"]),
    custom: z.object({
      name: z
        .string()
        .describe(
          "The name of the custom tool, used to identify it in tool calls",
        ),
      description: z
        .string()
        .optional()
        .describe(
          "Optional description of the custom tool, used to provide more context",
        ),
      format: z
        .union([
          z
            .object({
              type: z
                .enum(["text"])
                .describe("Unconstrained text format. Always `text`"),
            })
            .describe("Unconstrained free-form text"),
          z.object({
            type: z.enum(["grammar"]),
            grammar: z
              .object({
                definition: z.string().describe("The grammar definition"),
                syntax: z
                  .enum(["lark", "regex"])
                  .describe("The syntax of the grammar definition"),
              })
              .describe("Your chosen grammar"),
          }),
        ])
        .optional()
        .describe(
          "The input format for the custom tool. Default is unconstrained text.",
        ),
    }),
  })
  .describe(`
  Specifies a tool the model should use. Use to force the model to call a specific custom tool.

  https://docs.perplexity.ai/api-reference/chat-completions-post
  `);

const AllowedToolsSchema = z
  .object({
    mode: z.enum(["auto", "required"]).describe(`
    Constrains the tools available to the model to a pre-defined set.

    auto allows the model to pick from among the allowed tools and generate a
    message.

    required requires the model to call one or more of the allowed tools.
    `),
    tools: z
      .array(z.record(z.string(), FunctionToolSchema))
      .describe(
        "A list of tool definitions that the model should be allowed to call",
      ),
  })
  .describe(
    `https://docs.perplexity.ai/api-reference/chat-completions-post`,
  );

const AllowedToolChoiceSchema = z
  .object({
    type: z.enum(["allowed_tools"]),
    allowed_tools: AllowedToolsSchema,
  })
  .describe(`
  Constrains the tools available to the model to a pre-defined set.

  https://docs.perplexity.ai/api-reference/chat-completions-post
  `);

const NamedToolChoiceSchema = z
  .object({
    type: z.enum(["function"]),
    function: z.object({
      name: z.string(),
    }),
  })
  .describe(`
  Specifies a tool the model should use. Use to force the model to call a specific function.

  https://docs.perplexity.ai/api-reference/chat-completions-post
  `);

export const ToolSchema = z
  .union([FunctionToolSchema, CustomToolSchema])
  .describe(`
  A function tool that can be used to generate a response.

  https://docs.perplexity.ai/api-reference/chat-completions-post
  `);

export const ToolChoiceOptionSchema = z
  .union([
    z.enum(["none", "auto", "required"]),
    AllowedToolChoiceSchema,
    NamedToolChoiceSchema,
    CustomToolSchema,
  ])
  .describe(
    `https://docs.perplexity.ai/api-reference/chat-completions-post`,
  );
