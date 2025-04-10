import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bell, Send } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usersService } from "@/lib/services/firebase/users";
import { messagesService, Message } from "@/lib/services/firebase/messages";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const MessageCenter = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<
    Array<{ id: string; displayName: string }>
  >([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (!currentUser?.uid) return;

    const loadData = async () => {
      try {
        const [usersData, messagesData] = await Promise.all([
          usersService.getAll(),
          messagesService.getAll(currentUser.uid),
        ]);
        // Filter out current user and ensure we have valid display names
        const filteredUsers = usersData
          .filter((u) => u.id !== currentUser.uid && u.displayName)
          .map((u) => ({
            id: u.id,
            displayName: u.displayName || u.email,
          }));
        setUsers(filteredUsers);
        setMessages(messagesData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        });
      }
    };

    loadData();

    // Set up real-time listener for new messages
    const unsubscribe = messagesService.subscribeToMessages(
      currentUser.uid,
      (newMessages) => {
        setMessages(newMessages);
      },
    );

    return () => unsubscribe();
  }, [currentUser?.uid, toast]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUser) {
      toast({
        title: "Error",
        description: "Please select a recipient and enter a message",
        variant: "destructive",
      });
      return;
    }

    try {
      await messagesService.create({
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email || "",
        recipientId: selectedUser,
        content: newMessage,
      });

      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully",
      });
      setNewMessage("");
      setSelectedUser("");

      // Refresh messages
      const messagesData = await messagesService.getAll(currentUser.uid);
      setMessages(messagesData);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await messagesService.markAsRead(messageId);
      setMessages(
        messages.map((msg) =>
          msg.id === messageId ? { ...msg, read: true } : msg,
        ),
      );
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  return (
    <Card className="w-full bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Messages & Notifications
          <Badge variant="secondary" className="ml-2">
            {messages.filter((m) => !m.read).length} New
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg ${message.read ? "bg-secondary/50" : "bg-secondary"} cursor-pointer`}
                onClick={() =>
                  !message.read && message.id && handleMarkAsRead(message.id)
                }
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium">{message.senderName}</span>
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp.toDate().toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm">{message.content}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex flex-col gap-2 mt-4">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder="Select recipient" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <Button
              className="bg-[#0F172A] text-white hover:bg-[#0F172A]/90"
              onClick={handleSendMessage}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1.20308 1.04312C1.00481 0.954998 0.772341 1.0048 0.627577 1.16641C0.482813 1.32802 0.458794 1.56455 0.568117 1.75196L3.92115 7.50002L0.568117 13.2481C0.458794 13.4355 0.482813 13.672 0.627577 13.8336C0.772341 13.9952 1.00481 14.045 1.20308 13.9569L14.2031 7.95693C14.3837 7.87668 14.5 7.69762 14.5 7.50002C14.5 7.30243 14.3837 7.12337 14.2031 7.04312L1.20308 1.04312ZM4.73178 7.50002L2.19591 3.24180L12.1056 7.50002L2.19591 11.7582L4.73178 7.50002Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MessageCenter;
