export type MessageRole = 
| "user"
| "assistant"
| "developer" ;


export interface IMessage {
    role:MessageRole;
    content:string;
}

export interface Itool {
    name:string;
    description:string;
    doc?:string;

    executor:(
        input:string
    ) =>Promise<string>;
}

export type Interceptor =(
    message:IMessage
) =>void;

export type AskHandler =(question:string) => Promise<string>;