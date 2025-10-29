import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Globe, Mail } from "lucide-react";
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin } from "react-icons/fa";
import { useState } from "react";
import logo from "@assets/logo tu destino tours_1761750190712.png";

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = () => {
    console.log("Subscribe with email:", email);
    setEmail("");
  };

  return (
    <footer className="bg-muted/50 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="Tu Destino Tours" className="h-12" />
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Your ultimate go on travel and tour solution
            </p>
            <div className="flex items-center gap-2 mb-6">
              <Globe className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-sm">Our International Offices</p>
                <p className="text-sm text-muted-foreground">Australia, Nepal, USA</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">Budget Tours</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">Expert Insight</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">Independent</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">Luxury Tours</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">Safety Tips</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">Tips & Tricks</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Adventures</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">Extreme</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">In The Air</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">Nature & Wildlife</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">Winter Sports</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">Outdoor Parks</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">Motor Sports</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Destinations</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">USA</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">India</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">France</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">United Kingdom</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">Spain</Link></li>
              <li><Link href="#" className="hover-elevate px-2 py-1 rounded-md inline-block">Canada</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
              <p className="text-primary font-semibold whitespace-nowrap">Let's Talk</p>
              <div className="flex gap-2 w-full sm:max-w-md">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                  data-testid="input-newsletter"
                />
                <Button 
                  className="bg-primary text-primary-foreground hover-elevate active-elevate-2"
                  onClick={handleSubscribe}
                  data-testid="button-newsletter"
                >
                  Go
                </Button>
              </div>
            </div>

            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground" data-testid="link-facebook">
                <FaFacebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground" data-testid="link-instagram">
                <FaInstagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground" data-testid="link-twitter">
                <FaTwitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground" data-testid="link-linkedin">
                <FaLinkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2023 Tu Destino Tours premium template.</p>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
