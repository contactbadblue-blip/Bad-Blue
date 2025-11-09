import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Bot, User, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface FormAssistantProps {
  formType: 'complaint' | 'lawsuit' | 'petition';
  currentFormData: Record<string, any>;
  onFieldsSuggested?: (fields: Record<string, any>) => void;
  onReadyToSubmit?: (ready: boolean) => void;
  userContext?: Record<string, any>; // Full ClientSession context
  refinementMode?: boolean;
  damagesCalculatorMode?: boolean;
}

export function FormAssistant({
  formType,
  currentFormData,
  onFieldsSuggested,
  onReadyToSubmit,
  userContext,
  refinementMode = false,
  damagesCalculatorMode = false,
}: FormAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null); // Renamed from messagesEndRef to scrollRef for clarity and to match original usage
  const { toast } = useToast();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Helper function to send messages, used for initial auto-calculation
  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    const userMessage = messageContent.trim();
    // Add user message to chat
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Send to AI assistant API with full user context
      const response = await apiRequest("/api/form-assistant/chat", "POST", {
        formType,
        userContext: userContext || {},
        currentFormData,
        conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
        userMessage
      });

      const data = await response.json();

      // Add assistant response
      setMessages([...newMessages, { role: 'assistant', content: data.message }]);

      // If AI suggested form fields, notify parent component
      if (data.suggestedFields && Object.keys(data.suggestedFields).length > 0) {
        onFieldsSuggested?.(data.suggestedFields);

        toast({
          title: "Form Updated",
          description: `The AI assistant filled in ${Object.keys(data.suggestedFields).length} field(s) based on your conversation.`,
        });
      }

      // If form is ready to submit
      if (data.readyToSubmit) {
        toast({
          title: "Information Complete",
          description: "I have all the information needed. You can now proceed to submit your form.",
          variant: "default",
        });
        onReadyToSubmit?.(true);
      }

    } catch (error: any) {
      console.error("Error chatting with assistant:", error);

      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: "I'm sorry, I encountered an error. Please try again in a moment. If the issue persists, you may need to come back later."
        }
      ]);

      toast({
        title: "Error",
        description: "Failed to connect to AI assistant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  // Initialize with a greeting on component mount
  useEffect(() => {
    if (messages.length === 0) {
      const initialMessage = damagesCalculatorMode
        ? `I'll analyze your case and provide an estimated damages calculation based on similar cases in ${userContext?.state || 'your state'}. I'll consider medical bills, lost wages, pain and suffering, and emotional distress. Let me review your case details...`
        : refinementMode
        ? "I'll help you fill in any missing information in your lawsuit. I've reviewed the document and identified sections that need more detail. Let's go through them together."
        : formType === 'complaint'
        ? "Hello! I'm here to help you file a police complaint. I'll guide you through the process step by step. First, which US state did this incident occur in?"
        : formType === 'lawsuit'
        ? "Hello! I'm here to help you file a civil rights lawsuit. I'll guide you through gathering all necessary information. First, which US state are you filing in?"
        : "Hello! I'm here to help you create a petition. I'll guide you through the process. First, which US state did the incident occur in?";

      setMessages([
        {
          role: 'assistant',
          content: initialMessage,
        },
      ]);

      // Auto-calculate damages if in calculator mode
      if (damagesCalculatorMode) {
        handleSendMessage("Calculate estimated damages for my case");
      }
    }
  }, []);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");

    // Add user message to chat
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Send to AI assistant API with full user context
      const response = await apiRequest("/api/form-assistant/chat", "POST", {
        formType,
        userContext: userContext || {},
        currentFormData,
        conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
        userMessage
      });

      const data = await response.json();

      // Add assistant response
      setMessages([...newMessages, { role: 'assistant', content: data.message }]);

      // If AI suggested form fields, notify parent component
      if (data.suggestedFields && Object.keys(data.suggestedFields).length > 0) {
        onFieldsSuggested?.(data.suggestedFields);

        toast({
          title: "Form Updated",
          description: `The AI assistant filled in ${Object.keys(data.suggestedFields).length} field(s) based on your conversation.`,
        });
      }

      // If form is ready to submit
      if (data.readyToSubmit) {
        toast({
          title: "Information Complete",
          description: "I have all the information needed. You can now proceed to submit your form.",
          variant: "default",
        });
        onReadyToSubmit?.(true);
      }

    } catch (error: any) {
      console.error("Error chatting with assistant:", error);

      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: "I'm sorry, I encountered an error. Please try again in a moment. If the issue persists, you may need to come back later."
        }
      ]);

      toast({
        title: "Error",
        description: "Failed to connect to AI assistant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="w-full" data-testid="card-ai-assistant">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Form Assistant
        </CardTitle>
        <CardDescription>
          Tell me what happened in detail below, and I'll extract all the information needed for your {formType}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* Chat messages */}
          <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
            <div className="flex flex-col gap-4" data-testid="chat-messages">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  data-testid={`message-${message.role}-${index}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === 'user' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="rounded-lg px-4 py-2 bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input field */}
          <div className="flex flex-col gap-2">
            <Textarea
              placeholder="Describe what happened in detail... Include the officer's name, badge number (if known), department, location, date, and a detailed account of the incident."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              className="min-h-[100px] resize-y"
              data-testid="input-chat-message"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Press Ctrl+Enter (⌘+Enter on Mac) to send
              </p>
              <Button
                onClick={sendMessage}
                disabled={isLoading || !inputValue.trim()}
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}