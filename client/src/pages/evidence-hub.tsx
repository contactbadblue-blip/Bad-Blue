
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Image as ImageIcon, Video, File, Calendar, MapPin, User, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface PublicEvidence {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  officerName?: string | null;
  department?: string | null;
  location?: string | null;
  incidentDate?: string | null;
  uploadedBy: string | null;
  uploadedAt: string;
  description?: string | null;
}

export default function EvidenceHub() {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<string>("all");

  const { data: evidence, isLoading } = useQuery<PublicEvidence[]>({
    queryKey: ['/api/evidence-hub', filterType],
    queryFn: async () => {
      const response = await fetch(`/api/evidence-hub?type=${filterType}`);
      if (!response.ok) throw new Error('Failed to fetch evidence');
      return response.json();
    }
  });

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <ImageIcon className="w-5 h-5" />;
    if (type.includes('video')) return <Video className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg">BadBlue Evidence Hub</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => window.location.href = "/home"}>
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Public Evidence Hub</h1>
          <p className="text-muted-foreground">
            Community-shared evidence of police misconduct. All evidence is publicly viewable.
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            variant={filterType === "all" ? "default" : "outline"}
            onClick={() => setFilterType("all")}
          >
            All Evidence
          </Button>
          <Button
            variant={filterType === "image" ? "default" : "outline"}
            onClick={() => setFilterType("image")}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Photos
          </Button>
          <Button
            variant={filterType === "video" ? "default" : "outline"}
            onClick={() => setFilterType("video")}
          >
            <Video className="w-4 h-4 mr-2" />
            Videos
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading evidence...</p>
          </div>
        ) : evidence && evidence.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {evidence.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    {getFileIcon(item.fileType)}
                    <CardTitle className="text-lg truncate">{item.fileName}</CardTitle>
                  </div>
                  {item.description && (
                    <CardDescription>{item.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {item.officerName && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{item.officerName}</span>
                      </div>
                    )}
                    {item.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{item.location}</span>
                      </div>
                    )}
                    {item.incidentDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{new Date(item.incidentDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="pt-2">
                      <Badge variant="secondary" className="text-xs">
                        Uploaded {new Date(item.uploadedAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                  <Button className="w-full mt-4" onClick={() => window.open(item.fileUrl, '_blank')}>
                    View Evidence
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Public Evidence Yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to share evidence with the BadBlue community.
              </p>
              <p className="text-sm text-muted-foreground">
                When filing a complaint or lawsuit, check "Share with BadBlue community" to make your evidence publicly available.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
