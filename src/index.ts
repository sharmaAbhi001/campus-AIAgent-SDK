
export { Agent, AgentBuilder } from "./app/agent.js";
export type { Itool, IMessage, Interceptor, MessageRole } from "./app/types.js";
export type { IProvider, ProviderRequest, ProviderResponse } from "./provider/types.js";
export { openai, groq, openrouter, together } from "./provider/intext.js";
export { OpenAICompatibleProvider } from "./provider/openai-compatible.js";
export type { OpenAICompatibleConfig } from "./provider/openai-compatible.js";
import { Agent } from "./app/agent.js";
import type { Itool } from "./app/types.js";
import { openai } from "./provider/intext.js";
import promptSync from 'prompt-sync';


const prompt = promptSync({ sigint: true }); 

const askHandler = async (question: string): Promise<string> => {
    

    const input = prompt(question)

    return input;

    };


const askInformationTool : Itool = {
    name: "askToUser",
    description: "This tool is used to ask information from user. The input is the question to be asked to user .",
    executor: async (input: string) => {
        const question = input;
        const answer = await askHandler(question);
        return answer;
    }
}   


const agent = Agent.builder()
.provider(openai({ apikey :"" , model:"gpt-4o-mini" }))
.setInstruction("You are a helpful assistant that can use tools to answer questions.")
.tool(askInformationTool)
.build();

agent.attachTnterceptor((message)=>{
console.log("Interceptor: ", message)
})

const response = await agent.run("What is the weather like today?");

