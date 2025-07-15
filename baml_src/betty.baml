template_string BettyCorePrompt #"
    You are Betty — a high-touch, real-time coaching assistant designed to help users communicate with clarity, confidence, and alignment to their natural style.
    Your purpose is to support users in crafting messages, making decisions, and leading conversations in a way that feels like the best version of themselves — not like someone else.
"#

template_string RelevantFeedbacks(relevant_feedbacks: string) #"
    {% if relevant_feedbacks %}
        Here are some relevant feedbacks about similar conversation histories between Betty and the user:
        {{ relevant_feedbacks }}
        You can refer to the feedbacks to better help the user.
    {% else %}
        ""
    {% endif %}
"#

template_string UserInfluenceStyle(user_influence_style: string) #"
    {% if user_influence_style %}
        You are coaching a user whose influence style is {{ user_influence_style }}.
    {% else %}
        You are coaching a user who is not specified. Assume the user is a Catalyst.
    {% endif %}
"#

template_string UserMemory(user_memory: string) #"
    {% if user_memory %}
        Here is the user's memory:
        {{ user_memory }}
    {% else %}
        ""
    {% endif %}
"#

class Message {
    role "user" | "assistant" @description(#"
        The role of the message.
    "#)
    content string @description(#"
        The content of the message.
    "#)
}

template_string ConversationHistory(messages: Message[]) #"
    {% if messages %}
        Here is the recent conversation history between Betty and the user:
        {% for message in messages %}
            {{ _.role(message.role) }}
            {{ message.content }}
        {% endfor %}
    {% else %}
        ""
    {% endif %}
"#

template_string UserMetadataTemplate(user_metadata: UserMetadata) #"
    {% if user_metadata %}
        Here is the user's metadata:
        Name: {{ user_metadata.name }}
        Influence Style: {{ user_metadata.influence_style }}
    {% else %}
        ""
    {% endif %}
"#

class UserMetadata {
  name string @description(#"
    The name of the user.
  "#)
  influence_style string @description(#"
    The influence style of the user.
  "#)
}

class ResponseChat {
  answer string @stream.not_null @description(#"
    The answer to the user's question or request.
  "#)
  @@dynamic
}

function Betty(instruction: string, messages: Message[], relevant_feedbacks: string, user_metadata: UserMetadata, user_memory: string) -> ResponseChat {
  // Specify a client as provider/model-name
  // you can use custom LLM params with a custom client name from clients.baml like "client CustomHaiku"
  client CustomGPT41 // Set OPENAI_API_KEY to use this client.
  prompt #"

    {{ BettyCorePrompt() }}

    {{ instruction }}

    {{ RelevantFeedbacks(relevant_feedbacks) }}

    {{ UserMetadataTemplate(user_metadata) }}

    {{ UserMemory(user_memory) }}

    {{ ConversationHistory(messages) }}

    {{ _.role("system") }}

    Provide your response.

    {{ ctx.output_format }}
  "#
}
function InitialMessageChat(instruction: string, relevant_feedbacks: string, user_influence_style: string, user_memory: string) -> string {
  client CustomGPT41
  prompt #"
    Generate an initial message for the user to start the chat. No need to introduce the app as if it is their first time.

    {{ BettyCorePrompt() }}

    {{ instruction }}

    {{ RelevantFeedbacks(relevant_feedbacks) }}

    {{ UserInfluenceStyle(user_influence_style) }}

    {{ UserMemory(user_memory) }}

    Answer:
  "#
}
test TestBetty {
    functions [Betty]
    type_builder {
        dynamic class ResponseChat {
            tool_calls (SwitchInfluenceStyle)[]
        }
    }
    args {
        instruction "You are Betty, an assistant coaching real estate business to the users."
        messages [
            {role "user", content "Hi, nice to meet you."},
            {role "assistant", content "Hi, nice to meet you too."},
            {role "user", content "What is my influence style?"},
            {role "assistant", content "You are a diplomat."},
            {role "user", content "No, I am Catalyst, change my influence style to Catalyst."},
        ]
        relevant_feedbacks "Behave like a diplomat. You should be friendly and engaging."
        user_influence_style "Diplomat"
        user_memory "The user is a real estate business owner."
    }
}

test TestInitialMessageChat {
    functions [InitialMessageChat]
    args {
        instruction "You are Betty, an assistant coaching real estate business to the users."
        relevant_feedbacks "Behave like a diplomat. You should be friendly and engaging."
        user_influence_style "Catalyst"
        user_memory "The user is a real estate business owner."
    }
}