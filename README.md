# AgentSDK — a learning repo (not a published SDK)

This started as an agent SDK. It is **not** one any more, and it is not going to npm.

It is a **learning repo**: a small, readable agent loop built from scratch to understand how agents actually work internally — the prompt harness, the step pipeline, the tool loop, provider swapping, and now long-term memory — instead of treating any of it as a black box.

Read it, break it, rewrite it. That is the whole point.

## What's inside

- How a system prompt / harness drives the model
- How tools are registered and executed
- How providers are swapped behind one interface
- How the THINK → TOOL_REQUEST → OUTPUT style loop runs
- How the agent asks the human a question — as a tool, not a special case
- How long-term memory is recalled before a run and written back after it (mem0)

Start with `src/app/agent.ts`, then `src/app/config.ts` (the harness prompt), then `src/provider/`.

## Memory (mem0)

Memory is wired in with [mem0](https://mem0.ai) so the agent remembers a user across separate runs, not just within one loop.

- **Before the loop** — `run()` calls `memclient.search(query, { filters: { user_id } })` and appends the recalled memories to the instruction, so the model starts the turn already knowing the user.
- **After the loop** — when a run finishes on the `OUTPUT` step, the message history is sent to `memclient.add(...)`, so what happened this turn is available next time.

Two things worth knowing if you are reading the code:

- mem0's `Message` type only accepts `user` and `assistant` roles, while this repo's `IMessage` also has `developer` (used for tool results and error corrections). The history has to be filtered or mapped before it goes to mem0.
- Memory is scoped by `user_id`. The id used for `search` and the id used for `add` must be the same, or recall silently returns nothing.

## Asking the user a question

Instead of a dedicated pipeline step, "ask the human" is registered as a **normal tool** (`askToUser` in `src/index.ts`, backed by `prompt-sync`). The executor signature — `(input: string) => Promise<string>` — already fits: the question goes in, the answer comes out.

This means the tool loop handles it with no extra machinery, and the capability exists only where it makes sense: register the tool in a CLI, leave it out on a server and the model will never try to ask.

## Features (today)

- Builder API: `Agent.builder().provider(...).tool(...).setInstruction(...).build()`
- Pluggable tools via `Itool`
- Human-in-the-loop via a plain tool
- Long-term memory via mem0
- Message interceptors for logging / debugging
- OpenAI-compatible providers: OpenAI, Groq, OpenRouter, Together
- Custom providers via the `IProvider` interface

## Things still to explore

- [ ] Context management / window trimming
- [ ] First-class Claude provider
- [ ] First-class Gemini provider
- [ ] Better JSON step validation
- [ ] Streaming

## Running it

Not published to npm — clone and run it locally.

```bash
git clone <this repo>
cd AgentSDK
npm install
npm run build
npm start
```

You will need an OpenAI (or Groq / OpenRouter / Together) key and a mem0 key. Put them in environment variables — do not commit them.

## How the pieces fit

```ts
import { Agent, openai } from "./src/index.js";
import type { Itool } from "./src/app/types.js";

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
import { groq, openrouter, together } from "./src/index.js";

.provider(groq({ apiKey: process.env.GROQ_API_KEY!, model: "llama-3.3-70b-versatile" }))
.provider(openrouter({ apiKey: process.env.OPENROUTER_API_KEY!, model: "openai/gpt-4o-mini" }))
.provider(together({ apiKey: process.env.TOGETHER_API_KEY!, model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo" }))
```

## Plug in your own LLM provider

Any class that implements `IProvider` works — Claude, Gemini, a local model, or a mock for tests.

```ts
import type { IProvider, ProviderRequest, ProviderResponse } from "./src/provider/types.js";

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
  index.ts                 # entry point + the askToUser tool
  app/
    agent.ts               # Agent + AgentBuilder + run loop + memory calls
    config.ts              # harness / pipeline prompt + mem0 client
    types.ts               # Itool, IMessage, Interceptor
  provider/
    types.ts               # IProvider contract
    openai-compatible.ts   # shared OpenAI-compatible client
    intext.ts              # openai / groq / openrouter / together helpers
```

## License

ISC
