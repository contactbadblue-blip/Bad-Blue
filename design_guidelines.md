# BadBlue Admin Email Panel - Design Guidelines

## Design Approach: Design System-Based (Utility-Focused Admin Interface)

**Selected System:** Modern Admin Dashboard Pattern
**Justification:** This is a utility-focused admin tool where efficiency, clarity, and reliability are paramount. The interface should feel professional and trustworthy for administrative email operations.

## Core Design Elements

### A. Typography
**Font Family:** 
- Primary: Inter or system fonts (-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto)
- Monospace: For email addresses and technical details

**Hierarchy:**
- Page Title: text-2xl font-semibold
- Section Headers: text-lg font-medium
- Form Labels: text-sm font-medium
- Input Text: text-base
- Helper Text: text-sm text-gray-600
- Error Messages: text-sm font-medium

### B. Layout System
**Spacing Units:** Use Tailwind units of 2, 4, 6, and 8 consistently
- Component padding: p-6 or p-8
- Form field spacing: space-y-6
- Inline spacing: gap-4
- Section margins: mb-8

**Container Structure:**
- Max-width: max-w-2xl (optimal form width, ~672px)
- Page padding: px-4 md:px-6
- Centered layout: mx-auto

### C. Component Library

**Admin Email Panel Layout:**
- Clean card-based container with subtle border
- Header section with panel title "Send Email" and optional description
- Form area with clear visual separation between fields
- Action area with send button and status messages

**Form Components:**

1. **Email Recipient Input**
   - Full-width text input with email validation
   - Label: "To" 
   - Placeholder: "recipient@example.com"
   - Input height: h-11
   - Border radius: rounded-lg
   - Show validation icon on valid email entry

2. **Subject Line Input**
   - Full-width text input
   - Label: "Subject"
   - Placeholder: "Email subject line"
   - Same styling as recipient input

3. **Email Body Editor**
   - Textarea with minimum height of h-48
   - Label: "Message"
   - Placeholder: "Type your message here..."
   - Rounded corners: rounded-lg
   - Resize: resize-y (allow vertical resizing)

4. **From Address Display**
   - Read-only field or small text display
   - Show "From: BadBlue <noreply@bad-blue.com>"
   - Subtle styling: text-sm with muted appearance
   - Position: Above or below the To field

5. **Send Button**
   - Primary button style: px-6 py-3
   - Position: Right-aligned or full-width on mobile
   - Loading state: Disabled appearance with spinner
   - Text: "Send Email" (changes to "Sending..." during operation)

6. **Status Messages**
   - Success: Green-tinted alert box with checkmark icon
   - Error: Red-tinted alert box with error icon
   - Position: Below form or as toast notification
   - Padding: p-4, rounded-lg
   - Include dismiss button

**Visual Enhancements:**
- Form fields have focus states with ring-2 treatment
- Inputs have subtle background differentiation from page
- Validation states: red border for errors, green accent for success
- Disabled states clearly communicated with opacity and cursor changes

### D. Page Structure

**Single-Column Form Layout:**
```
[Page Container - max-w-2xl, centered]
  [Header Section - mb-8]
    - Panel Title
    - Brief description or instruction text
  
  [Email Form Card - p-6 or p-8]
    [Form Fields - space-y-6]
      - From Address (read-only display)
      - To Email Input
      - Subject Input
      - Message Textarea
    
    [Action Section - mt-8, flex justify-end]
      - Send Button
  
  [Status Messages Area]
    - Success/Error notifications
```

**Responsive Behavior:**
- Mobile (base): Single column, full-width inputs, stacked buttons
- Desktop (md+): Maintain max-width constraint, comfortable spacing

### E. Interaction States

**Form Validation:**
- Real-time email format validation for "To" field
- Required field indicators
- Clear error messages below invalid fields
- Prevent submission until all required fields valid

**Button States:**
- Default: Solid primary appearance
- Hover: Slight darkening
- Active: Deeper press effect
- Loading: Disabled with spinner icon
- Disabled: Reduced opacity, no pointer cursor

**Success Flow:**
- Form submission → Loading state → Success message → Form reset or remain filled

**Error Handling:**
- Network errors, validation errors clearly displayed
- Error messages with actionable guidance
- Allow retry without losing form data

### F. Professional Polish

- Consistent border radius across all components
- Subtle shadows on the main form card for depth
- Adequate whitespace prevents cramped appearance
- Clear visual hierarchy guides user through form flow
- Accessibility: Proper labels, ARIA attributes, keyboard navigation
- Focus management: Logical tab order through form fields

**No Animations Required** - This is a utility interface where instant feedback and clarity matter more than motion design.