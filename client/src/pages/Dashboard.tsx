import React, { useMemo, useState } from "react";
import Header from "../components/common/Header";
import AppSidebar from "../components/common/AppSidebar";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Bell,
  Box,
  ChevronRight,
  Headphones,
  Home,
  Package,
  Plus,
  Search,
  Smartphone,
  Truck,
  Warehouse,
  Zap,
} from "lucide-react";

import { useDashboardData } from "../hooks/useDashboardData";
import WarehouseModal from "../components/common/WarehouseModal";
import { useWarehouseStore } from "../store/useWarehouseStore";

/** Recharts/SVG dùng tên font đơn (Inter đã import trong globals.css) */
const CHART_FONT = "Inter";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type ActivityType =
  | "CHU KỲ LẤY HÀNG"
  | "ĐANG BỔ SUNG"
  | "ĐANG KIỂM KÊ"
  | "NHẬP HÀNG";

type TransactionEntity = {
  id: string;
  actorName: string;
  actorTag: string;
  actorBg: string;
  activityType: ActivityType;
  activityBg: string;
  activityText: string;
  location: string;
  progressPct: number;
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

// ─────────────────────────────────────────────
// Rounded Bar Shape (pill/jelly top)
// ─────────────────────────────────────────────
function RoundedBar(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
}) {
  const { x, y, width, height, fill } = props;
  if (x == null || y == null || width == null || height == null || height <= 0)
    return null;
  const r = Math.min(width / 2, 6);
  return (
    <path
      d={[
        `M ${x} ${y + height}`,
        `L ${x} ${y + r}`,
        `Q ${x} ${y} ${x + r} ${y}`,
        `L ${x + width - r} ${y}`,
        `Q ${x + width} ${y} ${x + width} ${y + r}`,
        `L ${x + width} ${y + height}`,
        "Z",
      ].join(" ")}
      fill={fill}
    />
  );
}

// ─────────────────────────────────────────────
// Progress Bar – candy pill shape
// ─────────────────────────────────────────────
function ProgressBar({
  value,
  colorClass,
  height = "h-2.5",
}: {
  value: number;
  colorClass: string;
  height?: string;
}) {
  const v = clamp(value, 0, 100);
  return (
    <div
      className={cn(
        "w-full rounded-full overflow-hidden bg-slate-100 shadow-apple-inset",
        height,
      )}
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-700",
          colorClass,
        )}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// Surface card — phẳng, viền + bóng nhẹ
// ─────────────────────────────────────────────
function SurfaceCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-card border border-border-soft bg-white p-6 shadow-apple-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// PillButton
// ─────────────────────────────────────────────
function PillButton({
  icon,
  iconBg,
  children,
  className,
  onClick,
}: {
  icon?: React.ReactNode;
  iconBg?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-10 rounded-full px-4 text-[13px] font-semibold inline-flex items-center gap-2 transition-all border border-border-soft bg-white shadow-apple-sm active:opacity-80 active:scale-[0.98]",
        className,
      )}
    >
      {icon && (
        <span
          className={cn(
            "w-6 h-6 rounded-full inline-flex items-center justify-center bg-slate-100",
            iconBg ?? "bg-slate-100",
          )}
        >
          {icon}
        </span>
      )}
      <span className="leading-none">{children}</span>
    </button>
  );
}

// ─────────────────────────────────────────────
// ActivityTag
// ─────────────────────────────────────────────
function ActivityTag({
  label,
  bg,
  textColor,
}: {
  label: string;
  bg: string;
  textColor: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold tracking-wide whitespace-nowrap",
        bg,
        textColor,
      )}
    >
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────
// TxnRow
// ─────────────────────────────────────────────
function TxnRow({ txn }: { txn: TransactionEntity }) {
  return (
    <div className="grid grid-cols-12 items-center gap-3 py-3">
      <div className="col-span-4 flex items-center gap-3">
        <div
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 border border-white/20",
            txn.actorBg,
          )}
        >
          {txn.actorTag}
        </div>
        <p className="text-sm font-semibold text-slate-800 leading-tight">
          {txn.actorName}
        </p>
      </div>
      <div className="col-span-3">
        <ActivityTag
          label={txn.activityType}
          bg={txn.activityBg}
          textColor={txn.activityText}
        />
      </div>
      <div className="col-span-3">
        <p className="text-sm font-medium text-slate-700">{txn.location}</p>
      </div>
      <div className="col-span-2 flex items-center gap-2">
        <div className="flex-1">
          <ProgressBar
            value={txn.progressPct}
            colorClass="bg-slate-800"
            height="h-2"
          />
        </div>
        <span className="text-[12px] font-bold text-slate-800 w-8 text-right shrink-0">
          {txn.progressPct}%
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ProductStockCard
// ─────────────────────────────────────────────
function ProductStockCard({
  icon,
  iconBg,
  title,
  sub,
  progressColor,
  progressValue,
  stockCount,
  soldCount,
  note,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  sub: string;
  progressColor: string;
  progressValue: number;
  stockCount: string;
  soldCount: string;
  note: string;
}) {
  return (
    <div className="rounded-card border border-border-soft bg-white p-5 h-full shadow-apple-md">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-border-soft bg-slate-50",
            iconBg,
          )}
        >
          {icon}
        </div>
        <div>
          <p className="text-[15px] font-semibold tracking-tight text-slate-900 leading-tight">
            {title}
          </p>
          <p className="text-[11px] text-slate-600 mt-0.5 font-normal">{sub}</p>
        </div>
      </div>
      <div className="mt-4">
        <ProgressBar
          value={progressValue}
          colorClass={progressColor}
          height="h-2.5"
        />
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div>
          <p className="text-2xl font-semibold tabular-nums font-mono text-slate-900 leading-none">
            {stockCount}
          </p>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide">
            máy
          </p>
        </div>
        <div className="w-px h-8 bg-slate-300/60" />
        <div>
          <p className="text-2xl font-semibold tabular-nums font-mono text-pink-500 leading-none">
            {soldCount}
          </p>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide">
            đã bán
          </p>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-slate-500 leading-snug">{note}</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────
export default function Dashboard() {
  const { availableWarehouses, selectedWarehouseId } = useWarehouseStore();
  const { stats, healthSpeed, healthDefect, activities, alerts, loading } =
    useDashboardData(selectedWarehouseId || undefined);
  const [warehouseModal, setWarehouseModal] = useState<{
    open: boolean;
    tab: "select" | "create";
  }>({ open: false, tab: "select" });

  const currentWarehouseName = useMemo(() => {
    if (selectedWarehouseId === null) return "Tất cả chi nhánh";
    const found = availableWarehouses.find((w) => w.id === selectedWarehouseId);
    if (found) return found.name;
    return loading ? "Đang xác định..." : "Kho không tồn tại";
  }, [selectedWarehouseId, availableWarehouses, loading]);

  const chartData = useMemo(
    () => [
      { day: "T2", v: 38, fill: "rgba(26,115,232,0.45)" },
      { day: "T3", v: 56, fill: "rgba(26,115,232,0.55)" },
      { day: "T4", v: 48, fill: "rgba(26,115,232,0.5)" },
      { day: "T5", v: 92, fill: "rgba(26,115,232,0.85)" },
      { day: "T6", v: 62, fill: "rgba(26,115,232,0.6)" },
      { day: "T7", v: 74, fill: "rgba(26,115,232,0.7)" },
      { day: "CN", v: 28, fill: "rgba(26,115,232,0.4)" },
    ],
    [],
  );

  const displayActivities: TransactionEntity[] = useMemo(() => {
    if (!activities || activities.length === 0) {
      return [
        {
          id: "t1",
          actorName: "Agent Smith",
          actorTag: "AG",
          actorBg: "bg-primary",
          activityType: "CHU KỲ LẤY HÀNG" as ActivityType,
          activityBg: "bg-sky-100/80",
          activityText: "text-rose-700",
          location: "Dãy B, Ô 14",
          progressPct: 75,
        },
      ];
    }
    return activities.slice(0, 4).map((act, i) => {
      const colors = [
        "bg-primary/80",
        "bg-flow-transfer/80",
        "bg-status-info/80",
        "bg-violet-300/80",
      ];
      const typeText =
        act.type === "INBOUND"
          ? "NHẬP HÀNG"
          : act.type === "OUTBOUND"
            ? "CHU KỲ LẤY HÀNG"
            : "ĐANG BỔ SUNG";
      const tag = act.creator?.full_name
        ? act.creator.full_name.substring(0, 2).toUpperCase()
        : "NV";
      return {
        id: act.id.toString(),
        actorName: act.creator?.full_name || "System Worker",
        actorTag: tag,
        actorBg: colors[i % colors.length],
        activityType: typeText as ActivityType,
        activityBg: "bg-sky-100/80",
        activityText: "text-slate-700",
        location: `Giao dịch ${act.code}`,
        progressPct: 100,
      };
    });
  }, [activities]);

  if (loading && !stats)
    return (
      <div className="p-10 text-center text-slate-600">
        Đang tải DLI (Dashboard Live Intelligence)...
      </div>
    );

  return (
    <div className="min-h-screen bg-surface-app">
      <div className="mx-auto max-w-[1440px] px-6 py-6">
        <div className="flex gap-6">
          {/* ── Sidebar ─────────────────────────────────── */}
          <AppSidebar />

          {/* ── Main Content ───────────────────────────── */}
          <main className="flex-1 min-w-0">
            <Header
              title="Trung Tâm Điều Phối"
              subtitle={
                <>
                  Theo dõi vận hành thời gian thực tại{" "}
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-3 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-sm border border-emerald-100">
                    {currentWarehouseName}
                  </span>
                </>
              }
              showSearch
              actions={{
                secondary: {
                  label: "Chọn Kho",
                  icon: <Home className="w-4 h-4 text-[#F43F5E]" />,
                  color: "#F43F5E",
                  bgColor: "bg-[#FFE4E9]",
                  onClick: () =>
                    setWarehouseModal({ open: true, tab: "select" }),
                },
                primary: {
                  label: "Nhập Kho Mới",
                  icon: <Plus className="w-4 h-4 text-[#10B981]" />,
                  color: "#10B981",
                  bgColor: "bg-[#DCFCE7]",
                  onClick: () =>
                    setWarehouseModal({ open: true, tab: "create" }),
                },
              }}
              userInitials="VT"
            />

            {/* ══════════════════════════════════════════
                ROW 1: Chart (8 cols) + KPI pills (4 cols)
                items-start prevents height stretching → no whitespace
            ══════════════════════════════════════════ */}
            <div className="grid grid-cols-12 gap-5 items-start">
              {/* Ô 1 – Sức Khỏe Kho Hàng */}
              <div className="col-span-12 xl:col-span-8">
                <SurfaceCard>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-[17px] font-semibold tracking-tight text-slate-900 leading-tight">
                        Sức Khỏe Kho Hàng
                      </h2>
                      <p className="text-[12px] text-slate-500 mt-0.5">
                        Chỉ số Lưu lượng &amp; Sức chứa
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-white shadow-apple-sm">
                        LIVE
                      </span>
                      <button
                        type="button"
                        className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600 transition-all active:opacity-80 border border-border-soft"
                      >
                        LAST 24H
                      </button>
                    </div>
                  </div>

                  {/* Jelly Bar Chart */}
                  <div className="mt-5 h-[210px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ left: -10, right: 10, top: 10, bottom: 0 }}
                        barCategoryGap="30%"
                      >
                        <CartesianGrid
                          vertical={false}
                          stroke="rgba(15,23,42,0.05)"
                          strokeDasharray="4 4"
                        />
                        <XAxis
                          dataKey="day"
                          tickLine={false}
                          axisLine={false}
                          tick={{
                            fill: "rgba(100,116,139,1)",
                            fontSize: 11,
                            fontFamily: CHART_FONT,
                          }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          domain={[0, 100]}
                          tickCount={6}
                          tick={{
                            fill: "rgba(148,163,184,1)",
                            fontSize: 10,
                            fontFamily: CHART_FONT,
                          }}
                          tickFormatter={(v: number) => `${v}%`}
                          width={40}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(15,23,42,0.03)" }}
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid #E2E8F0",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                            fontFamily: CHART_FONT,
                            fontSize: 13,
                          }}
                          labelStyle={{
                            fontWeight: 600,
                            color: "rgba(15,23,42,0.92)",
                          }}
                          formatter={(v: unknown) => [`${v}%`, "Lưu lượng"]}
                        />
                        <Bar
                          dataKey="v"
                          shape={<RoundedBar />}
                          radius={[6, 6, 0, 0]}
                        >
                          {chartData.map((d) => (
                            <Cell key={d.day} fill={d.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Stats row */}
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    {[
                      {
                        label: "Hiệu suất",
                        value:
                          healthSpeed?.status === "Good" ? "Tốt" : "Rủi ro",
                        color:
                          healthSpeed?.status === "Good"
                            ? "text-emerald-500"
                            : "text-orange-500",
                      },
                      {
                        label: "Lượt GD/Tuần",
                        value: healthSpeed?.details?.transactions || "0",
                        color: "text-slate-900",
                      },
                      {
                        label: "Tỉ lệ lỗi",
                        value: healthDefect?.value || "0%",
                        color:
                          healthDefect?.status === "Good"
                            ? "text-slate-900"
                            : "text-rose-500",
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-card2 bg-slate-50 border border-border-soft px-4 py-3 text-center shadow-apple-inset"
                      >
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                          {s.label}
                        </p>
                        <p
                          className={`mt-1.5 text-[28px] font-semibold tabular-nums font-mono leading-none ${s.color}`}
                        >
                          {s.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </SurfaceCard>
              </div>

              {/* Ô 3 – KPI Pills (right, stacked vertically) */}
              <div className="col-span-12 xl:col-span-4 flex flex-col gap-5">
                {/* Hàng Đang Về */}
                <div className="rounded-card border border-border-soft bg-white p-5 shadow-apple-md">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-border-soft flex items-center justify-center">
                      <Truck className="w-5 h-5 text-slate-600" />
                    </div>
                    <p className="text-[32px] font-semibold tabular-nums font-mono text-slate-900 leading-none">
                      {stats?.inboundPending ?? "0"}
                    </p>
                  </div>
                  <div className="mt-4">
                    <p className="text-[14px] font-semibold tracking-tight text-slate-900">
                      Hàng Đang Về
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      {stats?.inboundPending > 0
                        ? `Có ${stats.inboundPending} lô hàng đang chờ nhập`
                        : "Hiện không có lô hàng nào đang về"}
                    </p>
                  </div>
                </div>

                {/* Mật độ Lưu trữ */}
                <div className="rounded-card border border-border-soft bg-white p-5 shadow-apple-md">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                      <Warehouse className="w-5 h-5 text-slate-700" />
                    </div>
                    <p className="text-[24px] font-semibold tabular-nums font-mono text-purple-600 leading-none">
                      {stats?.storageDensity?.value || "0%"}
                    </p>
                  </div>
                  <div className="mt-3">
                    <p className="text-[13px] font-semibold tracking-tight text-slate-900">
                      Mật độ Lưu trữ
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {stats?.storageDensity?.details?.density > 90
                        ? "Cảnh báo: Sắp hết sức chứa"
                        : `Sử dụng ${stats?.storageDensity?.details?.totalQuantity || 0}/${stats?.storageDensity?.details?.totalCapacity || 0}`}
                    </p>
                  </div>
                  <div className="mt-3">
                    <ProgressBar
                      value={stats?.storageDensity?.details?.density || 0}
                      colorClass={
                        stats?.storageDensity?.details?.density > 90
                          ? "bg-status-danger"
                          : "bg-purple-400"
                      }
                      height="h-2.5"
                    />
                  </div>
                  <button
                    type="button"
                    aria-label="Tối ưu vị trí lưu trữ"
                    className="mt-3 w-full rounded-full bg-slate-900 text-white text-[12px] font-semibold py-2.5 flex items-center justify-center gap-1.5 transition-all active:opacity-90 shadow-apple-sm"
                  >
                    <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                    Tối ưu Vị trí
                  </button>
                </div>
              </div>
            </div>
            {/* /row1 */}

            {/* ══════════════════════════════════════════
                ROW 2: 3 Product cards equally wide
            ══════════════════════════════════════════ */}
            <div className="grid grid-cols-12 gap-5 mt-5">
              <div className="col-span-12 md:col-span-4">
                <ProductStockCard
                  icon={<Smartphone className="w-5 h-5 text-slate-700" />}
                  iconBg="bg-white/70"
                  title="Điện thoại"
                  sub="Thiết bị di động"
                  progressColor="bg-flow-transfer"
                  progressValue={
                    stats?.categoryStock?.["Điện thoại"]
                      ? (stats.categoryStock["Điện thoại"] / stats.totalStock) *
                        100
                      : 0
                  }
                  stockCount={stats?.categoryStock?.["Điện thoại"] || "0"}
                  soldCount={stats?.categorySold?.["Điện thoại"] || "0"}
                  note="Tồn kho thời gian thực"
                />
              </div>
              <div className="col-span-12 md:col-span-4">
                <ProductStockCard
                  icon={<Box className="w-5 h-5 text-slate-700" />}
                  iconBg="bg-white/70"
                  title="Laptop"
                  sub="Máy tính xách tay"
                  progressColor="bg-primary"
                  progressValue={
                    stats?.categoryStock?.["Laptop"]
                      ? (stats.categoryStock["Laptop"] / stats.totalStock) * 100
                      : 0
                  }
                  stockCount={stats?.categoryStock?.["Laptop"] || "0"}
                  soldCount={stats?.categorySold?.["Laptop"] || "0"}
                  note="Tồn kho thời gian thực"
                />
              </div>
              <div className="col-span-12 md:col-span-4">
                <ProductStockCard
                  icon={<Headphones className="w-5 h-5 text-rose-500" />}
                  iconBg="bg-sky-100"
                  title="Phụ kiện"
                  sub="Tai nghe, ốp lưng,..."
                  progressColor="bg-status-info"
                  progressValue={
                    stats?.categoryStock?.["Phụ kiện"]
                      ? (stats.categoryStock["Phụ kiện"] / stats.totalStock) *
                        100
                      : 0
                  }
                  stockCount={stats?.categoryStock?.["Phụ kiện"] || "0"}
                  soldCount={stats?.categorySold?.["Phụ kiện"] || "0"}
                  note="Tồn kho thời gian thực"
                />
              </div>
            </div>
            {/* /row2 */}

            {/* ══════════════════════════════════════════
                ROW 3: Hoạt Động Đang Diễn Ra
            ══════════════════════════════════════════ */}
            <div className="mt-5">
              <SurfaceCard>
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-[17px] font-semibold tracking-tight text-slate-900">
                    Hoạt Động Đang Diễn Ra
                  </h3>
                  <button className="flex items-center gap-1 text-[13px] font-semibold text-slate-500 hover:text-slate-700 transition-colors">
                    Xem Lịch Sử Giao Dịch
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-5 rounded-card border border-border-soft bg-slate-50 px-5 shadow-apple-inset">
                  {/* Table header */}
                  <div className="grid grid-cols-12 gap-3 pt-4 pb-3 border-b border-border-soft">
                    <div className="col-span-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Nhân sự / Robot
                    </div>
                    <div className="col-span-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Loại hoạt động
                    </div>
                    <div className="col-span-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Vị trí
                    </div>
                    <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Tiến độ
                    </div>
                  </div>
                  <div className="divide-y divide-border-soft">
                    {displayActivities.map((t) => (
                      <TxnRow key={t.id} txn={t} />
                    ))}
                  </div>
                </div>
              </SurfaceCard>
            </div>
            {/* /row3 */}
          </main>
        </div>
      </div>

      <WarehouseModal
        isOpen={warehouseModal.open}
        onClose={() => setWarehouseModal((prev) => ({ ...prev, open: false }))}
        defaultTab={warehouseModal.tab}
      />
    </div>
  );
}
