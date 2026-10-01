import { Dashboard, type TabId } from "@/components/admin/Dashboard";
import { getAdminData } from "@/lib/admin/data";
import { requireAdminPage } from "@/lib/auth/guard";

const TABS: TabId[] = ["site", "games", "showcase", "branding", "account"];

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string | string[] }> }) {
  await requireAdminPage();
  const [data, { tab }] = await Promise.all([getAdminData(), searchParams]);
  const initialTab = TABS.find((t) => t === tab) ?? "site";
  return <Dashboard data={data} initialTab={initialTab} />;
}
