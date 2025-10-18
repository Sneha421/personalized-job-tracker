import { Groq } from 'groq-sdk'

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
})

// Example: generate a fun congratulatory message
export async function getCongratsMessage(jobTitle) {
  const prompt = `You just applied to a job at ${jobTitle}. Write a short, playful congratulation message.`
  const res = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [{ role: 'user', content: prompt }]
  })
  return res.choices[0].message.content
}