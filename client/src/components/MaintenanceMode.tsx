import { Card } from "@/components/ui/card";
import maintenanceImage from "@assets/stock_images/cartoon_mechanic_wor_678db703.jpg";

export function MaintenanceMode() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-2xl w-full p-8 text-center space-y-6">
        <div className="flex justify-center mb-4">
          <div className="relative w-64 h-64 overflow-hidden rounded-lg">
            <img 
              src={maintenanceImage} 
              alt="Bad Blue Maintenance Worker" 
              className="w-full h-full object-cover"
              data-testid="img-maintenance-worker"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground py-2 font-bold text-lg">
              Bad Blue
            </div>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold" data-testid="text-maintenance-title">
          We are currently under maintenance
        </h1>
        
        <p className="text-lg text-muted-foreground" data-testid="text-maintenance-message">
          Check back in a couple hours
        </p>
        
        <div className="pt-4 text-sm text-muted-foreground">
          <p>Our system is being optimized to better serve you.</p>
          <p className="mt-2">We appreciate your patience!</p>
        </div>
      </Card>
    </div>
  );
}
