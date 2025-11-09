import { useState, useEffect } from 'react';
import { useAutosave } from '@/hooks/use-autosave';
import { RestoreProgressDialog } from '@/components/restore-progress-dialog';

interface AutosaveFormWrapperProps {
  flowKey: string;
  flowName: string;
  currentStep: number;
  formData: any;
  onRestoreData?: (data: any) => void;
  enabled?: boolean;
  children: React.ReactNode;
}

/**
 * Wrapper component that adds autosave functionality to any form
 * 
 * Usage Example:
 * ```tsx
 * <AutosaveFormWrapper
 *   flowKey="foia"
 *   flowName="FOIA Request"
 *   currentStep={currentStep}
 *   formData={form.watch()}
 *   onRestoreData={(data) => {
 *     Object.keys(data).forEach(key => {
 *       form.setValue(key, data[key]);
 *     });
 *   }}
 * >
 *   <YourFormContent />
 * </AutosaveFormWrapper>
 * ```
 */
export function AutosaveFormWrapper({
  flowKey,
  flowName,
  currentStep,
  formData,
  onRestoreData,
  enabled = true,
  children,
}: AutosaveFormWrapperProps) {
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [hasCheckedRestore, setHasCheckedRestore] = useState(false);

  const {
    savedProgress,
    isLoadingProgress,
    isSaving,
    clearProgress,
    forceSave,
  } = useAutosave({
    flowKey,
    stepIndex: currentStep,
    formData,
    enabled,
    debounceMs: 2000,
    onRestore: (data) => {
      // This callback is called automatically by the hook
      // We use the dialog instead to give user a choice
    },
  });

  // Check for saved progress on mount
  useEffect(() => {
    if (!hasCheckedRestore && savedProgress && !isLoadingProgress) {
      const hasData = savedProgress.formDataJson && 
        Object.keys(savedProgress.formDataJson).length > 0;
      
      if (hasData) {
        setShowRestoreDialog(true);
      }
      setHasCheckedRestore(true);
    }
  }, [savedProgress, isLoadingProgress, hasCheckedRestore]);

  // Handle restore
  const handleRestore = () => {
    if (savedProgress?.formDataJson && onRestoreData) {
      onRestoreData(savedProgress.formDataJson);
    }
    setShowRestoreDialog(false);
  };

  // Handle start new
  const handleStartNew = () => {
    clearProgress();
    setShowRestoreDialog(false);
  };

  // Force save before unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      forceSave();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [forceSave]);

  return (
    <>
      <RestoreProgressDialog
        open={showRestoreDialog}
        onRestore={handleRestore}
        onStartNew={handleStartNew}
        lastSaved={savedProgress?.updatedAt}
        flowName={flowName}
      />
      
      {/* Optional: Show saving indicator */}
      {isSaving && (
        <div 
          className="fixed top-4 right-4 z-50 bg-card border rounded-lg px-4 py-2 shadow-lg"
          data-testid="status-autosaving"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-sm text-muted-foreground">Saving...</span>
          </div>
        </div>
      )}

      {children}
    </>
  );
}
