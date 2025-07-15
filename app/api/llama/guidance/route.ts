import { LlamaCloudIndex, ContextChatEngine, Settings, SimilarityPostprocessor, } from "llamaindex";

// connect to existing index
const index = new LlamaCloudIndex({
    name: "intelligent-engine-guide-docs",
    projectName: "Default",
    apiKey: process.env.LLAMA_CLOUD_API_KEY, // can provide API-key in the constructor or in the env
});

const retriever = index.asRetriever({
    similarityTopK: 30,
    sparse_similarity_top_k: 30,
    alpha: 0.5,
    enable_reranking: true,
    rerank_top_n: 6,
    retrieval_mode: "chunks"
});

export async function POST(request: Request) {
    const { query } = await request.json();
    const retrieval = await retriever.retrieve(query);
    // const similarityPostprocessor = new SimilarityPostprocessor({ similarityCutoff: 0.1 });
    // const filteredRetrieval = await similarityPostprocessor.postprocessNodes(retrieval);
    // console.log(filteredRetrieval);
    return Response.json(retrieval);
}