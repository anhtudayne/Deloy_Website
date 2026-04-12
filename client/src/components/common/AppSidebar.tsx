import { Link, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Warehouse,
  Package,
  Truck,
  PackageSearch,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type NavId =
  | "home"
  | "operations"
  | "products"
  | "confirmation"
  | "trace"
  | "partners";

function useActiveNav(): NavId | null {
  const { pathname } = useLocation();
  if (pathname === "/") return "home";
  if (pathname.startsWith("/operations")) return "operations";
  if (pathname.startsWith("/products")) return "products";
  if (pathname.startsWith("/confirmation")) return "confirmation";
  if (pathname.startsWith("/trace")) return "trace";
  if (pathname.startsWith("/partners")) return "partners";
  return null;
}

function SidebarNavLink({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      title={label}
      className={cn(
        "group/nav flex h-10 w-full min-w-0 items-center rounded-xl border transition-colors active:opacity-80 active:scale-[0.98]",
        "justify-center gap-0 pl-0 group-hover/sidebar:justify-start group-hover/sidebar:gap-3 group-hover/sidebar:px-2",
        active
          ? "border-primary bg-primary text-white shadow-flat"
          : "border-border-soft bg-white text-slate-500 shadow-apple-sm hover:bg-slate-50 hover:text-slate-800",
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
        <Icon className="h-5 w-5" />
      </span>
      <span
        className={cn(
          "min-w-0 overflow-hidden whitespace-nowrap text-left text-[13px] font-medium transition-all duration-200 ease-out",
          "max-w-0 opacity-0 group-hover/sidebar:max-w-[200px] group-hover/sidebar:opacity-100",
          active ? "text-white" : "text-slate-700",
        )}
      >
        {label}
      </span>
    </Link>
  );
}

/**
 * Thanh điều hướng dọc: mặc định chỉ icon; hover mở rộng để hiện nhãn mục.
 */
export default function AppSidebar() {
  const activeNav = useActiveNav();
  const logout = useAuthStore((state) => state.logout);

  return (
    <aside className="shrink-0">
      <div
        className={cn(
          "group/sidebar flex w-[72px] flex-col gap-2 overflow-hidden border-r border-border-soft bg-white py-6 pl-2 pr-2",
          "transition-[width] duration-200 ease-out hover:w-[220px]",
        )}
      >
        <Link
          to="/"
          title="F4 Warehouse"
          className="flex h-10 w-full min-w-0 items-center justify-center gap-0 rounded-xl group-hover/sidebar:justify-start group-hover/sidebar:gap-3 group-hover/sidebar:px-2"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
            F4
          </span>
          <span
            className={cn(
              "min-w-0 overflow-hidden whitespace-nowrap text-left text-[13px] font-semibold tracking-tight text-slate-900 transition-all duration-200 ease-out",
              "max-w-0 opacity-0 group-hover/sidebar:max-w-[200px] group-hover/sidebar:opacity-100",
            )}
          >
            Warehouse
          </span>
        </Link>

        <div className="border-t border-border-soft" />

        <SidebarNavLink
          to="/"
          label="Dashboard"
          icon={LayoutDashboard}
          active={activeNav === "home"}
        />
        <SidebarNavLink
          to="/operations"
          label="Vận hành"
          icon={Warehouse}
          active={activeNav === "operations"}
        />
        <SidebarNavLink
          to="/products"
          label="Sản phẩm"
          icon={Package}
          active={activeNav === "products"}
        />
        <SidebarNavLink
          to="/confirmation"
          label="Vận chuyển"
          icon={Truck}
          active={activeNav === "confirmation"}
        />
        <SidebarNavLink
          to="/trace"
          label="Tìm kiếm IMEI"
          icon={PackageSearch}
          active={activeNav === "trace"}
        />
        <SidebarNavLink
          to="/partners"
          label="Đối tác"
          icon={Users}
          active={activeNav === "partners"}
        />

        <div className="min-h-[8px] flex-1" />

        <div className="border-t border-border-soft" />

        <button
          type="button"
          title="Cài đặt (sắp có)"
          className={cn(
            "flex h-10 w-full min-w-0 items-center rounded-xl border border-border-soft bg-white text-slate-500 shadow-apple-sm transition-colors",
            "justify-center gap-0 pl-0 hover:bg-slate-50 hover:text-slate-800",
            "group-hover/sidebar:justify-start group-hover/sidebar:gap-3 group-hover/sidebar:px-2",
            "active:opacity-80 active:scale-[0.98]",
          )}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <Settings className="h-5 w-5" />
          </span>
          <span
            className={cn(
              "min-w-0 overflow-hidden whitespace-nowrap text-left text-[13px] font-medium text-slate-700 transition-all duration-200 ease-out",
              "max-w-0 opacity-0 group-hover/sidebar:max-w-[200px] group-hover/sidebar:opacity-100",
            )}
          >
            Cài đặt
          </span>
        </button>

        <button
          type="button"
          onClick={logout}
          title="Đăng xuất"
          className={cn(
            "flex h-10 w-full min-w-0 items-center rounded-xl border border-border-soft bg-white text-slate-500 shadow-apple-sm transition-colors",
            "justify-center gap-0 pl-0 hover:bg-status-danger/10 hover:text-status-danger hover:border-status-danger/20",
            "group-hover/sidebar:justify-start group-hover/sidebar:gap-3 group-hover/sidebar:px-2",
            "active:opacity-80 active:scale-[0.98]",
          )}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <LogOut className="h-5 w-5" />
          </span>
          <span
            className={cn(
              "min-w-0 overflow-hidden whitespace-nowrap text-left text-[13px] font-medium transition-all duration-200 ease-out",
              "max-w-0 opacity-0 group-hover/sidebar:max-w-[200px] group-hover/sidebar:opacity-100",
            )}
          >
            Đăng xuất
          </span>
        </button>
      </div>
    </aside>
  );
}
