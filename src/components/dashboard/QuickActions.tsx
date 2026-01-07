import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Send, FileText, Users } from "lucide-react";

export function QuickActions() {
  return (
    <div className="card-elevated p-6">
      <h2 className="text-lg font-semibold font-display mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        <Button 
          variant="default" 
          className="h-auto flex-col gap-2 py-4" 
          asChild
        >
          <Link to="/modules/new">
            <Plus className="h-5 w-5" />
            <span className="text-xs font-medium">New Module</span>
          </Link>
        </Button>
        <Button 
          variant="accent" 
          className="h-auto flex-col gap-2 py-4" 
          asChild
        >
          <Link to="/invitations/new">
            <Send className="h-5 w-5" />
            <span className="text-xs font-medium">Send Invite</span>
          </Link>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto flex-col gap-2 py-4" 
          asChild
        >
          <Link to="/modules">
            <FileText className="h-5 w-5" />
            <span className="text-xs font-medium">View Modules</span>
          </Link>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto flex-col gap-2 py-4" 
          asChild
        >
          <Link to="/patients">
            <Users className="h-5 w-5" />
            <span className="text-xs font-medium">All Patients</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
