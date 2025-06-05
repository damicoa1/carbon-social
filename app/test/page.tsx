import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

const model = openai("o3-mini")

export const answerMyQuestion = async (
    prompt: string,
) => {
    const { text } = await generateText({
        model,
        prompt,
    })

    return text;
}

const answer = await answerMyQuestion(
    "what topics do I need to know for machine learning math?"
)

console.log(answer)