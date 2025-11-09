import { useEffect, useRef, useCallback, useState } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface AutosaveOptions {
  flowKey: string;
  stepIndex: number;
  formData: any;
  enabled?: boolean;
  debounceMs?: number;
  onRestore?: (data: any) => void;
}

interface SavedProgress {
  id: string;
  userId: string;
  flowKey: string;
  stepIndex: number;
  formDataJson: any;
  updatedAt: string;
  createdAt: string;
}

/**
 * Automatic save progress hook with debouncing
 * Saves user progress automatically to the backend
 */
export function useAutosave({
  flowKey,
  stepIndex,
  formData,
  enabled = true,
  debounceMs = 2000, // Save 2 seconds after last change
  onRestore,
}: AutosaveOptions) {
  const { toast } = useToast();
  const [isRestored, setIsRestored] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');

  // Fetch saved progress on mount
  const { data: savedProgressData, isLoading: isLoadingProgress } = useQuery<{ progress: SavedProgress | null }>({
    queryKey: ['/api/autosave', flowKey],
    enabled: enabled && !isRestored,
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { flowKey: string; stepIndex: number; formDataJson: any }) => {
      const res = await apiRequest('/api/autosave', 'POST', data);
      return await res.json();
    },
    onSuccess: () => {
      // Silently save - no toast notification to avoid annoying user
      queryClient.invalidateQueries({ queryKey: ['/api/autosave', flowKey] });
    },
    onError: (error: any) => {
      console.error('Autosave failed:', error);
      // Only show error if it's critical
      if (error?.message && !error.message.includes('401')) {
        toast({
          title: 'Save Failed',
          description: 'Your progress could not be saved. Please check your connection.',
          variant: 'destructive',
        });
      }
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (flowKey: string) => {
      const res = await apiRequest(`/api/autosave/${flowKey}`, 'DELETE');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/autosave', flowKey] });
    },
  });

  // Auto-restore saved progress on mount
  useEffect(() => {
    if (savedProgressData?.progress && !isRestored && onRestore) {
      const savedData = savedProgressData.progress.formDataJson;
      const hasData = savedData && Object.keys(savedData).length > 0;
      
      if (hasData) {
        onRestore(savedData);
        setIsRestored(true);
      }
    }
  }, [savedProgressData, isRestored, onRestore]);

  // Debounced save
  useEffect(() => {
    if (!enabled || !formData) return;

    const currentDataStr = JSON.stringify(formData);
    
    // Don't save if data hasn't changed
    if (currentDataStr === lastSavedDataRef.current) {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout to save
    saveTimeoutRef.current = setTimeout(() => {
      const hasData = formData && Object.keys(formData).length > 0;
      
      if (hasData) {
        saveMutation.mutate({
          flowKey,
          stepIndex,
          formDataJson: formData,
        });
        lastSavedDataRef.current = currentDataStr;
      }
    }, debounceMs);

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [flowKey, stepIndex, formData, enabled, debounceMs]);

  // Clear saved progress
  const clearProgress = useCallback(() => {
    deleteMutation.mutate(flowKey);
    setIsRestored(false);
    lastSavedDataRef.current = '';
  }, [flowKey]);

  // Force save immediately (useful before navigation)
  const forceSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    const hasData = formData && Object.keys(formData).length > 0;
    if (hasData) {
      saveMutation.mutate({
        flowKey,
        stepIndex,
        formDataJson: formData,
      });
    }
  }, [flowKey, stepIndex, formData]);

  return {
    savedProgress: savedProgressData?.progress || null,
    isLoadingProgress,
    isSaving: saveMutation.isPending,
    clearProgress,
    forceSave,
    isRestored,
  };
}
