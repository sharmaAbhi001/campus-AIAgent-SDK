import { HARNESS_PROMPT } from "./config.js";
import type { Itool } from "./types.js";
import type { IMessage } from "./types.js";
import type { Interceptor } from "./types.js";
import type { IProvider } from "../provider/types.js";




export class AgentBuilder {

    public instruction: string | undefined
    public toollist: Itool[]
    public providerInstance?:IProvider;

    constructor() {
        this.toollist = []
    }


    public setInstruction(instruction: string) {
        this.instruction = instruction;
        return this;
    }

    public provider(provider:IProvider){
     this.providerInstance = provider;
     return this;
    }

    public tool(t: Itool) {
        this.toollist.push(t)
        return this
    }

    public build() { 
        return new Agent(this)
    }

}


export class Agent {
    private instruction: string | "";
    private toolMap: Map<string, Itool>
    private messageHistory: IMessage[]
    private provider:IProvider;
    private interceptors: Interceptor[]

    constructor(builder: AgentBuilder) {

        if(!builder.providerInstance){
            throw new Error("Provider is required. Call .provider(...) before .build(). ")
        }

        this.provider = builder.providerInstance;
        this.interceptors = []
        this.toolMap = new Map();

        for (const t of builder.toollist) {
            this.toolMap.set(t.name, t)
        }


this.instruction = `
    ${HARNESS_PROMPT} \n\n

    System Prompt:
    ${builder.instruction}

    Avilable tools:
    ${builder.toollist.map(t => JSON.stringify({ functionName: t.name, functionDescription: t.description, functionDoc: t.doc })).join("\n")}

    `

    this.messageHistory = []
    }

    static builder() {
        return new AgentBuilder()
    }

    public printprompt() {
        console.log(this.instruction)
    }

    public attachTnterceptor(interceptor:Interceptor) {
        this.interceptors.push(interceptor)
    }

    private notifyInterceptor(message:IMessage){
    
        for(const interceptor of this.interceptors){
            interceptor(message)
        }

    }

    public async run(query: string) {
        this.messageHistory.push({ role: 'user', content: query })

        for (let i = 0; i < 50; i++) {
            const llmResponse = await this.provider.generate({
                instruction:this.instruction,
                messages:this.messageHistory
            })

            const rawLLMResponse: string = llmResponse.content
            this.messageHistory.push({ role: 'assistant', content: rawLLMResponse })
            this.notifyInterceptor({role:'assistant',content:rawLLMResponse})

            let parsedResult: { step?: string; functionName?: string; input?: string }
            try {
                parsedResult = JSON.parse(rawLLMResponse)
            } catch {
                this.messageHistory.push({
                    role: 'developer',
                    content: 'Error: LLM response was not valid JSON. Reply with one JSON object only.'
                })
                this.notifyInterceptor({
                    role: 'developer',
                    content: 'Error: LLM response was not valid JSON. Reply with one JSON object only.'
                })
                continue
            }

            if (!parsedResult.step) {
                this.messageHistory.push({
                    role: 'developer',
                    content: 'Error: Missing "step" field in JSON response.'
                })
                this.notifyInterceptor({
                    role: 'developer',
                    content: 'Error: Missing "step" field in JSON response.'
                })
                continue
            }

            const step = parsedResult.step.toLowerCase()

            // Only return history when the pipeline finishes with OUTPUT
            if (step === 'output') {
                return this.messageHistory
            }

            if (step === 'tool_request') {
                const { functionName, input } = parsedResult
                const tool = this.toolMap.get(functionName as string)

                if (!tool) {
                    this.messageHistory.push({
                        role: 'developer',
                        content: `Error: Function with name ${functionName} does not exists`
                    })
                    this.notifyInterceptor({
                        role: 'developer',
                        content: `Error: Function with name ${functionName} does not exists`
                    })
                    continue
                }

                if(functionName === "askToUser"){

                    const toolResult = await tool.executor(input as string)
                    this.messageHistory.push({
                        role: 'user',
                        content: JSON.stringify(toolResult)
                    })
                    this.notifyInterceptor({
                        role: 'user',
                        content: JSON.stringify(toolResult)
                    })
                    continue
                }

                const toolResult = await tool.executor(input as string)
                this.messageHistory.push({
                    role: 'developer',
                    content: JSON.stringify({ functionName, input, toolResult })
                })
                this.notifyInterceptor({
                    role: 'developer',
                    content: JSON.stringify({ functionName, input, toolResult })
                })
            }
        }

        // Max steps reached without OUTPUT — still return history (was undefined before)
        return this.messageHistory
    }


}