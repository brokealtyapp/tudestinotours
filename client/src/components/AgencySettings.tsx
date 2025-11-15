import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Building2, Upload, Loader2 } from "lucide-react";
import imageCompression from 'browser-image-compression';

interface AgencyConfig {
  name: string;
  tagline: string;
  logoUrl?: string;
  website: string;
  email: string;
  phone: string;
  emergencyPhone?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
}

export default function AgencySettings() {
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const { data: settings = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/config"],
  });

  // Extract agency configuration from settings
  const agencyConfig: AgencyConfig = {
    name: settings.find((s: any) => s.key === 'AGENCY_NAME')?.value || 'Tu Destino Tours',
    tagline: settings.find((s: any) => s.key === 'AGENCY_TAGLINE')?.value || 'Tu próxima aventura comienza aquí',
    logoUrl: settings.find((s: any) => s.key === 'AGENCY_LOGO_URL')?.value || undefined,
    website: settings.find((s: any) => s.key === 'AGENCY_WEBSITE')?.value || 'www.tudestinotours.com',
    email: settings.find((s: any) => s.key === 'AGENCY_EMAIL')?.value || 'info@tudestinotours.com',
    phone: settings.find((s: any) => s.key === 'AGENCY_PHONE')?.value || '+1 (555) 123-4567',
    emergencyPhone: settings.find((s: any) => s.key === 'AGENCY_EMERGENCY_PHONE')?.value || undefined,
    facebookUrl: settings.find((s: any) => s.key === 'AGENCY_FACEBOOK_URL')?.value || undefined,
    instagramUrl: settings.find((s: any) => s.key === 'AGENCY_INSTAGRAM_URL')?.value || undefined,
    twitterUrl: settings.find((s: any) => s.key === 'AGENCY_TWITTER_URL')?.value || undefined,
    linkedinUrl: settings.find((s: any) => s.key === 'AGENCY_LINKEDIN_URL')?.value || undefined,
  };

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      return apiRequest("POST", "/api/config", {
        key,
        value,
        description: `Configuración de agencia`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      toast({
        title: "Configuración actualizada",
        description: "La configuración de la agencia se actualizó correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar la configuración",
      });
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingLogo(true);

      // Compress image
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 400,
        useWebWorker: true,
      });

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        setLogoPreview(base64data);

        try {
          // Upload logo
          const response = await apiRequest("POST", "/api/settings/agency-logo", {
            imageData: base64data,
          });

          queryClient.invalidateQueries({ queryKey: ["/api/config"] });
          
          toast({
            title: "Logo subido",
            description: "El logo de la agencia se actualizó correctamente.",
          });
        } catch (error: any) {
          toast({
            variant: "destructive",
            title: "Error al subir logo",
            description: error.message || "No se pudo subir el logo",
          });
        } finally {
          setIsUploadingLogo(false);
        }
      };
      reader.readAsDataURL(compressedFile);
    } catch (error: any) {
      setIsUploadingLogo(false);
      toast({
        variant: "destructive",
        title: "Error al procesar imagen",
        description: error.message || "No se pudo procesar la imagen",
      });
    }
  };

  const handleFieldUpdate = (key: string, value: string) => {
    updateSettingMutation.mutate({ key, value });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Agencia</CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Configuración de Agencia</CardTitle>
            <CardDescription>
              Configura la información de tu agencia que aparecerá en folletos y documentos
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Upload */}
        <div className="space-y-3">
          <Label>Logo de la Agencia</Label>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {(logoPreview || agencyConfig.logoUrl) ? (
                <div className="w-32 h-32 border-2 border-dashed rounded-lg overflow-hidden">
                  <img
                    src={logoPreview || agencyConfig.logoUrl}
                    alt="Logo preview"
                    className="w-full h-full object-contain bg-muted"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                  <Building2 className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm text-muted-foreground">
                Sube el logo de tu agencia. Tamaño recomendado: 400x400px. Formatos: PNG, JPG, WebP.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUploadingLogo}
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  data-testid="button-upload-logo"
                >
                  {isUploadingLogo ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Subir Logo
                    </>
                  )}
                </Button>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                  disabled={isUploadingLogo}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Agency Name */}
        <div className="space-y-2">
          <Label htmlFor="agency-name">Nombre de la Agencia</Label>
          <div className="flex gap-2">
            <Input
              id="agency-name"
              defaultValue={agencyConfig.name}
              placeholder="Tu Destino Tours"
              data-testid="input-agency-name"
              onBlur={(e) => {
                if (e.target.value !== agencyConfig.name) {
                  handleFieldUpdate('AGENCY_NAME', e.target.value);
                }
              }}
            />
          </div>
        </div>

        {/* Agency Tagline */}
        <div className="space-y-2">
          <Label htmlFor="agency-tagline">Eslogan / Tagline</Label>
          <Input
            id="agency-tagline"
            defaultValue={agencyConfig.tagline}
            placeholder="Tu próxima aventura comienza aquí"
            data-testid="input-agency-tagline"
            onBlur={(e) => {
              if (e.target.value !== agencyConfig.tagline) {
                handleFieldUpdate('AGENCY_TAGLINE', e.target.value);
              }
            }}
          />
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="agency-website">Sitio Web</Label>
          <Input
            id="agency-website"
            type="url"
            defaultValue={agencyConfig.website}
            placeholder="www.tudestinotours.com"
            data-testid="input-agency-website"
            onBlur={(e) => {
              if (e.target.value !== agencyConfig.website) {
                handleFieldUpdate('AGENCY_WEBSITE', e.target.value);
              }
            }}
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="agency-email">Email de Contacto</Label>
          <Input
            id="agency-email"
            type="email"
            defaultValue={agencyConfig.email}
            placeholder="info@tudestinotours.com"
            data-testid="input-agency-email"
            onBlur={(e) => {
              if (e.target.value !== agencyConfig.email) {
                handleFieldUpdate('AGENCY_EMAIL', e.target.value);
              }
            }}
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="agency-phone">Teléfono Principal</Label>
          <Input
            id="agency-phone"
            type="tel"
            defaultValue={agencyConfig.phone}
            placeholder="+1 (555) 123-4567"
            data-testid="input-agency-phone"
            onBlur={(e) => {
              if (e.target.value !== agencyConfig.phone) {
                handleFieldUpdate('AGENCY_PHONE', e.target.value);
              }
            }}
          />
        </div>

        {/* Emergency Phone */}
        <div className="space-y-2">
          <Label htmlFor="agency-emergency-phone">Teléfono de Emergencias 24/7 (Opcional)</Label>
          <Input
            id="agency-emergency-phone"
            type="tel"
            defaultValue={agencyConfig.emergencyPhone}
            placeholder="+1 (555) 999-9999"
            data-testid="input-agency-emergency-phone"
            onBlur={(e) => {
              if (e.target.value !== agencyConfig.emergencyPhone) {
                handleFieldUpdate('AGENCY_EMERGENCY_PHONE', e.target.value);
              }
            }}
          />
        </div>

        {/* Social Media Section */}
        <div className="pt-6 border-t space-y-4">
          <h3 className="text-lg font-semibold">Redes Sociales</h3>
          <p className="text-sm text-muted-foreground">
            Agrega los enlaces a tus redes sociales. Estos aparecerán en el footer del sitio web.
          </p>

          {/* Facebook */}
          <div className="space-y-2">
            <Label htmlFor="agency-facebook">Facebook URL (Opcional)</Label>
            <Input
              id="agency-facebook"
              type="url"
              defaultValue={agencyConfig.facebookUrl}
              placeholder="https://facebook.com/tudestinotours"
              data-testid="input-agency-facebook"
              onBlur={(e) => {
                if (e.target.value !== agencyConfig.facebookUrl) {
                  handleFieldUpdate('AGENCY_FACEBOOK_URL', e.target.value);
                }
              }}
            />
          </div>

          {/* Instagram */}
          <div className="space-y-2">
            <Label htmlFor="agency-instagram">Instagram URL (Opcional)</Label>
            <Input
              id="agency-instagram"
              type="url"
              defaultValue={agencyConfig.instagramUrl}
              placeholder="https://instagram.com/tudestinotours"
              data-testid="input-agency-instagram"
              onBlur={(e) => {
                if (e.target.value !== agencyConfig.instagramUrl) {
                  handleFieldUpdate('AGENCY_INSTAGRAM_URL', e.target.value);
                }
              }}
            />
          </div>

          {/* Twitter */}
          <div className="space-y-2">
            <Label htmlFor="agency-twitter">Twitter/X URL (Opcional)</Label>
            <Input
              id="agency-twitter"
              type="url"
              defaultValue={agencyConfig.twitterUrl}
              placeholder="https://twitter.com/tudestinotours"
              data-testid="input-agency-twitter"
              onBlur={(e) => {
                if (e.target.value !== agencyConfig.twitterUrl) {
                  handleFieldUpdate('AGENCY_TWITTER_URL', e.target.value);
                }
              }}
            />
          </div>

          {/* LinkedIn */}
          <div className="space-y-2">
            <Label htmlFor="agency-linkedin">LinkedIn URL (Opcional)</Label>
            <Input
              id="agency-linkedin"
              type="url"
              defaultValue={agencyConfig.linkedinUrl}
              placeholder="https://linkedin.com/company/tudestinotours"
              data-testid="input-agency-linkedin"
              onBlur={(e) => {
                if (e.target.value !== agencyConfig.linkedinUrl) {
                  handleFieldUpdate('AGENCY_LINKEDIN_URL', e.target.value);
                }
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
