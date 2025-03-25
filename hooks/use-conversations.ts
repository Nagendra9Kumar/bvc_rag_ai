import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { useToast } from '@/components/ui/use-toast';
import { useDebounce } from './use-debounce';

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
  title?: string;
  messages?: Message[];
}

export interface ConversationsResponse {
  conversations: Conversation[];
}

// SWR fetcher with error handling
const fetcher = async (url: string): Promise<ConversationsResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to fetch conversations');
  }
  return response.json();
};

export function useConversations() {
  const { toast } = useToast();
  const [inputValue, setInputValue] = useState('');
  const debouncedInput = useDebounce(inputValue, 300);
  
  const { data, error, isLoading, mutate: refreshConversations } = useSWR<ConversationsResponse>(
    '/api/conversations',
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000, // 5 seconds
    }
  );
  
  const conversations = data?.conversations || [];

  // Helper function for error handling
  const handleApiError = (error: unknown, defaultMessage: string): string => {
    if (error instanceof Error) {
      return error.message;
    }
    return defaultMessage;
  };

  // Create a new conversation
  const createConversation = async (title: string = 'New Chat'): Promise<Conversation | null> => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          messages: [],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create conversation');
      }
      
      const newConversation = await response.json() as Conversation;
      
      // Update the local cache optimistically
      mutate(
        '/api/conversations', 
        { conversations: [newConversation, ...conversations] }, 
        { revalidate: false }
      );
      
      // Refresh data from server
      await refreshConversations();
      
      return newConversation;
    } catch (error) {
      toast({
        title: 'Error',
        description: handleApiError(error, 'Failed to create conversation'),
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update an existing conversation
  const updateConversation = async (id: string, updates: UpdateConversationRequest): Promise<boolean> => {
    try {
      const conversation = conversations.find(c => c._id === id);
      if (!conversation) throw new Error('Conversation not found');
      
      const updateData = {
        title: updates.title ?? conversation.title,
        messages: updates.messages ?? conversation.messages,
      };
      
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update conversation');
      }
      
      // Update local data optimistically
      const updatedConversations = conversations.map(conv => 
        conv._id === id ? { ...conv, ...updateData } : conv
      );
      
      mutate(
        '/api/conversations', 
        { conversations: updatedConversations }, 
        { revalidate: false }
      );
      
      // Refresh data from server
      await refreshConversations();
      
      return true;
    } catch (error) {
      toast({
        title: 'Error',
        description: handleApiError(error, 'Failed to update conversation'),
        variant: 'destructive',
      });
      return false;
    }
  };

  // Delete a conversation
  const deleteConversation = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to delete conversation');
      }
      
      // Update local data optimistically
      const updatedConversations = conversations.filter(c => c._id !== id);
      mutate(
        '/api/conversations', 
        { conversations: updatedConversations }, 
        { revalidate: false }
      );
      
      // Refresh data from server
      await refreshConversations();
      
      return true;
    } catch (error) {
      toast({
        title: 'Error',
        description: handleApiError(error, 'Failed to delete conversation'),
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    conversations,
    isLoading,
    error,
    createConversation,
    updateConversation,
    deleteConversation,
    inputValue,
    setInputValue,
    debouncedInput
  };
}
