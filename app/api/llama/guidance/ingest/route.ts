import { LlamaCloudIndex, Document } from "llamaindex";
const index = new LlamaCloudIndex({
    name: "intelligent-engine-guide-docs",
    projectName: "Default",
    apiKey: process.env.LLAMA_CLOUD_API_KEY,
});

export async function POST(request: Request) {
    const { text } = await request.json();
    const document = new Document({
        text: text
    });
    const response = await index.addDocuments([document]);
    console.log(response);
    return Response.json({ success: true, message: "Document added", response: response });
}