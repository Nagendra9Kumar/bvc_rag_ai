import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useConversations } from "@/hooks/use-conversations";
import { MessageSquare, PlusSquare, Trash2, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided } from 'react-beautiful-dnd';
import { useToast } from "@/components/ui/use-toast";

interface ConversationSidebarProps {
  activeConversation: string | null;
  onSwitchConversation: (id: string) => void;
  mobileSidebarOpen: boolean;
  onCloseMobileSidebar: () => void;
}

interface Conversation {
  _id: string;
  title: string;
  createdAt: number;
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onDelete: (id: string, e: React.MouseEvent<HTMLButtonElement>) => void;
  onSelect: (id: string) => void;
}

const ConversationItem = ({ conversation, isActive, onDelete, onSelect }: ConversationItemProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onSelect(conversation._id);
    } else if (e.key === 'Delete') {
      e.stopPropagation();
      onDelete(conversation._id, e as any);
    }
  };

  return (
    <div 
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-selected={isActive}
      className={cn(
        "flex items-center gap-2 rounded-md p-2 cursor-pointer hover:bg-accent group transition-colors duration-150",
        isActive ? "bg-accent/80 hover:bg-accent/80" : "hover:bg-accent/50"
      )}
      onClick={() => onSelect(conversation._id)}
    >
      <MessageSquare className="h-4 w-4 shrink-0" />
      <span className="text-sm truncate flex-1">{conversation.title}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => onDelete(conversation._id, e)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete conversation</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export function ConversationSidebar({
  activeConversation,
  onSwitchConversation,
  mobileSidebarOpen,
  onCloseMobileSidebar
}: ConversationSidebarProps) {
  const { 
    conversations, 
    isLoading, 
    error, 
    createConversation, 
    deleteConversation 
  } = useConversations();
  
  const { toast } = useToast();
  
  // Sort conversations by created date (newest first)
  const sortedConversations = useMemo(() => 
    [...conversations].sort((a, b) => b.createdAt - a.createdAt),
    [conversations]
  );

  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredConversations = useMemo(() => 
    sortedConversations.filter(conv => 
      conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [sortedConversations, searchQuery]
  );

  // Handle creating a new conversation
  const handleNewConversation = async () => {
    try {
      const newConversation = await createConversation("New Chat");
      if (newConversation) {
        onSwitchConversation(newConversation._id);
        onCloseMobileSidebar();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create new conversation",
        variant: "destructive",
      });
    }
  };

  // Handle switching conversation
  const handleSwitchConversation = useCallback((id: string) => {
    console.log('Switching to conversation:', id);
    onSwitchConversation(id);
    onCloseMobileSidebar();
  }, [onSwitchConversation, onCloseMobileSidebar]);

  // Handle deleting a conversation
  const handleDelete = async (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    
    // Confirm deletion if it's the last conversation
    if (conversations.length === 1) {
      if (!confirm('Delete your only conversation? This cannot be undone.')) {
        return;
      }
    }
    
  try {
    const success = await deleteConversation(id);
    if (success && id === activeConversation) {
      // If we deleted the active conversation, select the first remaining one
      if (conversations.length > 1) {
        const remainingConversations = conversations.filter(conv => conv._id !== id);
        onSwitchConversation(remainingConversations[0]._id);
      }
    }
  } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    }
  };

const onDragEnd = (result: any): void => {
    if (!result.destination) return;
    
    const items = Array.from(sortedConversations);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update conversation order in backend
    // Implementation depends on your backend API
};

  return (
    <div 
      className={cn(
        "fixed inset-y-0 left-0 w-72 md:w-80 bg-muted/30 border-r z-50 transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex flex-col h-full pt-16 md:pt-0">
        {/* Mobile Close Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 right-4 md:hidden" 
          onClick={onCloseMobileSidebar}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="font-semibold">BVC Assistant</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleNewConversation} className="gap-1.5">
                  <PlusSquare className="h-3.5 w-3.5" />
                  New Chat
                </Button>
              </TooltipTrigger>
              <TooltipContent>Start a new conversation</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="p-4">
          <input
            type="search"
            placeholder="Search conversations..."
            className="w-full p-2 rounded-md border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-muted animate-pulse"></div>
                  <div className="h-4 w-40 rounded bg-muted animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <p>Failed to load conversations</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No conversations yet</p>
              <p className="text-sm">Start a new conversation</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="conversations">
                {(provided: DroppableProvided) => (
                  <div className="space-y-1" {...provided.droppableProps} ref={provided.innerRef}>
                    {filteredConversations.map((conversation, index) => (
                      <Draggable key={conversation._id} draggableId={conversation._id} index={index}>
                        {(provided: DraggableProvided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                            <ConversationItem 
                              key={conversation._id}
                              conversation={conversation}
                              isActive={activeConversation === conversation._id}
                              onDelete={handleDelete}
                              onSelect={handleSwitchConversation}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>
    </div>
  );
}