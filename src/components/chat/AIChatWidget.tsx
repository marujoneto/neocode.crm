import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Minimize2, Send } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface AIChatWidgetProps {
  isOpen?: boolean;
  onClose?: () => void;
  messages?: Message[];
  onSendMessage?: (message: string) => void;
}

const AIChatWidget = ({
  isOpen = true,
  onClose = () => {},
  messages = [
    {
      id: "1",
      content: "Hello! How can I help you today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ],
  onSendMessage = () => {},
}: AIChatWidgetProps) => {
  const [isMinimized, setIsMinimized] = useState(true);
  const [inputMessage, setInputMessage] = useState("");

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      onSendMessage(inputMessage);
      setInputMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isMinimized ? (
        <Card className="w-[360px] bg-white shadow-xl">
          <div className="bg-primary p-3 flex items-center justify-between rounded-t-lg">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-white" />
              <span className="text-white font-medium">AI Support</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:text-white hover:bg-primary-dark"
                onClick={() => setIsMinimized(true)}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:text-white hover:bg-primary-dark"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px] p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} mb-4`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${message.sender === "user" ? "bg-primary text-white" : "bg-gray-100 text-gray-900"}`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </ScrollArea>
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="relative group">
          <Button
            className="rounded-full w-12 h-12 bg-primary hover:bg-primary-dark shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            onClick={() => setIsMinimized(false)}
          >
            <MessageCircle className="h-6 w-6 text-white" />
          </Button>
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
            <div className="bg-black text-white text-sm py-1 px-2 rounded shadow-lg">
              Need help?
            </div>
          </div>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
        </div>
      )}
    </div>
  );
};

export default AIChatWidget;
