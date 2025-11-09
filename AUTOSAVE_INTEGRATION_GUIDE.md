# Autosave System Integration Guide

## Overview

The BadBlue autosave system automatically saves user progress in the background and restores it when they return. This system works across all forms in the application and requires no manual user interaction.

## Features

- **Automatic Background Saving**: Saves progress every 2 seconds after the last change
- **Persistent Storage**: Progress is stored in PostgreSQL database
- **Cross-Device Support**: Progress syncs across devices when user signs in
- **Restore Dialog**: Offers users the choice to continue or start fresh
- **Zero Manual Interaction**: Completely automatic - no save buttons needed
- **Secure**: Only authenticated users can access their own saved progress

## Database Schema

The `saved_progress` table stores:
- `userId`: The authenticated user ID
- `flowKey`: Identifier for the module/form (e.g., 'foia', 'complaint', 'petition')
- `stepIndex`: The current step/page the user is on
- `formDataJson`: All form field data as JSON
- `updatedAt`: Last save timestamp

## Backend API Endpoints

### Save Progress
```
POST /api/autosave
Body: { flowKey, stepIndex, formDataJson }
```

### Get Saved Progress
```
GET /api/autosave/:flowKey
Returns: { progress: SavedProgress | null }
```

### Delete Saved Progress
```
DELETE /api/autosave/:flowKey
```

## Frontend Integration

### Method 1: Using AutosaveFormWrapper (Recommended)

The easiest way to add autosave to any form:

```tsx
import { AutosaveFormWrapper } from '@/components/autosave-form-wrapper';
import { useForm } from 'react-hook-form';

function MyForm() {
  const form = useForm({
    defaultValues: {
      field1: '',
      field2: '',
    }
  });

  return (
    <AutosaveFormWrapper
      flowKey="my_feature"  // Unique identifier for this form
      flowName="My Feature Form"  // Display name
      currentStep={0}  // Current step index
      formData={form.watch()}  // All form data
      onRestoreData={(data) => {
        // Restore data to form
        Object.keys(data).forEach(key => {
          form.setValue(key, data[key]);
        });
      }}
    >
      {/* Your form content here */}
      <Form {...form}>
        {/* Form fields */}
      </Form>
    </AutosaveFormWrapper>
  );
}
```

### Method 2: Using the Hook Directly

For more control, use the `useAutosave` hook directly:

```tsx
import { useAutosave } from '@/hooks/use-autosave';
import { RestoreProgressDialog } from '@/components/restore-progress-dialog';
import { useState, useEffect } from 'react';

function MyAdvancedForm() {
  const form = useForm();
  const [showRestore, setShowRestore] = useState(false);

  const {
    savedProgress,
    isLoadingProgress,
    isSaving,
    clearProgress,
    forceSave,
  } = useAutosave({
    flowKey: 'my_feature',
    stepIndex: 0,
    formData: form.watch(),
    enabled: true,
    debounceMs: 2000,
  });

  // Check for saved progress on mount
  useEffect(() => {
    if (savedProgress?.formDataJson) {
      setShowRestore(true);
    }
  }, [savedProgress]);

  const handleRestore = () => {
    Object.keys(savedProgress.formDataJson).forEach(key => {
      form.setValue(key, savedProgress.formDataJson[key]);
    });
    setShowRestore(false);
  };

  return (
    <>
      <RestoreProgressDialog
        open={showRestore}
        onRestore={handleRestore}
        onStartNew={() => {
          clearProgress();
          setShowRestore(false);
        }}
        lastSaved={savedProgress?.updatedAt}
        flowName="My Feature"
      />
      
      <Form {...form}>
        {/* Your form */}
      </Form>

      {isSaving && <div>Saving...</div>}
    </>
  );
}
```

## Flow Keys

Use these standardized flow keys for consistency:

- `foia` - FOIA Request forms
- `complaint` - Police complaint forms
- `petition` - Petition forms
- `lawsuit_diy` - DIY lawsuit forms
- `lawsuit_full` - Full-service lawsuit forms
- `officer_search` - Officer search tool
- `legal_ai` - LegalAI consultation

## Multi-Step Forms

For multi-step forms, update the `stepIndex` parameter:

```tsx
function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const form = useForm();

  return (
    <AutosaveFormWrapper
      flowKey="my_multistep_form"
      flowName="My Multi-Step Form"
      currentStep={currentStep}  // ← Updates as user progresses
      formData={form.watch()}
      onRestoreData={(data) => {
        // Restore all data
        Object.keys(data).forEach(key => {
          form.setValue(key, data[key]);
        });
      }}
    >
      {currentStep === 0 && <Step1 />}
      {currentStep === 1 && <Step2 />}
      {currentStep === 2 && <Step3 />}
    </AutosaveFormWrapper>
  );
}
```

## Best Practices

1. **Unique Flow Keys**: Use descriptive, unique flow keys for each distinct form
2. **Watch All Fields**: Use `form.watch()` to capture all form data automatically
3. **Handle Restore**: Provide an `onRestoreData` callback to properly restore form state
4. **Clear on Submit**: Clear progress after successful form submission:
   ```tsx
   const { clearProgress } = useAutosave({...});
   
   const onSubmit = async (data) => {
     await submitForm(data);
     clearProgress();  // Clear saved progress after successful submit
   };
   ```

5. **Force Save Before Navigation**: The wrapper automatically saves before page unload, but you can force save manually:
   ```tsx
   const { forceSave } = useAutosave({...});
   
   const handleNavigation = () => {
     forceSave();
     navigate('/other-page');
   };
   ```

## Security

- All autosave endpoints require authentication (`isAuthenticated` middleware)
- Users can only access their own saved progress
- Progress is automatically deleted on user account deletion (CASCADE)

## Testing

Test IDs for automated testing:

- `dialog-restore-progress` - Restore progress dialog
- `text-restore-title` - Dialog title
- `text-restore-description` - Dialog description
- `button-restore-progress` - Continue previous session button
- `button-start-new` - Start fresh button
- `status-autosaving` - Saving indicator

## Troubleshooting

### Progress Not Saving
- Check user is authenticated
- Verify `flowKey` is provided
- Check browser console for API errors
- Ensure `formData` contains actual data (not empty object)

### Progress Not Restoring
- Check `onRestoreData` callback is provided
- Verify callback properly sets form values
- Check for errors in browser console

### Saving Too Frequently
- Increase `debounceMs` (default 2000ms)
- Consider what data triggers re-renders

## Example: Complete FOIA Form Integration

See `client/src/pages/foia-request-form.tsx` for a complete example of autosave integration in a real form.
