# AgentSDK That never publish

Open source agent SDK built to **learn by building** — understand how agents work internally (prompt harness, tool loop, providers) instead of treating them as a black box.

Others can plug in their own LLM providers (Claude, Gemini, and more). Memory management and context management are coming shortly.

## Why this exists

Most agent frameworks hide the internals. This project keeps the core small and readable on purpose:

- How a system prompt / harness drives the model
- How tools are registered and executed
- How providers are swapped behind one interface
- How the THINK → TOOL_REQUEST → OUTPUT style loop runs

If you want to study the code, start with `src/app/agent.ts` and `src/provider/`.

## Features (today)

- Builder API: `Agent.builder().provider(...).tool(...).setInstruction(...).build()`
- Pluggable tools via `Itool`
- Message interceptors for logging / debugging
- OpenAI-compatible providers: OpenAI, Groq, OpenRouter, Together
- Custom providers via the `IProvider` interface

## Roadmap

- [ ] Memory management
- [ ] Context management
- [ ] First-class Claude provider
- [ ] First-class Gemini provider
- [ ] More LLM backends as the community needs them

## Install

```bash
npm install agentsdk openai
```

`openai` is a peer dependency (used by the OpenAI-compatible provider).

Local development (from another folder):

```bash
npm install /path/to/AgentSDK
npm install openai
```

## Quick start

```ts
import { Agent, openai } from "agentsdk";
import type { Itool } from "agentsdk";

const echoTool: Itool = {
  name: "echo",
  description: "Echoes the input string",
  doc: "echo(input: string): string",
  async executor(input) {
    return input;
  },
};

const agent = Agent.builder()
  .provider(
    openai({
      apikey: process.env.OPENAI_API_KEY ?? "",
      model: "gpt-4o-mini",
    })
  )
  .setInstruction("You are a helpful agent. Always finish with an OUTPUT step.")
  .tool(echoTool)
  .build();

agent.attachTnterceptor((message) => {
  console.log(`${message.role}: ${message.content}`);
});

const history = await agent.run("Say hello using the echo tool");
console.log(history);
```

### Other built-in providers

```ts
import { groq, openrouter, together } from "agentsdk";

.provider(groq({ apiKey: process.env.GROQ_API_KEY!, model: "llama-3.3-70b-versatile" }))
.provider(openrouter({ apiKey: process.env.OPENROUTER_API_KEY!, model: "openai/gpt-4o-mini" }))
.provider(together({ apiKey: process.env.TOGETHER_API_KEY!, model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo" }))
```

## Plug in your own LLM provider

Any class that implements `IProvider` works — Claude, Gemini, a local model, or a mock for tests.

```ts
import type { IProvider, ProviderRequest, ProviderResponse } from "agentsdk";

class MyClaudeProvider implements IProvider {
  async generate(request: ProviderRequest): Promise<ProviderResponse> {
    // call Claude (or Gemini, Ollama, etc.)
    return { content: '{"step":"OUTPUT","text":"hello"}' };
  }
}

const agent = Agent.builder()
  .provider(new MyClaudeProvider())
  .setInstruction("You are a helpful agent.")
  .build();
```

The agent only needs `{ content: string }` back. That content should be a JSON step the harness understands (see `src/app/config.ts`).

## Project layout

```
src/
  index.ts                 # public exports
  app/
    agent.ts               # Agent + AgentBuilder + run loop
    config.ts              # harness / pipeline prompt
    types.ts               # Itool, IMessage, Interceptor
  provider/
    types.ts               # IProvider contract
    openai-compatible.ts   # shared OpenAI-compatible client
    intext.ts              # openai / groq / openrouter / together helpers
```

## Build

```bash
npm install
npm run build
```

Output goes to `dist/` (what gets published).

## Contributing

This is open source and meant to be extended:

1. Fork / clone
2. Add a provider under `src/provider/` that implements `IProvider`
3. Export it from `src/index.ts`
4. Open a PR

Ideas that fit the roadmap well: Claude, Gemini, memory stores, context window strategies, better JSON step validation.

## License

ISC
