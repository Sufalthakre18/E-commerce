import AdminDashboardPage from "@/components/admin/dashboard/AdminDashboardPage";
import AdminLayout from "@/components/layout/AdminLayout";

export default function AdminLayoutPage() {
  return (
    <AdminLayout>
      <section>
        <AdminDashboardPage/>
      </section>
    </AdminLayout>
  );
}