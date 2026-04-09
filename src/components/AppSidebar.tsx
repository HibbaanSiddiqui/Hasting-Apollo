import { Plus, FileText, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Submission } from "@/lib/types";

interface AppSidebarProps {
  submissions: Submission[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function AppSidebar({ submissions, activeId, onSelect, onNew }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-lg">Hasting Apollo</span>
        </div>
        <Button onClick={onNew} className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          New Request
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>History</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {submissions.length === 0 && (
                <p className="text-xs text-muted-foreground px-3 py-2">No submissions yet</p>
              )}
              {submissions.map((sub) => (
                <SidebarMenuItem key={sub.id}>
                  <SidebarMenuButton
                    onClick={() => onSelect(sub.id)}
                    isActive={activeId === sub.id}
                    className="flex flex-col items-start gap-1 h-auto py-2"
                  >
                    <span className="font-medium text-sm truncate w-full">
                      {sub.patientName || "Untitled"}
                    </span>
                    <div className="flex items-center gap-2 w-full">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </span>
                      <Badge
                        variant={sub.status === "reviewed" ? "default" : "secondary"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {sub.status}
                      </Badge>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
