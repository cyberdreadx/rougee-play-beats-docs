import { useNavigate } from "react-router-dom";
import { Music, Twitter, Github, MessageCircle } from "lucide-react";

const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: "Discover", path: "/" },
      { name: "Upload Music", path: "/upload" },
      { name: "Become Artist", path: "/become-artist" },
      { name: "Wallet", path: "/wallet" },
    ],
    resources: [
      { name: "Documentation", href: "#" },
      { name: "API", href: "#" },
      { name: "Support", href: "#" },
      { name: "Terms", href: "#" },
    ],
    community: [
      { name: "Twitter", href: "https://x.com/rougeenetwork", icon: Twitter },
      { name: "Discord", href: "https://discord.gg/Vumf5tcMTp", icon: MessageCircle },
      { name: "GitHub", href: "https://github.com/cyberdreadx/rougee-play-beats", icon: Github },
    ],
  };

  return (
    <footer className="w-full mt-16 border-t border-neon-green/20 glass">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Music className="h-4 w-4 text-neon-green" />
              <h3 className="text-sm font-bold neon-text font-mono">
                ROUGEE.PLAY
              </h3>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono mb-3">
              Decentralized blockchain music platform. Own your music, trade artist tokens.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-mono font-semibold text-foreground mb-3 text-xs">
              PRODUCT
            </h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="text-[10px] text-muted-foreground hover:text-neon-green transition-colors font-mono"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-mono font-semibold text-foreground mb-3 text-xs">
              RESOURCES
            </h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-[10px] text-muted-foreground hover:text-neon-green transition-colors font-mono"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Community Links */}
          <div>
            <h4 className="font-mono font-semibold text-foreground mb-3 text-xs">
              COMMUNITY
            </h4>
            <div className="flex flex-col space-y-3">
              {footerLinks.community.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    className="flex items-center gap-2 text-[10px] text-muted-foreground hover:text-neon-green transition-colors font-mono group"
                  >
                    <Icon className="h-3 w-3 group-hover:scale-110 transition-transform" />
                    {link.name}
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-neon-green/10 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-[10px] text-muted-foreground font-mono">
            © {currentYear} ROUGEE.PLAY. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
            <a href="#" className="hover:text-neon-green transition-colors">
              Privacy Policy
            </a>
            <span>|</span>
            <a href="#" className="hover:text-neon-green transition-colors">
              Terms of Service
            </a>
            <span>|</span>
            <a href="#" className="hover:text-neon-green transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
