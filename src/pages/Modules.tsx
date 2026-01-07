import { Link } from "react-router-dom";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ConsentModule {
  id: string;
  name: string;
  description: string;
  hasVideo: boolean;
  tags: string[];
  usageCount: number;
  createdAt: string;
}

const mockModules: ConsentModule[] = [
  {
    id: "1",
    name: "Surgical Consent - Knee Replacement",
    description: "Comprehensive consent for total knee arthroplasty including risks, benefits, and recovery expectations.",
    hasVideo: true,
    tags: ["Orthopedics", "Surgery"],
    usageCount: 45,
    createdAt: "2024-01-02",
  },
  {
    id: "2",
    name: "Anesthesia Consent - General",
    description: "Standard consent for general anesthesia administration with risk disclosure.",
    hasVideo: true,
    tags: ["Anesthesia"],
    usageCount: 89,
    createdAt: "2024-01-01",
  },
  {
    id: "3",
    name: "MRI Procedure Consent",
    description: "Patient consent for MRI imaging including contrast agent information.",
    hasVideo: false,
    tags: ["Radiology", "Imaging"],
    usageCount: 23,
    createdAt: "2023-12-28",
  },
  {
    id: "4",
    name: "Physical Therapy Treatment Plan",
    description: "Consent for physical therapy treatment including manual therapy techniques.",
    hasVideo: true,
    tags: ["PT", "Rehabilitation"],
    usageCount: 67,
    createdAt: "2023-12-20",
  },
  {
    id: "5",
    name: "Blood Work Authorization",
    description: "Authorization for routine blood work and laboratory testing.",
    hasVideo: false,
    tags: ["Laboratory"],
    usageCount: 112,
    createdAt: "2023-12-15",
  },
];

export default function Modules() {
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
              className="pl-9 input-focus-ring"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">All</Button>
            <Button variant="ghost" size="sm">With Video</Button>
            <Button variant="ghost" size="sm">Text Only</Button>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockModules.map((module, index) => (
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
                  {module.hasVideo && (
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
                    <DropdownMenuItem>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <h3 className="font-semibold mb-2 line-clamp-2">{module.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {module.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {module.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
                <span>Used {module.usageCount} times</span>
                <span>{new Date(module.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProviderLayout>
  );
}
