import { ZepClient } from "@getzep/zep-cloud";

class ZepManager {
    private client = new ZepClient({
        apiKey: process.env.ZEP_API_KEY,
    });

    public async addUser(userId: string, email: string, firstName: string, lastName: string, metadata: Record<string, unknown>) {
        if (!this.client) throw new Error("Zep client not initialized");
        try {
            await this.client.user.add({
                userId: userId,
                email: email,
                firstName: firstName,
                lastName: lastName,
                metadata: metadata,
            });
        } catch (error) {
            console.error("Error adding user:", error);
            throw error;
        }
    }

    public async updateUser(userId: string, email: string, firstName: string, lastName: string, metadata: Record<string, unknown>) {
        if (!this.client) throw new Error("Zep client not initialized");
        try {
            await this.client.user.update(userId, {
                email: email,
                firstName: firstName,
                lastName: lastName,
                metadata: metadata,
            });
        } catch (error) {
            console.error("Error updating user:", error);
            throw error;
        }
    }

    public async upsertUser(userId: string, email: string, firstName: string, lastName: string, metadata: Record<string, unknown>) {
        if (!this.client) throw new Error("Zep client not initialized");
        try {
            // Try to get the user first
            const user = await this.client.user.get(userId);

            // If user exists, update them
            if (user) {
                // await this.updateUser(userId, email, firstName, lastName, metadata);
                console.log(`Updated Zep user: ${userId}`);
            }
        } catch (error: any) {
            // If it's a 404 error (user not found), create the user
            if (error.statusCode === 404) {
                try {
                    await this.addUser(userId, email, firstName, lastName, metadata);
                    console.log(`Created Zep user: ${userId}`);
                } catch (createError) {
                    console.error("Error creating user after 404:", createError);
                    throw createError;
                }
            } else {
                // If it's any other error, re-throw it
                console.error("Error upserting user:", error);
                throw error;
            }
        }
    }

    public async createSession(userId: string, sessionId: string) {
        if (!this.client) throw new Error("Zep client not initialized");
        try {
            const session = await this.client.memory.addSession({ sessionId: sessionId, userId: userId });
            return session;
        } catch (error) {
            console.error("Error creating session:", error);
            throw error;
        }
    }

    public async addMessage(sessionId: string, content: string, role_type: string, userName: string | null) {
        if (!this.client) throw new Error("Zep client not initialized");
        const valid_role_types = ["user", "assistant", "system", "tool", "function"];
        if (!valid_role_types.includes(role_type)) {
            throw new Error("Invalid role type");
        }
        try {
            const role = role_type === "user" && userName ? userName : "Betty";
            await this.client.memory.add(sessionId, {
                messages: [{
                    role: role,
                    content: content,
                    roleType: role_type as "user" | "assistant" | "system"
                }],
            });
        } catch (error) {
            console.error("Error adding message:", error);
            throw error;
        }
    }

    public async getMemoryContext(sessionId: string, userId: string | null) {
        if (!this.client) throw new Error("Zep client not initialized");
        if (!sessionId) throw new Error("Session ID is required");
        if (userId) {
            const user = await this.client.user.get(userId);
            if (!user) throw new Error("User not found");
        }
        try {
            const memory = await this.client.memory.get(sessionId);
            return memory.context;
        }
        catch (error) {
            console.error("Error getting messages:", error);
            throw error;
        }
    }
}

const zepManager = new ZepManager();

export default zepManager;