import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2 } from "lucide-react";

interface OfficerSearchProgressProps {
  stage: number;
  totalStages: number;
  stageName: string;
  message: string;
  percentage: number;
}

export default function OfficerSearchProgress({
  stage,
  totalStages,
  stageName,
  message,
  percentage,
}: OfficerSearchProgressProps) {
  const isComplete = stage === totalStages;

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-3">
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" data-testid="icon-complete" />
          ) : (
            <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0" data-testid="icon-loading" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-semibold text-sm" data-testid="text-stage-name">
                {stageName}
              </h3>
              <span className="text-xs text-muted-foreground font-medium" data-testid="text-percentage">
                {percentage}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground" data-testid="text-message">
              {message}
            </p>
          </div>
        </div>
        <Progress value={percentage} className="h-2" data-testid="progress-bar" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span data-testid="text-stage-count">
            Stage {stage} of {totalStages}
          </span>
          <span data-testid="text-status">
            {isComplete ? "Complete" : "Searching..."}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
