import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useUploadSlots } from "@/hooks/useUploadSlots";
import { Loader2, Upload, Crown, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

export const UploadSlotsCard = () => {
  const { 
    slotsRemaining, 
    songsUploaded, 
    totalSlots, 
    isPremium, 
    xrgeBalance, 
    xrgeRequired, 
    xrgeNeeded,
    isLoading 
  } = useUploadSlots();
  
  const navigate = useNavigate();

  const percentageUsed = totalSlots > 0 ? (songsUploaded / totalSlots) * 100 : 0;
  const isLowOnSlots = slotsRemaining <= 5 && slotsRemaining > 0 && !isPremium;
  const isOutOfSlots = slotsRemaining === 0;

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${isPremium ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-primary/20'}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold font-mono">Upload Slots</h3>
              {isPremium && <Crown className="h-5 w-5 text-yellow-500" />}
            </div>
            <p className="text-sm text-muted-foreground">
              {isPremium ? 'Premium Tier - Hold 1M+ XRGE' : 'Free Tier - 20 slots'}
            </p>
          </div>
          <Upload className="h-8 w-8 text-primary" />
        </div>

        {/* XRGE Balance Display */}
        <div className="bg-card/50 rounded-lg p-3 border border-border">
          <div className="flex justify-between items-center text-sm font-mono">
            <span className="text-muted-foreground">Your XRGE Balance:</span>
            <span className={isPremium ? "text-yellow-500 font-bold" : "text-foreground"}>
              {xrgeBalance.toLocaleString()} XRGE
            </span>
          </div>
          {!isPremium && (
            <div className="text-xs text-muted-foreground mt-1">
              Need {xrgeNeeded.toLocaleString()} more XRGE for unlimited uploads
            </div>
          )}
        </div>

        {/* Slots Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-mono">
            <span>Used: {songsUploaded} / {totalSlots}</span>
            <span className={
              isOutOfSlots ? "text-destructive font-bold" :
              isLowOnSlots ? "text-yellow-500 font-bold" :
              isPremium ? "text-yellow-500" :
              "text-primary"
            }>
              {slotsRemaining} remaining
            </span>
          </div>
          <Progress 
            value={percentageUsed} 
            className="h-2"
            indicatorClassName={
              isOutOfSlots ? "bg-destructive" :
              isLowOnSlots ? "bg-yellow-500" :
              isPremium ? "bg-yellow-500" :
              "bg-primary"
            }
          />
        </div>

        {/* Alerts */}
        {isOutOfSlots && !isPremium && (
          <Alert variant="destructive">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              You've used all {totalSlots} free upload slots! Hold 1M+ XRGE to unlock unlimited uploads.
            </AlertDescription>
          </Alert>
        )}

        {isLowOnSlots && (
          <Alert>
            <AlertDescription>
              Running low on free slots. Hold 1M+ XRGE for unlimited uploads.
            </AlertDescription>
          </Alert>
        )}

        {isPremium && (
          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <Crown className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-500">
              Premium Active! You have {slotsRemaining} uploads available.
            </AlertDescription>
          </Alert>
        )}

        {/* Upgrade Section */}
        {!isPremium && (
          <div className="pt-4 border-t border-primary/10">
            <div className="space-y-3">
              <div className="text-sm font-mono bg-card/50 p-3 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <span className="font-bold">Unlock Unlimited Uploads</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Hold 1,000,000 XRGE tokens in your wallet to get {totalSlots === 20 ? '980' : '1000'} upload slots (effectively unlimited)
                </p>
              </div>

              <Button
                onClick={() => navigate('/swap')}
                className="w-full font-mono bg-yellow-500 hover:bg-yellow-600 text-black"
                variant="default"
              >
                <Crown className="mr-2 h-4 w-4" />
                Buy XRGE to Upgrade
              </Button>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground font-mono space-y-1 pt-2 border-t border-primary/10">
          {isPremium ? (
            <>
              <p>✓ Premium tier active</p>
              <p>✓ Updates automatically when XRGE balance changes</p>
              <p>✓ No expiration - hold XRGE to maintain access</p>
            </>
          ) : (
            <>
              <p>✓ Free tier: {totalSlots} uploads</p>
              <p>✓ Premium tier: Hold 1M+ XRGE for unlimited</p>
              <p>✓ Balance checked on-chain in real-time</p>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
