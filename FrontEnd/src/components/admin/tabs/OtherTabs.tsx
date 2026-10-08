import React from "react";
import type { AdminAssignmentInfo } from "@/types/admin.types";
import { SystemSettingsTab } from "./SystemSettingsTab";

export { FoodsTab } from "./FoodsTab";
export { CollectionsTab } from "./CollectionsTab";
export { BlogsTab } from "./BlogsTab";
export { AuditLogsTab } from "./AuditLogsTab";
export { CategoriesTab } from "./CategoriesTab";
export { ProvincesTab } from "./ProvincesTab";
export { SystemSettingsTab } from "./SystemSettingsTab";
export { AdminProfileTab } from "./AdminProfileTab";

// Alias for backwards compatibility with AdminPage routes
export const NotificationsProfileTab: React.FC<{
  currentAdminInfo?: AdminAssignmentInfo;
  onNavigateTab?: (tab: string) => void;
  showToast?: (msg: string) => void;
}> = (props) => {
  return <SystemSettingsTab currentAdminInfo={props.currentAdminInfo as any} showToast={props.showToast} />;
};
