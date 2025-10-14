import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, CheckCircle2, FileText } from "lucide-react";

const TermsOfService = () => {
  const lastUpdated = "January 14, 2025";

  return (
    <>
      <Helmet>
        <title>Terms of Service - ROUGEE.PLAY</title>
        <meta name="description" content="Terms of Service for ROUGEE.PLAY - Decentralized music platform" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        <Navigation />
        
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 mb-24 md:mb-8 max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                Terms of Service
              </h1>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Last Updated: {lastUpdated}
            </p>
          </div>

          <Alert className="mb-6 sm:mb-8 border-primary/50 bg-primary/5">
            <AlertTriangle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm sm:text-base">
              <strong>Important:</strong> Please read these terms carefully before using ROUGEE.PLAY. 
              By accessing or using our platform, you agree to be bound by these terms.
            </AlertDescription>
          </Alert>

          {/* 1. Acceptance of Terms */}
          <Card className="mb-6 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                1. Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm sm:text-base leading-relaxed">
              <p>
                Welcome to ROUGEE.PLAY ("Platform", "Service", "we", "us", or "our"). These Terms of Service 
                ("Terms") govern your access to and use of the ROUGEE.PLAY platform, including our website, 
                smart contracts, and any related services.
              </p>
              <p>
                By connecting your wallet, creating an account, uploading content, or otherwise using our 
                Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms 
                and our Privacy Policy.
              </p>
              <p className="font-semibold text-primary">
                If you do not agree to these Terms, do not use the Platform.
              </p>
            </CardContent>
          </Card>

          {/* 2. Eligibility */}
          <Card className="mb-6 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                <Shield className="h-5 w-5 text-primary" />
                2. Eligibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm sm:text-base leading-relaxed">
              <p>To use ROUGEE.PLAY, you must:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Be at least 18 years old or the age of majority in your jurisdiction</li>
                <li>Have the legal capacity to enter into binding contracts</li>
                <li>Not be prohibited from using our Services under applicable laws</li>
                <li>Comply with all local laws regarding online conduct and acceptable content</li>
                <li>Have a compatible cryptocurrency wallet (e.g., MetaMask, Privy embedded wallet)</li>
              </ul>
              <p className="mt-4">
                By using the Platform, you represent and warrant that you meet these eligibility requirements.
              </p>
            </CardContent>
          </Card>

          {/* 3. Platform Description */}
          <Card className="mb-6 border-2">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">3. Platform Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm sm:text-base leading-relaxed">
              <p>
                ROUGEE.PLAY is a decentralized music platform built on blockchain technology (Base Network) 
                that enables:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Music Streaming:</strong> Free listening to music uploaded by artists</li>
                <li><strong>Token Trading:</strong> Buying and selling song-specific tokens via bonding curves</li>
                <li><strong>Content Creation:</strong> Artists uploading and monetizing their music</li>
                <li><strong>Social Features:</strong> Feed posts, comments, and community interactions</li>
                <li><strong>Token Swapping:</strong> Exchange of XRGE, KTA, USDC, and ETH tokens</li>
              </ul>
              <p className="mt-4 text-muted-foreground text-xs sm:text-sm">
                <strong>Note:</strong> All transactions are executed via smart contracts on the blockchain 
                and are irreversible once confirmed.
              </p>
            </CardContent>
          </Card>

          {/* 4. User Accounts & Wallets */}
          <Card className="mb-6 border-2">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">4. User Accounts & Wallets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm sm:text-base leading-relaxed">
              <div>
                <h4 className="font-semibold mb-2">4.1 Wallet Connection</h4>
                <p>
                  You must connect a cryptocurrency wallet to use most features of the Platform. You are 
                  responsible for:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Maintaining the security of your wallet and private keys</li>
                  <li>All activity associated with your wallet address</li>
                  <li>Any losses resulting from unauthorized access to your wallet</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">4.2 Account Security</h4>
                <p>
                  <strong className="text-primary">WE DO NOT STORE YOUR PRIVATE KEYS.</strong> If you lose 
                  access to your wallet, we cannot recover your funds or assets. Always keep your private 
                  keys and recovery phrases secure and backed up.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 5. Artist Terms */}
          <Card className="mb-6 border-2">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">5. Artist Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm sm:text-base leading-relaxed">
              <div>
                <h4 className="font-semibold mb-2">5.1 Content Ownership & Rights</h4>
                <p>By uploading music to ROUGEE.PLAY, you represent and warrant that:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>You own all rights to the content or have obtained necessary licenses</li>
                  <li>Your content does not infringe any third-party copyrights, trademarks, or other rights</li>
                  <li>Your content complies with all applicable laws and regulations</li>
                  <li>You have the right to grant the licenses described in these Terms</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">5.2 Copyright Verification</h4>
                <p>
                  All music uploads are subject to copyright verification. We may remove content that 
                  violates intellectual property rights. Artists who repeatedly upload infringing content 
                  may be banned from the Platform.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">5.3 Content License</h4>
                <p>
                  By uploading content, you grant ROUGEE.PLAY and its users a non-exclusive, worldwide, 
                  royalty-free license to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Host, store, and display your content on the Platform</li>
                  <li>Stream your music to Platform users</li>
                  <li>Display your music metadata, cover art, and artist information</li>
                </ul>
                <p className="mt-3 font-semibold text-primary">
                  You retain all ownership rights to your original content.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">5.4 Token Economics</h4>
                <p>
                  When you upload a song, a bonding curve contract is deployed, creating song-specific 
                  tokens. Artists receive an initial allocation of tokens. The Platform does not guarantee 
                  any specific value or liquidity for these tokens.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 6. Token Trading & Financial Terms */}
          <Card className="mb-6 border-2">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">6. Token Trading & Financial Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm sm:text-base leading-relaxed">
              <Alert className="border-orange-500/50 bg-orange-500/5">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <AlertDescription className="text-sm">
                  <strong>High Risk:</strong> Trading tokens involves substantial risk of loss. Only trade 
                  with funds you can afford to lose.
                </AlertDescription>
              </Alert>
              <div>
                <h4 className="font-semibold mb-2">6.1 No Investment Advice</h4>
                <p>
                  ROUGEE.PLAY does not provide investment, financial, legal, or tax advice. Nothing on the 
                  Platform should be considered as an offer to sell or solicitation to buy securities. You 
                  are solely responsible for your trading decisions.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">6.2 Bonding Curves</h4>
                <p>
                  Song tokens are traded via automated bonding curve contracts. Prices increase as more 
                  tokens are purchased and decrease as tokens are sold. The Platform does not control 
                  token prices.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">6.3 Transaction Fees</h4>
                <p>All transactions may incur:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Blockchain gas fees (paid to network validators)</li>
                  <li>Platform trading fees (typically 3% on sales)</li>
                  <li>DEX swap fees (for token exchanges)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">6.4 Irreversible Transactions</h4>
                <p className="text-primary font-semibold">
                  All blockchain transactions are final and irreversible. Once confirmed, we cannot reverse, 
                  cancel, or refund transactions.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">6.5 No Guarantees</h4>
                <p>
                  We make no guarantees regarding token value, liquidity, or market performance. Token 
                  values may fluctuate wildly or go to zero.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 7. Prohibited Conduct */}
          <Card className="mb-6 border-2">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">7. Prohibited Conduct</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm sm:text-base leading-relaxed">
              <p>You agree NOT to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Upload content you do not own or have rights to</li>
                <li>Upload content that is illegal, harmful, threatening, abusive, or offensive</li>
                <li>Manipulate token prices or engage in market manipulation</li>
                <li>Use the Platform for money laundering or other illegal financial activities</li>
                <li>Attempt to hack, exploit, or disrupt the Platform or smart contracts</li>
                <li>Create fake accounts or impersonate others</li>
                <li>Spam, harass, or abuse other users</li>
                <li>Use bots or automated tools without authorization</li>
                <li>Reverse engineer or copy the Platform's code (unless open source)</li>
              </ul>
              <p className="mt-4 font-semibold text-destructive">
                Violation of these rules may result in immediate account termination and legal action.
              </p>
            </CardContent>
          </Card>

          {/* 8. IPFS & Decentralized Storage */}
          <Card className="mb-6 border-2">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">8. IPFS & Decentralized Storage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm sm:text-base leading-relaxed">
              <p>
                Content uploaded to ROUGEE.PLAY is stored on IPFS (InterPlanetary File System), a 
                decentralized storage network. This means:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Content is distributed across multiple nodes worldwide</li>
                <li>Content is permanent and cannot be easily deleted once uploaded</li>
                <li>We cannot guarantee 100% availability of IPFS content</li>
                <li>Content may be accessible via multiple gateways and services</li>
              </ul>
              <p className="mt-3 text-muted-foreground text-xs sm:text-sm">
                <strong>Important:</strong> Once uploaded to IPFS, content is extremely difficult to remove 
                completely. Do not upload content you may want to delete later.
              </p>
            </CardContent>
          </Card>

          {/* 9. Disclaimers & Limitation of Liability */}
          <Card className="mb-6 border-2">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">9. Disclaimers & Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm sm:text-base leading-relaxed">
              <div>
                <h4 className="font-semibold mb-2">9.1 "AS IS" Service</h4>
                <p>
                  THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
                  EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
                  PURPOSE, OR NON-INFRINGEMENT.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">9.2 Smart Contract Risks</h4>
                <p>
                  Smart contracts are experimental technology. We do not guarantee they are bug-free. You 
                  assume all risks associated with using smart contracts, including loss of funds.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">9.3 Third-Party Services</h4>
                <p>
                  The Platform integrates with third-party services (wallets, DEXs, price oracles). We are 
                  not responsible for their performance, availability, or security.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">9.4 Limitation of Liability</h4>
                <p className="uppercase font-bold">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, ROUGEE.PLAY, ITS AFFILIATES, AND TEAM MEMBERS 
                  SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE 
                  DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR USE, ARISING FROM YOUR USE OF THE 
                  PLATFORM.
                </p>
                <p className="mt-3">
                  IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED $100 USD OR THE AMOUNT YOU PAID US IN THE 
                  PAST 12 MONTHS, WHICHEVER IS GREATER.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 10. Indemnification */}
          <Card className="mb-6 border-2">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">10. Indemnification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm sm:text-base leading-relaxed">
              <p>
                You agree to indemnify, defend, and hold harmless ROUGEE.PLAY, its affiliates, officers, 
                directors, employees, and agents from any claims, damages, losses, liabilities, and expenses 
                (including legal fees) arising from:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your use of the Platform</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another party</li>
                <li>Content you upload to the Platform</li>
                <li>Your trading activities and financial decisions</li>
              </ul>
            </CardContent>
          </Card>

          {/* 11. Termination */}
          <Card className="mb-6 border-2">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">11. Termination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm sm:text-base leading-relaxed">
              <p>
                We reserve the right to suspend or terminate your access to the Platform at any time, with 
                or without notice, for any reason, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violation of these Terms</li>
                <li>Fraudulent or illegal activity</li>
                <li>Abuse of the Platform or other users</li>
                <li>Prolonged inactivity</li>
              </ul>
              <p className="mt-3 font-semibold">
                Upon termination, your right to use the Platform ceases immediately. However, blockchain 
                transactions and IPFS content cannot be reversed or deleted.
              </p>
            </CardContent>
          </Card>

          {/* 12. Changes to Terms */}
          <Card className="mb-6 border-2">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">12. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm sm:text-base leading-relaxed">
              <p>
                We may modify these Terms at any time. Changes will be effective immediately upon posting 
                to the Platform. Your continued use of the Platform after changes constitutes acceptance 
                of the new Terms.
              </p>
              <p className="font-semibold text-primary">
                We recommend reviewing these Terms periodically.
              </p>
            </CardContent>
          </Card>

          {/* 13. Governing Law & Dispute Resolution */}
          <Card className="mb-6 border-2">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">13. Governing Law & Dispute Resolution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm sm:text-base leading-relaxed">
              <p>
                These Terms shall be governed by and construed in accordance with the laws of [Your 
                Jurisdiction], without regard to its conflict of law provisions.
              </p>
              <p>
                Any disputes arising from these Terms or your use of the Platform shall be resolved through 
                binding arbitration in accordance with [Arbitration Rules], except where prohibited by law.
              </p>
            </CardContent>
          </Card>

          {/* 14. Contact Information */}
          <Card className="mb-6 border-2 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">14. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm sm:text-base leading-relaxed">
              <p>For questions about these Terms, please contact us:</p>
              <ul className="space-y-2 ml-4">
                <li><strong>Email:</strong> legal@rougee.network</li>
                <li><strong>Discord:</strong> discord.gg/Vumf5tcMTp</li>
                <li><strong>X (Twitter):</strong> @rougeenetwork</li>
              </ul>
            </CardContent>
          </Card>

          {/* Acknowledgment */}
          <Alert className="bg-primary/10 border-primary">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm sm:text-base">
              <strong>By using ROUGEE.PLAY, you acknowledge that you have read, understood, and agree to be 
              bound by these Terms of Service.</strong> If you do not agree, please discontinue use of the 
              Platform immediately.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    </>
  );
};

export default TermsOfService;

