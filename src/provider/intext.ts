import { OpenAICompatibleProvider } from "./openai-compatible.js";  

export function openai(config:{
    apikey:string;
    model:string;
}){
    return new OpenAICompatibleProvider ({
        apikey:config.apikey,
        model:config.model
    })
}


export function groq(config: {
    apiKey: string;
    model: string;
  }) {
    return new OpenAICompatibleProvider({
      apikey: config.apiKey,
  
      model: config.model,
  
      baseURL:
        "https://api.groq.com/openai/v1",
    });
  }




  export function openrouter(config: {
    apiKey: string;
    model: string;
  }) {
    return new OpenAICompatibleProvider({
      apikey: config.apiKey,
  
      model: config.model,
  
      baseURL:
        "https://openrouter.ai/api/v1",
    });
  }


  export function together(config: {
    apiKey: string;
    model: string;
  }) {
    return new OpenAICompatibleProvider({
      apikey: config.apiKey,
  
      model: config.model,
  
      baseURL:
        "https://api.together.xyz/v1",
    });
  }
