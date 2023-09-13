import "dotenv/config"
import { OpenAI } from "openai"

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY, //por conta da biblioteca dotenv é possível chamar todas as variaveis do arquivo env, desta forma
})
