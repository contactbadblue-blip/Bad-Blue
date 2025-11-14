```typescript
// Email Service configuration file
export const emailConfig = {
  // Email service provider
  provider: 'smtp',
  // Email service host
  host: 'smtp.example.com',
  // Email service port
  port: 587,
  // Email service secure connection
  secure: false,
  // Email service username
  username: 'your-email@example.com',
  // Email service password (UPDATE THIS VALUE WITH THE NEWLY GENERATED APPLICATION-SPECIFIC PASSWORD)
  password: 'newly-generated-application-specific-password',
  // Email service sender name
  senderName: 'Your Name',
  // Email service sender email
  senderEmail: 'your-email@example.com',
};

// Example usage:
// import { emailConfig } from './emailConfig';
// console.log(emailConfig);
```

**Important:** Replace `'newly-generated-application-specific-password'` with the actual newly generated application-specific password. Also, make sure to update the other configuration values (e.g., `host`, `username`, `senderName`, `senderEmail`) according to your email service provider's settings.