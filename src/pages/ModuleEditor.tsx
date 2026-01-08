import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ProviderLayout } from "@/components/layout/ProviderLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Video, 
  FileText,
  X,
  Plus,
  Loader2,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function ModuleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [procedureContext, setProcedureContext] = useState("");

  const isEditing = !!id;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (isEditing && user) {
      fetchModule();
    }
  }, [id, user]);

  const fetchModule = async () => {
    if (!id) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from("consent_modules")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching module:", error);
      toast.error("Failed to load module");
      navigate("/modules");
    } else if (data) {
      setName(data.name);
      setDescription(data.description || "");
      setVideoUrl(data.video_url || "");
      setTags(data.tags || []);
    } else {
      toast.error("Module not found");
      navigate("/modules");
    }
    setIsLoading(false);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const generateConsentText = async () => {
    if (!name.trim()) {
      toast.error("Please enter a procedure/module name first");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-consent-text", {
        body: {
          procedureName: name,
          procedureDescription: procedureContext,
          additionalContext: tags.length > 0 ? `Specialty: ${tags.join(", ")}` : undefined,
        },
      });

      if (error) throw error;

      if (data?.consentText) {
        setDescription(data.consentText);
        toast.success("Consent text generated! Review and edit as needed.");
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (error) {
      console.error("Error generating consent text:", error);
      toast.error("Failed to generate consent text. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a module name");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter consent text");
      return;
    }
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setIsSaving(true);

    const moduleData = {
      name: name.trim(),
      description: description.trim(),
      video_url: videoUrl.trim() || null,
      tags: tags.length > 0 ? tags : null,
      created_by: user.id,
    };

    let error;

    if (isEditing) {
      const { error: updateError } = await supabase
        .from("consent_modules")
        .update(moduleData)
        .eq("id", id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("consent_modules")
        .insert(moduleData);
      error = insertError;
    }

    if (error) {
      console.error("Error saving module:", error);
      toast.error("Failed to save module");
    } else {
      toast.success(isEditing ? "Module updated successfully!" : "Module created successfully!");
      navigate("/modules");
    }
    setIsSaving(false);
  };

  const getVideoEmbedUrl = (url: string) => {
    if (!url) return null;
    
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    // Direct video URL
    if (url.match(/\.(mp4|webm|ogg)$/i)) {
      return url;
    }
    
    return null;
  };

  const embedUrl = getVideoEmbedUrl(videoUrl);

  if (authLoading || isLoading) {
    return (
      <ProviderLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ProviderLayout>
    );
  }

  const providerName = profile?.full_name || user?.email?.split("@")[0] || "Provider";
  const practiceName = profile?.practice_name || "Medical Practice";

  return (
    <ProviderLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/modules">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold font-display">
                {isEditing ? "Edit Module" : "New Consent Module"}
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                {isEditing ? "Update your consent module" : "Create educational consent content for your patients"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? "Edit" : "Preview"}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEditing ? "Update Module" : "Save Module"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor Panel */}
          <div className={`space-y-6 ${showPreview ? "hidden lg:block" : ""}`}>
            <div className="card-elevated p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Module Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Surgical Consent - Knee Replacement"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-focus-ring"
                />
              </div>

              {/* AI Generation Section */}
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-medium">AI Consent Generator</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Describe the procedure and let AI draft the consent text for you to review.
                </p>
                <Textarea
                  placeholder="Optional: Describe the procedure, specific risks, or any special considerations..."
                  value={procedureContext}
                  onChange={(e) => setProcedureContext(e.target.value)}
                  className="min-h-[80px] input-focus-ring resize-y text-sm"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={generateConsentText}
                  disabled={isGenerating || !name.trim()}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : description ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate Consent Text
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Consent Text
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Consent Text *</Label>
                <Textarea
                  id="description"
                  placeholder="Enter the full consent text that patients will review and agree to..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[200px] input-focus-ring resize-y"
                />
                <p className="text-xs text-muted-foreground">
                  {description ? "Review and edit the generated text as needed." : "Formatting will be preserved. Use line breaks for paragraphs."}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoUrl">Educational Video URL (Optional)</Label>
                <div className="relative">
                  <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="videoUrl"
                    placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="pl-10 input-focus-ring"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Supports YouTube, Vimeo, or direct video links
                </p>
              </div>

              <div className="space-y-2">
                <Label>Specialty Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    className="input-focus-ring"
                  />
                  <Button variant="secondary" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:bg-foreground/10 rounded p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Video Preview */}
            {embedUrl && (
              <div className="card-elevated p-6">
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Video Preview
                </h3>
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  {embedUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                    <video src={embedUrl} controls className="w-full h-full" />
                  ) : (
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className={`${!showPreview ? "hidden lg:block" : ""}`}>
            <div className="card-elevated p-6 lg:sticky lg:top-24">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-semibold font-display">Patient View Preview</h3>
              </div>
              
              <div className="border border-border rounded-xl p-6 bg-background">
                {/* Mock Patient Header */}
                <div className="text-center mb-6 pb-6 border-b border-border">
                  <p className="text-sm text-muted-foreground">Consent Form from</p>
                  <p className="font-semibold">{providerName} - {practiceName}</p>
                </div>

                <h2 className="text-xl font-bold mb-4">
                  {name || "Consent Module Title"}
                </h2>

                {embedUrl && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted mb-6">
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Video className="h-8 w-8" />
                    </div>
                  </div>
                )}

                <div className="prose prose-sm max-w-none mb-6">
                  {description ? (
                    <p className="whitespace-pre-wrap text-sm">{description}</p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      Consent text will appear here...
                    </p>
                  )}
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Mock Signature Area */}
                <div className="pt-6 border-t border-border space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded border-2 border-primary" />
                    <span className="text-sm">I have reviewed the educational materials</span>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Digital Signature</Label>
                    <div className="h-12 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-sm text-muted-foreground">
                      Type your legal name
                    </div>
                  </div>
                  <Button className="w-full" disabled>
                    Submit Consent
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}
