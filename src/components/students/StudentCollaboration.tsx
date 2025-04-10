import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Clock,
  MessageSquare,
  Phone,
  Mail,
  Video,
  Tag,
  AlertCircle,
  Check,
  Plus,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Student } from "@/lib/services/firebase/students";
import {
  collaborationService,
  Comment,
  Reminder,
  Interaction,
} from "@/lib/services/firebase/collaborations";

interface StudentCollaborationProps {
  student: Student;
}

const StudentCollaboration = ({ student }: StudentCollaborationProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("comments");

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  // Reminders state
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    title: "",
    description: "",
    dueDate: new Date().toISOString().split("T")[0],
    tags: [] as string[],
    assignedTo: user?.id || "",
  });
  const [newTag, setNewTag] = useState("");

  // Interactions state
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [interactionForm, setInteractionForm] = useState({
    type: "note" as Interaction["type"],
    description: "",
    outcome: "",
    followUpDate: "",
  });

  // Load data
  useEffect(() => {
    if (!student.id) return;

    const loadData = async () => {
      try {
        const [commentsData, remindersData, interactionsData] =
          await Promise.all([
            collaborationService.getCommentsByEntity("student", student.id!),
            collaborationService.getRemindersByEntity("student", student.id!),
            collaborationService.getInteractionsByEntity(
              "student",
              student.id!,
            ),
          ]);

        setComments(commentsData);
        setReminders(remindersData);
        setInteractions(interactionsData);
      } catch (error) {
        console.error("Error loading collaboration data:", error);
        toast({
          title: "Error",
          description: "Failed to load collaboration data",
          variant: "destructive",
        });
      }
    };

    loadData();
  }, [student.id, toast]);

  // Comments handlers
  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;

    try {
      const comment = await collaborationService.addComment(
        "student",
        student.id!,
        {
          content: newComment,
          userId: user.id!,
          userName: user.displayName,
        },
      );

      setComments([comment, ...comments]);
      setNewComment("");

      toast({
        title: "Comment Added",
        description: "Your comment has been added successfully",
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  // Reminders handlers
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (!reminderForm.tags.includes(newTag)) {
      setReminderForm({
        ...reminderForm,
        tags: [...reminderForm.tags, newTag],
      });
    }
    setNewTag("");
  };

  const handleRemoveTag = (tag: string) => {
    setReminderForm({
      ...reminderForm,
      tags: reminderForm.tags.filter((t) => t !== tag),
    });
  };

  const handleAddReminder = async () => {
    if (!reminderForm.title.trim() || !user) return;

    try {
      const reminder = await collaborationService.addReminder(
        "student",
        student.id!,
        {
          ...reminderForm,
          completed: false,
          createdBy: user.id!,
          createdByName: user.displayName,
        },
      );

      setReminders([...reminders, reminder]);
      setShowReminderForm(false);
      setReminderForm({
        title: "",
        description: "",
        dueDate: new Date().toISOString().split("T")[0],
        tags: [],
        assignedTo: user.id || "",
      });

      toast({
        title: "Reminder Added",
        description: "Your reminder has been added successfully",
      });
    } catch (error) {
      console.error("Error adding reminder:", error);
      toast({
        title: "Error",
        description: "Failed to add reminder",
        variant: "destructive",
      });
    }
  };

  const handleToggleReminder = async (reminder: Reminder) => {
    try {
      await collaborationService.updateReminder(reminder.id!, {
        completed: !reminder.completed,
      });

      setReminders(
        reminders.map((r) =>
          r.id === reminder.id ? { ...r, completed: !r.completed } : r,
        ),
      );
    } catch (error) {
      console.error("Error updating reminder:", error);
      toast({
        title: "Error",
        description: "Failed to update reminder",
        variant: "destructive",
      });
    }
  };

  // Interactions handlers
  const handleAddInteraction = async () => {
    if (!interactionForm.description.trim() || !user) return;

    try {
      const interaction = await collaborationService.addInteraction(
        "student",
        student.id!,
        {
          ...interactionForm,
          userId: user.id!,
          userName: user.displayName,
        },
      );

      setInteractions([interaction, ...interactions]);
      setShowInteractionForm(false);
      setInteractionForm({
        type: "note",
        description: "",
        outcome: "",
        followUpDate: "",
      });

      toast({
        title: "Interaction Added",
        description: "Your interaction has been recorded successfully",
      });
    } catch (error) {
      console.error("Error adding interaction:", error);
      toast({
        title: "Error",
        description: "Failed to add interaction",
        variant: "destructive",
      });
    }
  };

  const getInteractionIcon = (type: Interaction["type"]) => {
    switch (type) {
      case "call":
        return <Phone className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "meeting":
        return <Video className="h-4 w-4" />;
      case "note":
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <CardTitle>Collaboration</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="reminders">Reminders</TabsTrigger>
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
          </TabsList>

          {/* Comments Tab */}
          <TabsContent value="comments" className="space-y-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddComment}>Post</Button>
            </div>

            <div className="space-y-4 mt-4">
              {comments.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No comments yet
                </div>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="flex gap-3 p-3 border rounded-lg"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userName}`}
                      />
                      <AvatarFallback>
                        {comment.userName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-medium">{comment.userName}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(comment.timestamp.toDate(), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Reminders Tab */}
          <TabsContent value="reminders" className="space-y-4">
            <Button
              onClick={() => setShowReminderForm(!showReminderForm)}
              variant={showReminderForm ? "secondary" : "default"}
            >
              {showReminderForm ? "Cancel" : "Add Reminder"}
            </Button>

            {showReminderForm && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={reminderForm.title}
                    onChange={(e) =>
                      setReminderForm({
                        ...reminderForm,
                        title: e.target.value,
                      })
                    }
                    placeholder="Reminder title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={reminderForm.description}
                    onChange={(e) =>
                      setReminderForm({
                        ...reminderForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Reminder details"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={reminderForm.dueDate}
                    onChange={(e) =>
                      setReminderForm({
                        ...reminderForm,
                        dueDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag"
                      onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                    />
                    <Button
                      type="button"
                      onClick={handleAddTag}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {reminderForm.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button onClick={handleAddReminder} className="w-full">
                  Create Reminder
                </Button>
              </div>
            )}

            <div className="space-y-3 mt-4">
              {reminders.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No reminders yet
                </div>
              ) : (
                reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    <Checkbox
                      checked={reminder.completed}
                      onCheckedChange={() => handleToggleReminder(reminder)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p
                          className={`font-medium ${reminder.completed ? "line-through text-muted-foreground" : ""}`}
                        >
                          {reminder.title}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(reminder.dueDate).toLocaleDateString()}
                        </div>
                      </div>

                      {reminder.description && (
                        <p
                          className={`text-sm mt-1 ${reminder.completed ? "line-through text-muted-foreground" : ""}`}
                        >
                          {reminder.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1 mt-2">
                        {reminder.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                        <span>Created by {reminder.createdByName}</span>
                        <span>
                          {formatDistanceToNow(reminder.timestamp.toDate(), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Interactions Tab */}
          <TabsContent value="interactions" className="space-y-4">
            <Button
              onClick={() => setShowInteractionForm(!showInteractionForm)}
              variant={showInteractionForm ? "secondary" : "default"}
            >
              {showInteractionForm ? "Cancel" : "Record Interaction"}
            </Button>

            {showInteractionForm && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="space-y-2">
                  <Label>Interaction Type</Label>
                  <div className="flex gap-2">
                    {(["call", "email", "meeting", "note"] as const).map(
                      (type) => (
                        <Button
                          key={type}
                          type="button"
                          variant={
                            interactionForm.type === type
                              ? "default"
                              : "outline"
                          }
                          onClick={() =>
                            setInteractionForm({ ...interactionForm, type })
                          }
                          className="flex-1"
                        >
                          {type === "call" && (
                            <Phone className="h-4 w-4 mr-2" />
                          )}
                          {type === "email" && (
                            <Mail className="h-4 w-4 mr-2" />
                          )}
                          {type === "meeting" && (
                            <Video className="h-4 w-4 mr-2" />
                          )}
                          {type === "note" && (
                            <MessageSquare className="h-4 w-4 mr-2" />
                          )}
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Button>
                      ),
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={interactionForm.description}
                    onChange={(e) =>
                      setInteractionForm({
                        ...interactionForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe the interaction"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outcome">Outcome (Optional)</Label>
                  <Input
                    id="outcome"
                    value={interactionForm.outcome}
                    onChange={(e) =>
                      setInteractionForm({
                        ...interactionForm,
                        outcome: e.target.value,
                      })
                    }
                    placeholder="Result of the interaction"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="followUpDate">
                    Follow-up Date (Optional)
                  </Label>
                  <Input
                    id="followUpDate"
                    type="date"
                    value={interactionForm.followUpDate}
                    onChange={(e) =>
                      setInteractionForm({
                        ...interactionForm,
                        followUpDate: e.target.value,
                      })
                    }
                  />
                </div>

                <Button onClick={handleAddInteraction} className="w-full">
                  Save Interaction
                </Button>
              </div>
            )}

            <div className="space-y-4 mt-4">
              {interactions.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No interactions recorded yet
                </div>
              ) : (
                interactions.map((interaction) => (
                  <div key={interaction.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="bg-muted p-2 rounded-full">
                          {getInteractionIcon(interaction.type)}
                        </div>
                        <div>
                          <p className="font-medium capitalize">
                            {interaction.type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            by {interaction.userName} •{" "}
                            {formatDistanceToNow(
                              interaction.timestamp.toDate(),
                              { addSuffix: true },
                            )}
                          </p>
                        </div>
                      </div>

                      {interaction.followUpDate && (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Calendar className="h-3 w-3" />
                          Follow-up:{" "}
                          {new Date(
                            interaction.followUpDate,
                          ).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>

                    <p className="mt-2 text-sm">{interaction.description}</p>

                    {interaction.outcome && (
                      <div className="mt-2 p-2 bg-muted rounded-md text-sm">
                        <span className="font-medium">Outcome:</span>{" "}
                        {interaction.outcome}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StudentCollaboration;
