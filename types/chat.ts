export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export interface Conversation {
  _id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  userId: string;
}

export interface UpdateConversationRequest {
  title: string;
  messages: Message[];
}

export interface ConversationsResponse {
  conversations: Conversation[];
}