import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ProviderLayout } from "@/components/layout/ProviderLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  FileText,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Video,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConsentModule {
  id: string;
  name: string;
  description: string | null;
  video_url: string | null;
  tags: string[] | null;
  created_at: string;
  created_by: string;
}

export default function Modules() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState<ConsentModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "video" | "text">("all");
  const [deleteModule, setDeleteModule] = useState<ConsentModule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchModules();
    }
  }, [user]);

  const fetchModules = async () => {
    if (!user) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from("consent_modules")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching modules:", error);
      toast.error("Failed to load modules");
    } else {
      setModules(data || []);
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteModule) return;

    setIsDeleting(true);
    const { error } = await supabase
      .from("consent_modules")
      .delete()
      .eq("id", deleteModule.id);

    if (error) {
      console.error("Error deleting module:", error);
      toast.error("Failed to delete module");
    } else {
      toast.success("Module deleted successfully");
      setModules(modules.filter((m) => m.id !== deleteModule.id));
    }
    setIsDeleting(false);
    setDeleteModule(null);
  };

  const handleDuplicate = async (module: ConsentModule) => {
    if (!user) return;

    const { data, error } = await supabase
      .from("consent_modules")
      .insert({
        name: `${module.name} (Copy)`,
        description: module.description,
        video_url: module.video_url,
        tags: module.tags,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error duplicating module:", error);
      toast.error("Failed to duplicate module");
    } else {
      toast.success("Module duplicated successfully");
      setModules([data, ...modules]);
    }
  };

  const filteredModules = modules.filter((module) => {
    const matchesSearch =
      module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesFilter =
      filter === "all" ||
      (filter === "video" && module.video_url) ||
      (filter === "text" && !module.video_url);

    return matchesSearch && matchesFilter;
  });

  if (authLoading || isLoading) {
    return (
      <ProviderLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display">Consent Modules</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage consent forms for your patients
            </p>
          </div>
          <Button asChild>
            <Link to="/modules/new">
              <Plus className="h-4 w-4 mr-2" />
              New Module
            </Link>
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 input-focus-ring"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "outline" : "ghost"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "video" ? "outline" : "ghost"}
              size="sm"
              onClick={() => setFilter("video")}
            >
              With Video
            </Button>
            <Button
              variant={filter === "text" ? "outline" : "ghost"}
              size="sm"
              onClick={() => setFilter("text")}
            >
              Text Only
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {filteredModules.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {modules.length === 0
                ? "No modules yet"
                : "No modules match your search"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {modules.length === 0
                ? "Create your first consent module to get started"
                : "Try adjusting your search or filter"}
            </p>
            {modules.length === 0 && (
              <Button asChild>
                <Link to="/modules/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Module
                </Link>
              </Button>
            )}
          </div>
        )}

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((module, index) => (
            <div
              key={module.id}
              className="card-interactive p-6 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  {module.video_url && (
                    <Badge variant="secondary" className="gap-1">
                      <Video className="h-3 w-3" />
                      Video
                    </Badge>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={`/modules/${module.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicate(module)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteModule(module)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <h3 className="font-semibold mb-2 line-clamp-2">{module.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {module.description || "No description"}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {module.tags?.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
                <span>{new Date(module.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteModule} onOpenChange={() => setDeleteModule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Module</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteModule?.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProviderLayout>
  );
}
