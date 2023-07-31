"use client";

import { useChat } from "ai/react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div className="w-screen h-screen flex flex-col p-4 gap-2">
      <div className="flex-1 w-full overflow-y-auto">
        {messages.map((m) => (
          <div key={m.id} className="flex flex-row flex-nowrap p-2 gap-2">
            <div className="w-20 font-bold">
              {m.role === "user" ? "😮 User: " : "🤖 AI: "}
            </div>
            <div className="flex-1">
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-row gap-4">
        <input
          value={input}
          onChange={handleInputChange}
          className="border border-black rounded-md p-2 text-black flex-1"
        />
        <button
          type="submit"
          className="py-2 px-4 border border-black rounded-md hover:bg-black hover:text-white transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
