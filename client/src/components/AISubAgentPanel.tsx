import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Brain, CheckCircle, XCircle, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CommandLog {
  id: string;
  command: string;
  category: string | null;
  status: string;
  response: string | null;
  executionTimeMs: number | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export function AISubAgentPanel() {
  const [command, setCommand] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch command history
  const { data: history, isLoading: historyLoading } = useQuery<CommandLog[]>({
    queryKey: ["/api/admin/subagent/history"],
  });

  // Poll for active command status
  const { data: statusData } = useQuery<{ log: CommandLog }>({
    queryKey: ["/api/admin/subagent/status", activeLogId],
    enabled: !!activeLogId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.log?.status === "processing") {
        return 1000; // Poll every second while processing
      }
      return false; // Stop polling when complete
    },
  });

  const activeLog = statusData?.log;

  // Submit command mutation
  const submitCommand = useMutation({
    mutationFn: async (payload: { command: string; category: string | null }) => {
      const res = await apiRequest("/api/admin/subagent/command", "POST", payload);
      return await res.json();
    },
    onSuccess: (data: any) => {
      setActiveLogId(data.logId);
      setCommand("");
      toast({
        title: "Command Submitted",
        description: "AI Sub-Agent is processing your command...",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subagent/history"] });
    },
    onError: (error: any) => {
      toast({
        title: "Command Failed",
        description: error.message || "Failed to submit command",
        variant: "destructive",
      });
    },
  });

  // Watch for completion of active command
  useEffect(() => {
    if (activeLog && activeLog.status !== "processing") {
      if (activeLog.status === "completed") {
        toast({
          title: "Command Completed",
          description: `Executed in ${activeLog.executionTimeMs}ms`,
        });
      } else if (activeLog.status === "failed") {
        toast({
          title: "Command Failed",
          description: activeLog.errorMessage || "Unknown error",
          variant: "destructive",
        });
      }
      setActiveLogId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subagent/history"] });
    }
  }, [activeLog, toast]);

  const handleSubmit = () => {
    if (!command.trim()) {
      toast({
        title: "Command Required",
        description: "Please enter a command",
        variant: "destructive",
      });
      return;
    }

    submitCommand.mutate({
      command: command.trim(),
      category: selectedCategory,
    });
  };

  const categories = [
    { value: "code_analysis", label: "Code Analysis", icon: "🔍" },
    { value: "debugging", label: "Debugging", icon: "🐛" },
    { value: "system_info", label: "System Info", icon: "ℹ️" },
    { value: "data_operations", label: "Data Operations", icon: "💾" },
    { value: "api_integration", label: "API Integration", icon: "🔌" },
    { value: "generate_report", label: "Generate Report", icon: "📊" },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>AI Sub-Agent Control Panel</CardTitle>
              <CardDescription>
                Issue commands to the AI Sub-Agent for code analysis, debugging, system operations, and more
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Command Input */}
      <Card>
        <CardHeader>
          <CardTitle>Issue Command</CardTitle>
          <CardDescription>
            Enter natural language commands for the AI to execute
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Category (Optional)</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Badge
                  key={cat.value}
                  variant={selectedCategory === cat.value ? "default" : "outline"}
                  className="cursor-pointer hover-elevate active-elevate-2"
                  onClick={() =>
                    setSelectedCategory(selectedCategory === cat.value ? null : cat.value)
                  }
                  data-testid={`badge-category-${cat.value}`}
                >
                  {cat.icon} {cat.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Command Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="command-input">
              Command
            </label>
            <Textarea
              id="command-input"
              placeholder="Example: Analyze the payment processing code for potential bugs"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              rows={4}
              data-testid="textarea-command"
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={submitCommand.isPending || !!activeLogId}
            className="w-full"
            data-testid="button-submit-command"
          >
            {submitCommand.isPending || activeLogId ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Command
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Latest Command Result - SCROLLABLE */}
      {history && history.length > 0 && history[0].status === "completed" && history[0].response && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Latest Result
                </CardTitle>
                <CardDescription className="mt-1">
                  {history[0].command}
                </CardDescription>
              </div>
              <div className="text-xs text-muted-foreground">
                {history[0].executionTimeMs}ms
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] w-full border rounded-md">
              <div className="text-sm whitespace-pre-wrap p-4">
                {history[0].response}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Active Command Display */}
      {activeLog && activeLog.status === "processing" && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing Command
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Command:</div>
              <div className="text-sm font-medium">{activeLog.command}</div>
              {activeLog.category && (
                <Badge variant="outline">{activeLog.category}</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
