import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sendAdminEmail } from "./emailService";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin: Send custom email to any address
  app.post('/api/admin/send-custom-email', async (req, res) => {
    try {
      // Validate request body
      const schema = z.object({
        to: z.string().email(),
        subject: z.string().min(1),
        message: z.string().min(1),
      });

      const data = schema.parse(req.body);

      // Send email using existing Resend integration
      const success = await sendAdminEmail({
        to: data.to,
        subject: data.subject,
        message: data.message,
      });

      if (success) {
        res.json({ 
          success: true, 
          message: `Email sent successfully to ${data.to}` 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Failed to send email. Please check Resend configuration.' 
        });
      }
    } catch (error: any) {
      console.error('[API] Error sending custom email:', error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid request data. Please check all fields.' 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: error.message || 'Failed to send email' 
        });
      }
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
