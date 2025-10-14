import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/hooks/useWallet";
import { usePrivy } from '@privy-io/react-auth';

interface ReportButtonProps {
  songId: string;
}

export const ReportButton = ({ songId }: ReportButtonProps) => {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<"copyright" | "hate_speech" | "other">("copyright");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { fullAddress: address } = useWallet();
  const { getAccessToken } = usePrivy();

  const handleSubmit = async () => {
    if (!address) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to report content",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getAccessToken();
      const { error } = await supabase.functions.invoke('report-song', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          songId,
          reportType,
          description: description.trim() || undefined,
        },
      });

      if (error) throw error;

      toast({
        title: "Report Submitted",
        description: "Thank you for helping keep our platform safe.",
      });

      setOpen(false);
      setDescription("");
      setReportType("copyright");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Flag className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Content</DialogTitle>
          <DialogDescription>
            Help us maintain a safe platform by reporting inappropriate or copyrighted content.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Report Type</Label>
            <RadioGroup value={reportType} onValueChange={(value: any) => setReportType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="copyright" id="copyright" />
                <Label htmlFor="copyright" className="font-normal cursor-pointer">
                  Copyright Violation
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hate_speech" id="hate_speech" />
                <Label htmlFor="hate_speech" className="font-normal cursor-pointer">
                  Hate Speech or Harmful Content
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other" className="font-normal cursor-pointer">
                  Other Violation
                </Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Additional Details (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide any additional information about this report..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
