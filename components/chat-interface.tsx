"use client";

import { useState, useRef, useEffect } from "react";
import { SendHorizontal, Bot, User } from "lucide-react";
import { nanoid } from "nanoid";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import { ButtonWithLoading } from "@/components/client/button-with-loading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
  followUpQuestions?: string[];
}

export function ChatInterface() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const handleFollowUpClick = (question: string) => {
    if (isProcessing) return;
    setInput(question);
    // Trigger submit after setting the input
    setTimeout(() => {
      const form = document.querySelector("form");
      if (form) {
        form.dispatchEvent(
          new Event("submit", { cancelable: true, bubbles: true })
        );
      }
    }, 100);
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: nanoid(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMessage.content }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();

      const aiMessage: Message = {
        id: nanoid(),
        role: "assistant",
        content: data.answer,
        timestamp: Date.now(),
        followUpQuestions: data.followUpQuestions || [],
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get a response",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (timestamp?: number): string => {
    if (!timestamp) return "";
    return format(new Date(timestamp), "h:mm a");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] sm:h-[calc(100vh-4rem)] md:h-[80vh] lg:h-[calc(100vh-6rem)] overflow-hidden">
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 bg-background pb-32 sm:pb-24">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="h-full flex items-center justify-center p-4"
          >
            <div className="text-center max-w-md p-4 sm:p-6 bg-card/50 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-2 text-card-foreground">
                Welcome to BVC Assistant
              </h3>
              <p className="text-muted-foreground">Start the conversation!</p>
            </div>
          </motion.div>
        ) : (
          <div className="max-w-3xl mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{
                    opacity: 0,
                    x: message.role === "assistant" ? -20 : 20,
                  }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "flex items-start gap-2 sm:gap-3",
                    message.role === "assistant"
                      ? "justify-start"
                      : "justify-end"
                  )}
                >
                  {message.role === "assistant" && (
                    <Avatar className="mt-0.5">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 max-w-[90%] sm:max-w-[85%] md:max-w-[75%] shadow-sm border",
                      message.role === "assistant"
                        ? "bg-card text-card-foreground border-border/30"
                        : "bg-primary/90 text-primary-foreground border-primary/20"
                    )}
                  >
                    <div
                      className={cn(
                        "prose dark:prose-invert prose-sm",
                        message.role === "assistant"
                          ? "prose-headings:text-card-foreground prose-a:text-primary"
                          : "prose-headings:text-primary-foreground prose-a:text-primary-foreground"
                      )}
                    >
                      {message.role === "assistant" ? (
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      ) : (
                        message.content
                      )}
                    </div>
                    {message.timestamp && (
                      <div
                        className={cn(
                          "text-xs mt-1",
                          message.role === "assistant"
                            ? "text-muted-foreground"
                            : "text-primary-foreground/80"
                        )}
                      >
                        {formatTime(message.timestamp)}
                      </div>
                    )}
                    {/* Follow-up questions - only show for the last assistant message */}
                    {message.role === "assistant" &&
                      message.followUpQuestions &&
                      message.followUpQuestions.length > 0 &&
                      index === messages.length - 1 && ( // Only show for the latest message
                        <div className="mt-3 pt-3 border-t border-border/30">
                          <p className="text-xs font-medium mb-2 text-muted-foreground">
                            Related questions:
                          </p>
                          <div className="flex flex-col gap-1.5">
                            {message.followUpQuestions.map((question, idx) => (
                              <motion.button
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => handleFollowUpClick(question)}
                                disabled={isProcessing}
                                className="text-left text-xs px-3 py-2 rounded-md bg-secondary/50 hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-border/20"
                              >
                                {question}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}
                  </motion.div>
                  {message.role === "user" && (
                    <Avatar className="mt-0.5">
                      <AvatarFallback className="bg-accent text-accent-foreground">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                      {user?.imageUrl && (
                        <AvatarImage src={user.imageUrl} alt="User" />
                      )}
                    </Avatar>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-2 sm:gap-3"
                >
                  <Avatar className="mt-0.5">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      <Bot size={20} />
                    </AvatarFallback>
                  </Avatar>
                  <motion.div
                    animate={{
                      scale: [1, 1.01, 1],
                      transition: { duration: 2, repeat: Infinity },
                    }}
                    className="bg-card/80 border border-border/30 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm"
                  >
                    <div className="prose dark:prose-invert prose-sm">
                      BVC Assistant is thinking...
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t bg-card/80 backdrop-blur-sm p-3 sm:p-4 shadow-md fixed bottom-0 left-0 right-0 z-10">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isProcessing}
              ref={inputRef}
              className="flex-1 bg-background/80 border-input"
            />
            <ButtonWithLoading
              type="submit"
              disabled={!input.trim() || isProcessing}
              isLoading={isProcessing}
              className="h-10 w-10 p-0 rounded-full shadow-sm"
              variant="ghost"
            >
              {!isProcessing ? <SendHorizontal className="h-4 w-4" /> : null}
            </ButtonWithLoading>
          </form>
          <div className="mt-2 text-xs text-muted-foreground text-center">
            BVC Assistant helps with business process questions.
          </div>
        </div>
      </div>
    </div>
  );
}
