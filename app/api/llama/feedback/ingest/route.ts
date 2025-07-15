import { LlamaCloudIndex, Document } from "llamaindex";
const index = new LlamaCloudIndex({
    name: "intelligent-engine-admin-feedback",
    projectName: "Default",
    apiKey: process.env.LLAMA_CLOUD_API_KEY,
});

export async function POST(request: Request) {
    const { text, userInfluenceStyle } = await request.json();
    const document = new Document({
        text: text,
        metadata: {
            userInfluenceStyle: userInfluenceStyle
        }
    });
    const response = await index.addDocuments([document]);
    console.log(response);
    return Response.json({ success: true, message: "Feedback added", response: response });
}