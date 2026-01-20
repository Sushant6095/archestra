# Guide: Adding a New LLM Provider to Archestra

This guide documents all the files and changes needed to add a new LLM provider (e.g., Groq, Perplexity, Cohere, XAI, Mistral, DeepSeek) to Archestra Platform. This is based on the MiniMax implementation pattern.

## Quick Reference

**Total files to modify/create: ~50+ files**

### File Count by Category
- **Backend Core**: ~20 files
- **Frontend**: ~5 files  
- **E2E Tests**: ~5 files + 13 WireMock mappings
- **Config/Docs**: ~3 files
- **Type Definitions**: ~5 files per provider

### Estimated Time
- **OpenAI-compatible provider**: 2-4 hours
- **Custom API provider**: 4-8 hours

## Prerequisites

- Provider name in lowercase (e.g., `groq`, `perplexity`, `cohere`, `xai`, `mistral`, `deepseek`)
- Provider display name (e.g., `Groq`, `Perplexity`, `Cohere`, `X.AI`, `Mistral`, `DeepSeek`)
- Provider API base URL
- Provider API documentation URL
- Provider console/API key management URL
- Provider icon (PNG and SVG, 64x64px recommended)

## Step-by-Step Implementation

### 1. Shared Constants & Types

#### `platform/shared/model-constants.ts`

**Add to `SupportedProvidersSchema`:**
```typescript
export const SupportedProvidersSchema = z.enum([
  // ... existing providers
  "minimax",
  "yourprovider", // Add here
]);
```

**Add to `SupportedProvidersDiscriminatorSchema`:**
```typescript
export const SupportedProvidersDiscriminatorSchema = z.enum([
  // ... existing providers
  "minimax:chatCompletions",
  "yourprovider:chatCompletions", // Add here (format: provider:endpoint)
]);
```

**Add to `providerDisplayNames`:**
```typescript
export const providerDisplayNames: Record<SupportedProvider, string> = {
  // ... existing providers
  minimax: "MiniMax",
  yourprovider: "Your Provider", // Add here
};
```

#### `platform/shared/routes.ts`

**Add Route IDs:**
```typescript
export const RouteId = {
  // ... existing routes
  // Proxy Routes - MiniMax
  MiniMaxChatCompletionsWithDefaultAgent: "minimaxChatCompletionsWithDefaultAgent",
  MiniMaxChatCompletionsWithAgent: "minimaxChatCompletionsWithAgent",
  
  // Proxy Routes - Your Provider
  YourProviderChatCompletionsWithDefaultAgent: "yourproviderChatCompletionsWithDefaultAgent",
  YourProviderChatCompletionsWithAgent: "yourproviderChatCompletionsWithAgent",
} as const;
```

### 2. Backend Type Definitions

#### Create Provider Type Directory

Create directory: `platform/backend/src/types/llm-providers/yourprovider/`

**Files to create:**
1. `api.ts` - API request/response schemas (Zod)
2. `messages.ts` - Message type schemas
3. `models.ts` - Model type schemas
4. `tools.ts` - Tool/function calling schemas
5. `index.ts` - Main export file

**Reference:** Copy from `platform/backend/src/types/llm-providers/minimax/` and adapt.

**For OpenAI-compatible providers:**
- Most types can be reused from OpenAI
- Update base URLs and model names
- Adjust any provider-specific differences

#### `platform/backend/src/types/llm-providers/index.ts`

**Add export:**
```typescript
export { default as MiniMax } from "./minimax";
export { default as YourProvider } from "./yourprovider"; // Add here
```

### 3. Backend Configuration

#### `platform/backend/src/config.ts`

**Add to `llm` section:**
```typescript
llm: {
  // ... existing providers
  minimax: {
    enabled: Boolean(process.env.ARCHESTRA_MINIMAX_BASE_URL),
    baseUrl: process.env.ARCHESTRA_MINIMAX_BASE_URL,
    useV2Routes: process.env.ARCHESTRA_MINIMAX_USE_V2_ROUTES !== "false",
  },
  yourprovider: { // Add here
    enabled: Boolean(process.env.ARCHESTRA_YOURPROVIDER_BASE_URL),
    baseUrl: process.env.ARCHESTRA_YOURPROVIDER_BASE_URL,
    useV2Routes: process.env.ARCHESTRA_YOURPROVIDER_USE_V2_ROUTES !== "false",
  },
},
```

**Add to `chat` section:**
```typescript
chat: {
  // ... existing providers
  minimax: {
    apiKey: process.env.ARCHESTRA_CHAT_MINIMAX_API_KEY || "",
    baseUrl:
      process.env.ARCHESTRA_CHAT_MINIMAX_BASE_URL ||
      process.env.ARCHESTRA_MINIMAX_BASE_URL ||
      "https://api.minimax.io/v1",
  },
  yourprovider: { // Add here
    apiKey: process.env.ARCHESTRA_CHAT_YOURPROVIDER_API_KEY || "",
    baseUrl:
      process.env.ARCHESTRA_CHAT_YOURPROVIDER_BASE_URL ||
      process.env.ARCHESTRA_YOURPROVIDER_BASE_URL ||
      "https://api.yourprovider.com/v1", // Update with actual base URL
  },
},
```

### 4. Backend Proxy Routes

#### Create `platform/backend/src/routes/proxy/routesv2/yourprovider.ts`

**Reference:** Copy from `platform/backend/src/routes/proxy/routesv2/minimax.ts`

**Key changes:**
- Replace `minimax` with `yourprovider` (case-sensitive)
- Update `API_PREFIX` to use your provider name
- Update route IDs to match `shared/routes.ts`
- Update base URL references
- Update provider type imports

#### Create `platform/backend/src/routes/proxy/adapterV2/yourprovider.ts`

**Reference:** Copy from `platform/backend/src/routes/proxy/adapterV2/minimax.ts`

**Key changes:**
- Replace `MiniMax` with `YourProvider` types
- Update provider name in class/function names
- Update any provider-specific logic

#### `platform/backend/src/routes/proxy/adapterV2/index.ts`

**Add adapter factory export:**
```typescript
export { minimaxAdapterFactory } from "./minimax";
export { yourproviderAdapterFactory } from "./yourprovider"; // Add here
```

#### `platform/backend/src/routes/index.ts`

**Register the routes:**
```typescript
// ... existing route registrations
await fastify.register(minimaxProxyRoutesV2);
await fastify.register(yourproviderProxyRoutesV2); // Add here
```

### 5. Backend Client & Utilities

#### `platform/backend/src/clients/llm-client.ts`

**Add to `detectProviderFromModel`:**
```typescript
export function detectProviderFromModel(model: string): SupportedChatProvider {
  // ... existing detection logic
  if (lowerModel.includes("minimax")) {
    return "minimax";
  }
  if (lowerModel.includes("yourprovider")) { // Add here (check for provider-specific model patterns)
    return "yourprovider";
  }
  return "anthropic";
}
```

**Add to `resolveProviderApiKey` - secret keys:**
```typescript
const secretValue =
  secret?.secret?.apiKey ??
  secret?.secret?.anthropicApiKey ??
  secret?.secret?.geminiApiKey ??
  secret?.secret?.openaiApiKey ??
  secret?.secret?.zhipuaiApiKey ??
  secret?.secret?.minimaxApiKey ??
  secret?.secret?.yourproviderApiKey; // Add here
```

**Add to `resolveProviderApiKey` - environment fallback:**
```typescript
} else if (provider === "minimax" && config.chat.minimax.apiKey) {
  providerApiKey = config.chat.minimax.apiKey;
  apiKeySource = "environment";
} else if (provider === "yourprovider" && config.chat.yourprovider.apiKey) { // Add here
  providerApiKey = config.chat.yourprovider.apiKey;
  apiKeySource = "environment";
}
```

**Add to `createLLMModel`:**
```typescript
if (provider === "minimax") {
  // URL format: /v1/minimax/:agentId (SDK appends /chat/completions)
  const client = createOpenAI({
    apiKey,
    baseURL: `http://localhost:${config.api.port}/v1/minimax/${agentId}`,
    headers,
  });
  return client.chat(modelName);
}

if (provider === "yourprovider") { // Add here
  // URL format: /v1/yourprovider/:agentId (SDK appends /chat/completions)
  const client = createOpenAI({
    apiKey,
    baseURL: `http://localhost:${config.api.port}/v1/yourprovider/${agentId}`,
    headers,
  });
  return client.chat(modelName);
}
```

**Add to `createLLMModelForAgent` - API key requirement check:**
```typescript
const isVllm = provider === "vllm";
const isOllama = provider === "ollama";
const isMiniMax = provider === "minimax";
const isYourProvider = provider === "yourprovider"; // Add here

if (!apiKey && !isGeminiWithVertexAi && !isVllm && !isOllama && !isMiniMax && !isYourProvider) { // Update condition
  throw new ApiError(/* ... */);
}
```

#### `platform/backend/src/routes/proxy/utils/dual-llm-client.ts`

**Add DualLlmClient class:**
```typescript
/**
 * YourProvider implementation of DualLlmClient
 * YourProvider exposes an OpenAI-compatible API, so we use the OpenAI SDK
 */
export class YourProviderDualLlmClient implements DualLlmClient {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string | undefined, model: string) {
    logger.debug({ model }, "[dualLlmClient] YourProvider: initializing client");
    if (!apiKey) {
      throw new Error("API key required for YourProvider dual LLM");
    }
    this.client = new OpenAI({
      apiKey,
      baseURL: config.llm.yourprovider.baseUrl,
    });
    this.model = model;
  }

  async chat(messages: DualLlmMessage[], temperature = 0): Promise<string> {
    // Implementation similar to MiniMaxDualLlmClient
  }

  async chatWithSchema<T>(/* ... */): Promise<T> {
    // Implementation similar to MiniMaxDualLlmClient
  }
}
```

**Add to `createDualLlmClient` factory:**
```typescript
case "minimax":
  if (!apiKey) {
    throw new Error("API key required for MiniMax dual LLM");
  }
  if (!model) {
    throw new Error("Model name required for MiniMax dual LLM");
  }
  return new MiniMaxDualLlmClient(apiKey, model);
case "yourprovider": // Add here
  if (!apiKey) {
    throw new Error("API key required for YourProvider dual LLM");
  }
  if (!model) {
    throw new Error("Model name required for YourProvider dual LLM");
  }
  return new YourProviderDualLlmClient(apiKey, model);
```

#### `platform/backend/src/routes/proxy/utils/cost-optimization.ts`

**Add to imports:**
```typescript
import type {
  Agent,
  Anthropic,
  Cerebras,
  Gemini,
  MiniMax,
  OpenAi,
  Vllm,
  YourProvider, // Add here
} from "@/types";
```

**Add to `ProviderMessages` type:**
```typescript
type ProviderMessages = {
  // ... existing providers
  minimax: MiniMax.Types.ChatCompletionsRequest["messages"];
  yourprovider: YourProvider.Types.ChatCompletionsRequest["messages"]; // Add here
};
```

#### `platform/backend/src/routes/chat/errors.ts`

**Add error parser (if OpenAI-compatible, reuse OpenAI parser):**
```typescript
function parseYourProviderError(responseBody: string): ParsedOpenAIError | null {
  // For OpenAI-compatible providers, reuse OpenAI parser
  return parseOpenAIError(responseBody);
}

function mapYourProviderErrorToCode(
  statusCode: number | undefined,
  parsedError: ParsedOpenAIError | null,
): ChatErrorCode {
  // For OpenAI-compatible providers, reuse OpenAI mapping
  return mapOpenAIErrorToCode(statusCode, parsedError);
}
```

**Add to `providerParsers` registry:**
```typescript
const providerParsers: Record<SupportedProvider, ErrorParser> = {
  // ... existing providers
  minimax: parseMiniMaxError,
  yourprovider: parseYourProviderError, // Add here
};
```

**Add to `providerMappers` registry:**
```typescript
const providerMappers: Record<SupportedProvider, ErrorMapper> = {
  // ... existing providers
  minimax: mapMiniMaxErrorWrapper,
  yourprovider: mapYourProviderErrorWrapper, // Add here
};
```

#### `platform/backend/src/routes/chat/routes.models.ts`

**Add to `SupportedChatProviderSchema`:**
```typescript
export const SupportedChatProviderSchema = z.enum([
  // ... existing providers
  "minimax",
  "yourprovider", // Add here
]);
```

**Add model fetcher function:**
```typescript
/**
 * Fetch models from YourProvider API
 * YourProvider exposes an OpenAI-compatible /models endpoint
 */
async function fetchYourProviderModels(apiKey: string): Promise<ModelInfo[]> {
  const baseUrl = config.chat.yourprovider.baseUrl || config.llm.yourprovider.baseUrl;
  const url = `${baseUrl}/models`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(
      { status: response.status, error: errorText },
      "Failed to fetch YourProvider models",
    );
    throw new Error(`Failed to fetch YourProvider models: ${response.status}`);
  }

  const data = (await response.json()) as {
    data: Array<{
      id: string;
      object: string;
      created?: number;
      owned_by?: string;
    }>;
  };

  return data.data.map((model) => ({
    id: model.id,
    displayName: model.id,
    provider: "yourprovider" as const,
    createdAt: model.created
      ? new Date(model.created * 1000).toISOString()
      : undefined,
  }));
}
```

**Add to `getProviderApiKey` switch:**
```typescript
case "minimax":
  return config.chat.minimax.apiKey || null;
case "yourprovider": // Add here
  return config.chat.yourprovider.apiKey || null;
```

**Add to `modelFetchers` registry:**
```typescript
const modelFetchers: Record<
  SupportedProvider,
  (apiKey: string) => Promise<ModelInfo[]>
> = {
  // ... existing providers
  minimax: fetchMiniMaxModels,
  yourprovider: fetchYourProviderModels, // Add here
};
```

**Add to `fetchModelsForProvider`:**
```typescript
const isVllm = provider === "vllm";
const isOllama = provider === "ollama";
const isMiniMax = provider === "minimax";
const isYourProvider = provider === "yourprovider"; // Add here

if (!apiKey && !vertexAiEnabled && !isVllm && !isOllama && !isMiniMax && !isYourProvider) { // Update condition
  // ...
}

// In the provider handling section:
} else if (provider === "minimax") {
  if (apiKey) {
    models = await modelFetchers[provider](apiKey);
  }
} else if (provider === "yourprovider") { // Add here
  if (apiKey) {
    models = await modelFetchers[provider](apiKey);
  }
}
```

#### `platform/backend/src/types/chat-api-key.ts`

**Add to `SupportedChatProviderSchema`:**
```typescript
export const SupportedChatProviderSchema = z.enum([
  // ... existing providers
  "minimax",
  "yourprovider", // Add here
]);
```

#### `platform/backend/src/types/interaction.ts`

**Add to imports:**
```typescript
import {
  Anthropic,
  Cerebras,
  Gemini,
  MiniMax,
  Ollama,
  OpenAi,
  Vllm,
  YourProvider, // Add here
  Zhipuai,
} from "./llm-providers";
```

**Add to `InteractionRequestSchema` union:**
```typescript
export const InteractionRequestSchema = z.union([
  // ... existing providers
  MiniMax.API.ChatCompletionRequestSchema,
  YourProvider.API.ChatCompletionRequestSchema, // Add here
]);
```

**Add to `InteractionResponseSchema` union:**
```typescript
export const InteractionResponseSchema = z.union([
  // ... existing providers
  MiniMax.API.ChatCompletionResponseSchema,
  YourProvider.API.ChatCompletionResponseSchema, // Add here
]);
```

**Add to `SelectInteractionSchema` discriminated union:**
```typescript
BaseSelectInteractionSchema.extend({
  type: z.enum(["minimax:chatCompletions"]),
  request: MiniMax.API.ChatCompletionRequestSchema,
  processedRequest: MiniMax.API.ChatCompletionRequestSchema.nullable().optional(),
  response: MiniMax.API.ChatCompletionResponseSchema,
}),
BaseSelectInteractionSchema.extend({
  type: z.enum(["yourprovider:chatCompletions"]), // Add here
  request: YourProvider.API.ChatCompletionRequestSchema,
  processedRequest: YourProvider.API.ChatCompletionRequestSchema.nullable().optional(),
  response: YourProvider.API.ChatCompletionResponseSchema,
}),
```

#### `platform/backend/src/tokenizers/base.ts`

**Add to imports:**
```typescript
import type {
  Anthropic,
  Gemini,
  MiniMax,
  Ollama,
  OpenAi,
  Vllm,
  YourProvider, // Add here
  Zhipuai,
} from "@/types";
```

**Add to `ProviderMessage` union:**
```typescript
export type ProviderMessage =
  | OpenAi.Types.ChatCompletionsRequest["messages"][number]
  | Anthropic.Types.MessagesRequest["messages"][number]
  | Gemini.Types.GenerateContentRequest["contents"][number]
  | Vllm.Types.ChatCompletionsRequest["messages"][number]
  | Ollama.Types.ChatCompletionsRequest["messages"][number]
  | Zhipuai.Types.ChatCompletionsRequest["messages"][number]
  | MiniMax.Types.ChatCompletionsRequest["messages"][number]
  | YourProvider.Types.ChatCompletionsRequest["messages"][number]; // Add here
```

#### `platform/backend/src/tokenizers/index.ts`

**Add tokenizer case:**
```typescript
switch (provider) {
  // ... existing cases
  case "minimax":
    // MiniMax uses tiktoken-compatible tokenization
    return new TiktokenTokenizer();
  case "yourprovider": // Add here
    // YourProvider uses tiktoken-compatible tokenization (if OpenAI-compatible)
    return new TiktokenTokenizer();
}
```

### 6. Frontend Components

#### `platform/frontend/src/components/chat-api-key-form.tsx`

**Add to `PROVIDER_CONFIG`:**
```typescript
const PROVIDER_CONFIG: Record<
  CreateChatApiKeyBody["provider"],
  {
    name: string;
    icon: string;
    placeholder: string;
    enabled: boolean;
    consoleUrl: string;
    consoleName: string;
  }
> = {
  // ... existing providers
  minimax: {
    name: "MiniMax",
    icon: "/icons/minimax.png",
    placeholder: "your-minimax-api-key",
    enabled: true,
    consoleUrl: "https://platform.minimax.io/",
    consoleName: "MiniMax Platform",
  },
  yourprovider: { // Add here
    name: "Your Provider",
    icon: "/icons/yourprovider.png",
    placeholder: "your-api-key",
    enabled: true,
    consoleUrl: "https://console.yourprovider.com/",
    consoleName: "Your Provider Console",
  },
} as const;
```

#### `platform/frontend/src/components/chat/model-selector.tsx`

**Add to `providerToLogoProvider` mapping:**
```typescript
const providerToLogoProvider: Record<SupportedProvider, string> = {
  // ... existing providers
  minimax: "minimax",
  yourprovider: "yourprovider", // Add here
};
```

#### `platform/frontend/src/components/ai-elements/model-selector.tsx`

**Add provider logo mapping** (if using AI Elements model selector):
```typescript
// Similar mapping as above
```

#### `platform/frontend/src/lib/interaction.utils.ts`

**Add provider handling** (if needed for interaction utilities):
```typescript
// Check existing file for provider-specific logic
```

#### `platform/frontend/src/proxy.ts`

**Add provider route** (if needed):
```typescript
// Check existing file for proxy route definitions
```

#### `platform/frontend/src/lib/llmProviders/yourprovider.ts`

**Create provider-specific utilities** (if needed):
```typescript
// Reference: platform/frontend/src/lib/llmProviders/minimax.ts
```

#### Add Provider Icons

**Create icon files:**
- `platform/frontend/public/icons/yourprovider.png` (64x64px PNG)
- `platform/frontend/public/icons/yourprovider.svg` (SVG format)

### 7. E2E Tests

#### `platform/e2e-tests/tests/api/llm-proxy/model-optimization.spec.ts`

**Add test config:**
```typescript
const yourproviderConfig: ModelOptimizationTestConfig = {
  providerName: "YourProvider",
  provider: "yourprovider",
  endpoint: (agentId) => `/v1/yourprovider/${agentId}/chat/completions`,
  headers: (wiremockStub) => ({
    Authorization: `Bearer ${wiremockStub}`,
    "Content-Type": "application/json",
  }),
  buildRequest: (content, tools) => {
    const request: Record<string, unknown> = {
      model: "e2e-test-yourprovider-baseline",
      messages: [{ role: "user", content }],
    };
    if (tools && tools.length > 0) {
      request.tools = tools.map((t) => ({
        type: "function",
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));
    }
    return request;
  },
  baselineModel: "e2e-test-yourprovider-baseline",
  optimizedModel: "e2e-test-yourprovider-optimized",
  getModelFromResponse: (response) => response.model,
};
```

**Add to `testConfigs` array:**
```typescript
const testConfigs: ModelOptimizationTestConfig[] = [
  // ... existing configs
  minimaxConfig,
  yourproviderConfig, // Add here
];
```

**Repeat for other test files:**
- `token-cost-limits.spec.ts`
- `tool-invocation.spec.ts`
- `tool-persistence.spec.ts`
- `tool-result-compression.spec.ts`

**Pattern for each:**
1. Create `yourproviderConfig` with provider-specific test configuration
2. Add to `testConfigs` array
3. Update model names, endpoints, and provider-specific assertions

### 8. Helm E2E Test Mappings

**Create WireMock mapping files** in `platform/helm/e2e-tests/mappings/`:

- `yourprovider-allows-archestra-untrusted-context.json`
- `yourprovider-allows-regular-after-archestra.json`
- `yourprovider-blocks-tool-untrusted-data.json`
- `yourprovider-compression-disabled.json`
- `yourprovider-compression-enabled.json`
- `yourprovider-model-optimization-disabled.json`
- `yourprovider-model-optimization-long.json`
- `yourprovider-model-optimization-no-tools.json`
- `yourprovider-model-optimization-short.json`
- `yourprovider-model-optimization-with-tools.json`
- `yourprovider-models-list.json`
- `yourprovider-token-cost-limit-test.json`
- `yourprovider-tool-persistence.json`

**Reference:** Copy from `platform/helm/e2e-tests/mappings/minimax-*.json` and update:
- Provider name in URLs
- Model names
- Response structures (if different)

### 9. CI Configuration

#### `.github/values-ci.yaml`

**Add environment variables:**
```yaml
env:
  # LLM Proxy base URLs
  ARCHESTRA_MINIMAX_BASE_URL: "http://e2e-tests-wiremock:8080/minimax/v1"
  ARCHESTRA_YOURPROVIDER_BASE_URL: "http://e2e-tests-wiremock:8080/yourprovider/v1" # Add here
  
  # Chat API keys
  ARCHESTRA_CHAT_MINIMAX_API_KEY: test-key
  ARCHESTRA_CHAT_YOURPROVIDER_API_KEY: test-key # Add here
```

### 10. Documentation

#### `docs/pages/platform-supported-llm-providers.md`

**Add provider section:**
```markdown
## Your Provider

[Your Provider](https://yourprovider.com/) is a description of the provider.

### Supported Your Provider APIs

- **Chat Completions API** (`/chat/completions`) - ✅ Fully supported (OpenAI-compatible)

### Your Provider Connection Details

- **Base URL**: `http://localhost:9000/v1/yourprovider/{profile-id}`
- **Authentication**: Pass your Your Provider API key in the `Authorization` header as `Bearer <your-api-key>`

### Environment Variables

| Variable                          | Required | Description                                                                    |
| --------------------------------- | -------- | ------------------------------------------------------------------------------ |
| `ARCHESTRA_YOURPROVIDER_BASE_URL` | Yes      | Your Provider API base URL (default: `https://api.yourprovider.com/v1`)       |
| `ARCHESTRA_CHAT_YOURPROVIDER_API_KEY` | Yes      | Your Provider API key for chat functionality                                  |

### Important Notes

- **API key required**: Your Provider requires a valid API key for authentication.
- **Supported models**: List of supported models
- **OpenAI-compatible**: Your Provider uses the OpenAI API format
```

### 11. Generated Files (Auto-generated, but note for reference)

These files are auto-generated but should be aware of:
- `docs/openapi.json` - Will be regenerated when running codegen
- `platform/shared/hey-api/clients/api/sdk.gen.ts` - Auto-generated
- `platform/shared/hey-api/clients/api/types.gen.ts` - Auto-generated

**After implementation, run:**
```bash
cd platform
pnpm codegen
```

### 12. Additional Files (if applicable)

#### `platform/backend/src/llm-metrics.ts`

**Add provider metrics** (if needed):
```typescript
// Check existing file for provider-specific metric handling
```

## Quick Reference: File Checklist

### Backend Files
- [ ] `shared/model-constants.ts` - Add to enums and display names
- [ ] `shared/routes.ts` - Add route IDs
- [ ] `backend/src/types/llm-providers/yourprovider/` - Create type definitions (5 files)
- [ ] `backend/src/types/llm-providers/index.ts` - Export provider types
- [ ] `backend/src/config.ts` - Add llm and chat config
- [ ] `backend/src/routes/proxy/routesv2/yourprovider.ts` - Create proxy routes
- [ ] `backend/src/routes/proxy/adapterV2/yourprovider.ts` - Create adapter
- [ ] `backend/src/routes/proxy/adapterV2/index.ts` - Export adapter factory
- [ ] `backend/src/routes/index.ts` - Register routes
- [ ] `backend/src/clients/llm-client.ts` - Add provider support
- [ ] `backend/src/routes/proxy/utils/dual-llm-client.ts` - Add dual LLM client
- [ ] `backend/src/routes/proxy/utils/cost-optimization.ts` - Add to types
- [ ] `backend/src/routes/chat/errors.ts` - Add error handling
- [ ] `backend/src/routes/chat/routes.models.ts` - Add model fetching
- [ ] `backend/src/types/chat-api-key.ts` - Add to schema
- [ ] `backend/src/types/interaction.ts` - Add to schemas
- [ ] `backend/src/tokenizers/base.ts` - Add to types
- [ ] `backend/src/tokenizers/index.ts` - Add tokenizer case

### Frontend Files
- [ ] `frontend/src/components/chat-api-key-form.tsx` - Add to PROVIDER_CONFIG
- [ ] `frontend/src/components/chat/model-selector.tsx` - Add logo mapping
- [ ] `frontend/public/icons/yourprovider.png` - Add icon
- [ ] `frontend/public/icons/yourprovider.svg` - Add icon

### Test Files
- [ ] `e2e-tests/tests/api/llm-proxy/model-optimization.spec.ts` - Add test config
- [ ] `e2e-tests/tests/api/llm-proxy/token-cost-limits.spec.ts` - Add test config
- [ ] `e2e-tests/tests/api/llm-proxy/tool-invocation.spec.ts` - Add test config
- [ ] `e2e-tests/tests/api/llm-proxy/tool-persistence.spec.ts` - Add test config
- [ ] `e2e-tests/tests/api/llm-proxy/tool-result-compression.spec.ts` - Add test config
- [ ] `helm/e2e-tests/mappings/yourprovider-*.json` - Create WireMock mappings (13 files)

### Config Files
- [ ] `.github/values-ci.yaml` - Add environment variables
- [ ] `docs/pages/platform-supported-llm-providers.md` - Add documentation

## Testing Checklist

After implementation:

1. **Type checking:**
   ```bash
   cd platform
   pnpm type-check
   ```

2. **Linting:**
   ```bash
   pnpm lint
   ```

3. **Run codegen** (regenerates OpenAPI and API client):
   ```bash
   pnpm codegen
   ```

4. **Run E2E tests:**
   ```bash
   pnpm test:e2e tests/api/llm-proxy/model-optimization.spec.ts
   ```

## Notes for OpenAI-Compatible Providers

If your provider is **OpenAI-compatible** (like MiniMax, Groq, Perplexity, etc.):

1. **Types**: You can reuse most OpenAI type definitions
2. **Adapter**: Can largely reuse OpenAI adapter with minor modifications
3. **Routes**: Similar structure to vLLM/Ollama/MiniMax routes
4. **Dual LLM Client**: Use OpenAI SDK with custom baseURL
5. **Error Handling**: Reuse OpenAI error parsing/mapping

**Best reference implementations:**
- `platform/backend/src/routes/proxy/routesv2/minimax.ts`
- `platform/backend/src/routes/proxy/adapterV2/minimax.ts`
- `platform/backend/src/types/llm-providers/minimax/`

## Common Patterns

### Provider Name Conventions
- **Lowercase** for code: `groq`, `perplexity`, `cohere`, `xai`, `mistral`, `deepseek`
- **PascalCase** for types: `Groq`, `Perplexity`, `Cohere`, `Xai`, `Mistral`, `DeepSeek`
- **Display name**: Use official provider name (e.g., "Groq", "Perplexity", "Cohere", "X.AI", "Mistral", "DeepSeek")

### Environment Variables Pattern
- `ARCHESTRA_{PROVIDER}_BASE_URL` - For LLM proxy
- `ARCHESTRA_CHAT_{PROVIDER}_API_KEY` - For chat API key
- `ARCHESTRA_{PROVIDER}_USE_V2_ROUTES` - For route version (optional)

### Route Pattern
- Proxy routes: `/v1/{provider}/{agentId}/chat/completions`
- Default agent: `/v1/{provider}/chat/completions`

## Tips

1. **Start with types** - Get the type definitions right first
2. **Copy from similar provider** - MiniMax is a good template for OpenAI-compatible providers
3. **Test incrementally** - Test each component as you add it
4. **Check for conflicts** - When rebasing, ensure both old and new providers are preserved
5. **Use search/replace carefully** - Provider names appear in many places

## Rebasing Your Feature Branch

When your feature branch needs to be updated with the latest `main` branch, follow these steps:

### Step-by-Step Rebase Process

1. **Make sure you are on the correct branch:**
   ```bash
   git checkout feature/add-yourprovider-provider
   ```

2. **Fetch the latest changes from upstream:**
   ```bash
   git fetch upstream
   ```

3. **Start rebasing your branch onto the latest main:**
   ```bash
   git rebase upstream/main
   ```

4. **When Git stops at a conflict** (e.g., `docs/openapi.json` or `package.json`):
   - Open the file in your editor
   - Look for conflict markers: `<<<<<<<`, `=======`, `>>>>>>>`
   - Keep the changes from `upstream/main` (everything above `=======`) 
     **except your own provider changes**—merge them carefully
   - Remove all `<<<<<<<`, `=======`, `>>>>>>>` lines
   - Save the file

5. **If the file is `docs/openapi.json`:**
   - **Regenerate it instead of editing manually:**
     ```bash
     cd platform/backend
     pnpm install
     pnpm generate:openapi
     ```
   - Then add it:
     ```bash
     git add docs/openapi.json
     ```

6. **For any other files** (like `package.json`, `pnpm-lock.yaml`):
   - Make sure dependencies and versions are correct
   - Ensure both your provider and existing providers are preserved
   - Add the file after resolving:
     ```bash
     git add <file>
     ```

7. **Continue the rebase after all conflicts are resolved:**
   ```bash
   git rebase --continue
   ```

8. **Repeat steps 4–7 until the rebase finishes**

9. **Once the rebase is done and your working tree is clean:**
   ```bash
   git status
   git push --force-with-lease origin feature/add-yourprovider-provider
   ```

### Common Rebase Issues

**Issue: Vim swap file blocking rebase**
```bash
# Remove the swap file
rm .git/.COMMIT_EDITMSG.swp
# Continue rebase
git rebase --continue
```

**Issue: Terminal is dumb, but EDITOR unset**
```bash
# Provide commit message explicitly
git commit -m "feat(yourprovider): add provider support"
# Continue rebase
git rebase --continue
```

**Issue: Incorrect file paths in git add**
- Make sure you're in the project root
- Use relative paths from root (e.g., `platform/backend/src/config.ts`, not `backend/src/config.ts`)

### Verifying Rebase Success

After rebase completes, verify:

1. **Check you're on the latest main:**
   ```bash
   git merge-base feature/add-yourprovider-provider upstream/main
   git log --oneline -1 upstream/main
   ```
   Both should show the same commit hash.

2. **Check for any remaining conflicts:**
   ```bash
   git status
   ```
   Should show "nothing to commit, working tree clean"

3. **Verify your changes are still present:**
   ```bash
   git log --oneline upstream/main..feature/add-yourprovider-provider
   ```
   Should show your commits

### Force Push Safety

Always use `--force-with-lease` instead of `--force`:
- `--force`: Overwrites remote branch regardless of remote changes (dangerous)
- `--force-with-lease`: Only pushes if remote hasn't changed since your last fetch (safer)

```bash
git push --force-with-lease origin feature/add-yourprovider-provider
```
