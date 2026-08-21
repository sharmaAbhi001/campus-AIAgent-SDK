import type { IMessage } from "../app/types.js";

export interface ProviderRequest {
    instruction:string;
    messages:IMessage[];
}

export interface ProviderResponse {
    content: string;
}


export interface IProvider {
    generate(
        request:ProviderRequest
    ):Promise<ProviderResponse>;
}


