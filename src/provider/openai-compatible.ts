import OpenAI from "openai";    


import type { IProvider, ProviderRequest, ProviderResponse } from "./types.js";

export interface OpenAICompatibleConfig {
    apikey:string;
    model:string;
    baseURL?:string;

    headers?:Record<string,string>;
}

export class OpenAICompatibleProvider implements IProvider {

    private client:OpenAI;
    private model:string;

    constructor(
        config:OpenAICompatibleConfig
    ){
        this.client = new OpenAI({
            apiKey:config.apikey,
            baseURL:config.baseURL,
            defaultHeaders:config.headers,
        });

        this.model = config.model;

    }

    async generate(request: ProviderRequest): Promise<ProviderResponse> {
        
        const messages = [
            {
                role:"system" as const,
                content:request.instruction,
            },
            ...request.messages.map(
                (message)=>({
                    role:message.role,
                    content:message.content,
                })
            ),
        ];

        const response = await this.client.chat.completions.create({
            model:this.model,
            messages,
        })

        return {
            content:response.choices[0]?.message.content ?? "",
        }

    }

   }