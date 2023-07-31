import { LangChainStream, StreamingTextResponse } from "ai";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { AIMessage, HumanMessage } from "langchain/schema";
import { GithubRepoLoader } from "langchain/document_loaders/web/github";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { z } from "zod";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { BufferMemory, ChatMessageHistory } from "langchain/memory";

export async function POST(req: Request) {
  const { messages } = z
    .object({
      messages: z.array(
        z.object({
          role: z.enum(["system", "user", "assistant", "function"]),
          content: z.string(),
        })
      ),
    })
    .parse(await req.json());
  const { stream, handlers } = LangChainStream();

  const loader = new GithubRepoLoader(
    "https://github.com/chungweileong94/server-act",
    {
      branch: "main",
      recursive: true,
      unknown: "warn",
      ignorePaths: [".github", ".vscode", ".changeset"],
    }
  );
  const docs = await loader.load();
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 0,
  });

  const splitDocs = await textSplitter.splitDocuments(docs);
  const embeddings = new OpenAIEmbeddings();
  const vectorStore = await MemoryVectorStore.fromDocuments(
    splitDocs,
    embeddings
  );

  const llm = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    openAIApiKey: process.env.OPENAI_API_KEY,
    streaming: true,
  });
  const chain = ConversationalRetrievalQAChain.fromLLM(
    llm,
    vectorStore.asRetriever(),
    {
      memory: new BufferMemory({
        memoryKey: "chat_history",
        chatHistory:
          messages.length !== 1
            ? new ChatMessageHistory(
                messages.map((m) =>
                  m.role == "user"
                    ? new HumanMessage(m.content)
                    : new AIMessage(m.content)
                )
              )
            : undefined,
      }),
    }
  );

  chain
    .call({ question: messages[messages.length - 1].content }, [handlers])
    .catch(console.log);

  return new StreamingTextResponse(stream);
}
