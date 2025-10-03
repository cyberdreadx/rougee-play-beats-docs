import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import NetworkInfo from "@/components/NetworkInfo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/hooks/useWallet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, Music, Trash2, ExternalLink } from "lucide-react";
import { getIPFSGatewayUrl } from "@/lib/ipfs";

interface SongReport {
  id: string;
  song_id: string;
  wallet_address: string;
  report_type: "copyright" | "hate_speech" | "other";
  description: string | null;
  created_at: string;
  songs: {
    title: string;
    artist: string | null;
    cover_cid: string | null;
  };
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fullAddress, isConnected } = useWallet();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reports, setReports] = useState<SongReport[]>([]);
  const [deletingReports, setDeletingReports] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      if (!isConnected || !fullAddress) {
        toast({
          title: "Access Denied",
          description: "Please connect your wallet",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("wallet_address", fullAddress)
        .eq("role", "admin")
        .maybeSingle();

      if (!data) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      fetchReports();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("song_reports")
        .select(`
          *,
          songs (
            title,
            artist,
            cover_cid
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSong = async (songId: string, reportId: string) => {
    if (!confirm("Are you sure you want to delete this song? This action cannot be undone.")) {
      return;
    }

    setDeletingReports(new Set(deletingReports).add(reportId));

    try {
      const { error } = await supabase
        .from("songs")
        .delete()
        .eq("id", songId);

      if (error) throw error;

      toast({
        title: "Song Deleted",
        description: "The reported song has been removed",
      });

      // Refresh reports
      fetchReports();
    } catch (error) {
      console.error("Error deleting song:", error);
      toast({
        title: "Error",
        description: "Failed to delete song",
        variant: "destructive",
      });
    } finally {
      const newSet = new Set(deletingReports);
      newSet.delete(reportId);
      setDeletingReports(newSet);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from("song_reports")
        .delete()
        .eq("id", reportId);

      if (error) throw error;

      toast({
        title: "Report Dismissed",
        description: "The report has been removed",
      });

      setReports(reports.filter(r => r.id !== reportId));
    } catch (error) {
      console.error("Error dismissing report:", error);
      toast({
        title: "Error",
        description: "Failed to dismiss report",
        variant: "destructive",
      });
    }
  };

  const getReportTypeBadge = (type: string) => {
    const variants = {
      copyright: "destructive",
      hate_speech: "destructive",
      other: "secondary",
    } as const;

    return (
      <Badge variant={variants[type as keyof typeof variants] || "secondary"}>
        {type.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const groupedReports = {
    copyright: reports.filter(r => r.report_type === "copyright"),
    hate_speech: reports.filter(r => r.report_type === "hate_speech"),
    other: reports.filter(r => r.report_type === "other"),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neon-green" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <Navigation />
      <NetworkInfo />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <AlertTriangle className="h-8 w-8 text-neon-green" />
          <h1 className="text-3xl font-mono font-bold neon-text">ADMIN PANEL</h1>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all">
              ALL ({reports.length})
            </TabsTrigger>
            <TabsTrigger value="copyright">
              COPYRIGHT ({groupedReports.copyright.length})
            </TabsTrigger>
            <TabsTrigger value="hate_speech">
              HATE SPEECH ({groupedReports.hate_speech.length})
            </TabsTrigger>
            <TabsTrigger value="other">
              OTHER ({groupedReports.other.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <ReportsList 
              reports={reports}
              onDeleteSong={handleDeleteSong}
              onDismissReport={handleDismissReport}
              deletingReports={deletingReports}
              getReportTypeBadge={getReportTypeBadge}
            />
          </TabsContent>

          <TabsContent value="copyright">
            <ReportsList 
              reports={groupedReports.copyright}
              onDeleteSong={handleDeleteSong}
              onDismissReport={handleDismissReport}
              deletingReports={deletingReports}
              getReportTypeBadge={getReportTypeBadge}
            />
          </TabsContent>

          <TabsContent value="hate_speech">
            <ReportsList 
              reports={groupedReports.hate_speech}
              onDeleteSong={handleDeleteSong}
              onDismissReport={handleDismissReport}
              deletingReports={deletingReports}
              getReportTypeBadge={getReportTypeBadge}
            />
          </TabsContent>

          <TabsContent value="other">
            <ReportsList 
              reports={groupedReports.other}
              onDeleteSong={handleDeleteSong}
              onDismissReport={handleDismissReport}
              deletingReports={deletingReports}
              getReportTypeBadge={getReportTypeBadge}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

interface ReportsListProps {
  reports: SongReport[];
  onDeleteSong: (songId: string, reportId: string) => void;
  onDismissReport: (reportId: string) => void;
  deletingReports: Set<string>;
  getReportTypeBadge: (type: string) => JSX.Element;
}

const ReportsList = ({ 
  reports, 
  onDeleteSong, 
  onDismissReport, 
  deletingReports,
  getReportTypeBadge 
}: ReportsListProps) => {
  const navigate = useNavigate();

  if (reports.length === 0) {
    return (
      <Card className="console-bg tech-border p-8 text-center">
        <p className="font-mono text-muted-foreground">No reports in this category</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => {
        const coverUrl = report.songs.cover_cid 
          ? getIPFSGatewayUrl(report.songs.cover_cid) 
          : null;

        return (
          <Card key={report.id} className="console-bg tech-border p-6">
            <div className="flex items-start gap-4">
              {/* Song Cover */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded tech-border overflow-hidden bg-primary/20">
                  {coverUrl ? (
                    <img 
                      src={coverUrl} 
                      alt={report.songs.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="h-8 w-8 text-neon-green" />
                    </div>
                  )}
                </div>
              </div>

              {/* Report Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h3 className="font-mono font-bold text-lg mb-1">
                      {report.songs.title}
                    </h3>
                    <p className="text-sm font-mono text-muted-foreground mb-2">
                      by {report.songs.artist || "Unknown Artist"}
                    </p>
                  </div>
                  {getReportTypeBadge(report.report_type)}
                </div>

                <div className="space-y-2 text-sm font-mono">
                  <p className="text-muted-foreground">
                    Reported by: <span className="text-foreground">{report.wallet_address.slice(0, 8)}...</span>
                  </p>
                  <p className="text-muted-foreground">
                    Date: <span className="text-foreground">{new Date(report.created_at).toLocaleString()}</span>
                  </p>
                  {report.description && (
                    <div className="mt-3 p-3 bg-background/50 rounded border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Description:</p>
                      <p className="text-sm">{report.description}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/song/${report.song_id}`)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    VIEW SONG
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDeleteSong(report.song_id, report.id)}
                    disabled={deletingReports.has(report.id)}
                  >
                    {deletingReports.has(report.id) ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    DELETE SONG
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDismissReport(report.id)}
                  >
                    DISMISS REPORT
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default Admin;
