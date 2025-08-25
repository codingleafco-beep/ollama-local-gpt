import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message, model = "llama3.2" } = await request.json()

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Call Ollama API (default localhost:11434)
    const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434"

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: message,
        stream: true, // Enable streaming
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Ollama API error:", errorText)
      return new Response(
        JSON.stringify({
          error: "Failed to get response from Ollama. Make sure Ollama is running on localhost:11434",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          controller.close()
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              controller.close()
              break
            }

            const chunk = decoder.decode(value)
            const lines = chunk.split("\n").filter((line) => line.trim())

            for (const line of lines) {
              try {
                const data = JSON.parse(line)

                // Send each token as it arrives
                if (data.response) {
                  controller.enqueue(
                    new TextEncoder().encode(
                      `data: ${JSON.stringify({
                        token: data.response,
                        done: data.done || false,
                      })}\n\n`,
                    ),
                  )
                }

                if (data.done) {
                  controller.enqueue(
                    new TextEncoder().encode(
                      `data: ${JSON.stringify({
                        token: "",
                        done: true,
                      })}\n\n`,
                    ),
                  )
                  controller.close()
                  return
                }
              } catch (parseError) {
                // Skip invalid JSON lines
                continue
              }
            }
          }
        } catch (error) {
          console.error("Streaming error:", error)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response(
      JSON.stringify({
        error: "Internal server error. Check if Ollama is running.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
