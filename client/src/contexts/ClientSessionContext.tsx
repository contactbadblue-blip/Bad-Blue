import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Define the structure for officer/case data that flows between pages
export interface ClientSessionData {
  // Officer Information (from badge analysis or manual entry)
  officerName?: string;
  badgeNumber?: string;
  department?: string;
  state?: string;
  city?: string;
  county?: string;
  
  // Case Information (from LegalAI Consultation or manual entry)
  incidentDate?: string;
  incidentDescription?: string;
  violationType?: string;
  damagesAmount?: string;
  
  // Badge Analysis Results
  badgeAnalysisData?: any;
  
  // LegalAI Consultation Results
  legalConsultationData?: any;
  
  // Timestamp for data freshness
  lastUpdated?: number;
}

interface ClientSessionContextType {
  sessionData: ClientSessionData;
  updateSessionData: (data: Partial<ClientSessionData>) => void;
  clearSessionData: () => void;
  hydrateFromUrl: (params: URLSearchParams) => void;
}

const ClientSessionContext = createContext<ClientSessionContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = "badgecheck_session_data";
const SESSION_TTL = 1000 * 60 * 60 * 24; // 24 hours

export function ClientSessionProvider({ children }: { children: ReactNode }) {
  const [sessionData, setSessionData] = useState<ClientSessionData>({});

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ClientSessionData;
        // Check if data is still fresh (within TTL)
        if (parsed.lastUpdated && Date.now() - parsed.lastUpdated < SESSION_TTL) {
          setSessionData(parsed);
        } else {
          // Data expired, clear it
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      } catch (error) {
        console.error("Error parsing session data from localStorage:", error);
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  }, []);

  // Persist to localStorage whenever data changes
  useEffect(() => {
    if (Object.keys(sessionData).length > 0) {
      const dataWithTimestamp = {
        ...sessionData,
        lastUpdated: Date.now(),
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(dataWithTimestamp));
    }
  }, [sessionData]);

  const updateSessionData = (data: Partial<ClientSessionData>) => {
    setSessionData((prev) => ({
      ...prev,
      ...data,
    }));
  };

  const clearSessionData = () => {
    setSessionData({});
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  // Hydrate from URL params (for shareable deep links)
  const hydrateFromUrl = (params: URLSearchParams) => {
    const urlData: Partial<ClientSessionData> = {};
    
    if (params.has("officerName")) urlData.officerName = params.get("officerName") || undefined;
    if (params.has("badgeNumber")) urlData.badgeNumber = params.get("badgeNumber") || undefined;
    if (params.has("department")) urlData.department = params.get("department") || undefined;
    if (params.has("state")) urlData.state = params.get("state") || undefined;
    if (params.has("city")) urlData.city = params.get("city") || undefined;
    if (params.has("county")) urlData.county = params.get("county") || undefined;
    if (params.has("incidentDate")) urlData.incidentDate = params.get("incidentDate") || undefined;
    if (params.has("incidentDescription")) urlData.incidentDescription = params.get("incidentDescription") || undefined;
    if (params.has("violationType")) urlData.violationType = params.get("violationType") || undefined;
    if (params.has("damagesAmount")) urlData.damagesAmount = params.get("damagesAmount") || undefined;

    // URL params override localStorage data
    if (Object.keys(urlData).length > 0) {
      updateSessionData(urlData);
    }
  };

  return (
    <ClientSessionContext.Provider
      value={{
        sessionData,
        updateSessionData,
        clearSessionData,
        hydrateFromUrl,
      }}
    >
      {children}
    </ClientSessionContext.Provider>
  );
}

// Custom hook to use the session context
export function useClientSession() {
  const context = useContext(ClientSessionContext);
  if (!context) {
    throw new Error("useClientSession must be used within a ClientSessionProvider");
  }
  return context;
}
