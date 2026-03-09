/**
 * WarehouseOperationsHub — Trung tâm vận hành kho (bulk IMEI)
 * ===========================================================
 * Architecture: Container / Presenter separation
 */

import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Coins,
  FileDigit,
  FileSpreadsheet,
  PackagePlus,
  Scan,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  Zap,
  ArrowRightLeft,
} from "lucide-react";
import { useWarehouseStore } from "../../store/useWarehouseStore";
import { productApiService, ApiProduct } from "../../services/product.service";
import {
  transactionApiService,
  InboundPayload,
  OutboundPayload,
} from "../../services/transaction.service";
import { usePartnerStore } from "../../store/usePartnerStore";
import { useEffect } from "react";

// ─────────────────────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────────────────────

export type HubMode = "INBOUND" | "OUTBOUND" | "TRANSFER";

type HubStatus =
  | { kind: "idle" }
  | { kind: "submitting"; progress: number }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

interface Supplier {
  id: number;
  name: string;
}
interface Customer {
  id: number;
  name: string;
}

interface ScannedRow {
  id: string;
  productName: string;
  price: number;
  imei: string;
}

// Removed MOCK arrays in favor of real DB data from usePartnerStore

// ─────────────────────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────────────────────

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function findDuplicates(rows: ScannedRow[]): Set<string> {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const r of rows) {
    if (seen.has(r.imei)) dupes.add(r.imei);
    else seen.add(r.imei);
  }
  return dupes;
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function ModeSwitcher({
  mode,
  onChange,
}: {
  mode: HubMode;
  onChange: (m: HubMode) => void;
}) {
  return (
    <div className="inline-flex gap-1 p-1.5 rounded-full bg-slate-100/80 shadow-apple-inset">
      {(["INBOUND", "OUTBOUND", "TRANSFER"] as HubMode[]).map((m) => {
        const isActive = mode === m;
        const bg = isActive
          ? m === "INBOUND"
            ? "bg-primary"
            : m === "OUTBOUND"
              ? "bg-status-info"
              : "bg-flow-transfer"
          : "bg-transparent";
        const Icon =
          m === "INBOUND"
            ? ArrowDownToLine
            : m === "OUTBOUND"
              ? ArrowUpFromLine
              : ArrowRightLeft;
        const label =
          m === "INBOUND"
            ? "Nhập Kho"
            : m === "OUTBOUND"
              ? "Xuất Kho"
              : "Điều chuyển";
        return (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={cn(
              "relative flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-200 active:scale-[0.98] active:opacity-90",
              bg,
              isActive
                ? "text-white shadow-apple-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function ClaySelect<T extends { id: number; name: string }>({
  label,
  placeholder,
  items,
  value,
  onChange,
  accentColor,
}: {
  label: string;
  placeholder: string;
  items: T[];
  value: number | null;
  onChange: (id: number) => void;
  accentColor: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </label>
      <div className="relative">
        <select
          value={value ?? ""}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full appearance-none rounded-2xl px-4 py-3 text-[14px] font-medium text-slate-700 bg-white outline-none cursor-pointer transition-all border shadow-apple-inset"
          style={{ borderColor: value ? `${accentColor}80` : "#E2E8F0" }}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

function PriceDisplay({
  label,
  value,
  accentColor,
  highlight,
}: {
  label: string;
  value: string;
  accentColor: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 shrink-0">
      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </label>
      <div
        className={cn(
          "rounded-2xl px-4 py-3 text-[14px] font-medium tabular-nums font-mono text-slate-700 bg-white transition-all duration-500 min-h-[48px] flex items-center border shadow-apple-inset",
          highlight && "text-emerald-600 ring-1 ring-emerald-300/40",
        )}
        style={{ borderColor: `${accentColor}80` }}
      >
        {value || "0 ₫"}
      </div>
    </div>
  );
}

function ImeiCounter({
  count,
  hasDuplicates,
}: {
  count: number;
  hasDuplicates: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl px-4 py-2 transition-all border shadow-apple-inset",
        hasDuplicates
          ? "bg-rose-50 border-rose-100"
          : "bg-white border-border-soft",
      )}
    >
      <ScanLine
        className={cn(
          "w-4 h-4",
          hasDuplicates ? "text-rose-400" : "text-slate-400",
        )}
      />
      <span
        className={cn(
          "text-[28px] font-semibold tabular-nums font-mono leading-none",
          hasDuplicates ? "text-red-400" : "text-primary/70",
        )}
      >
        {count}
      </span>
      <span className="text-[11px] text-slate-400 font-semibold leading-tight">
        mã
        <br />
        IMEI
      </span>
      {hasDuplicates && (
        <span className="ml-1 flex items-center gap-1 text-[11px] font-bold text-rose-500">
          <AlertTriangle className="w-3" />
          Trùng!
        </span>
      )}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full rounded-full h-3 overflow-hidden bg-slate-200/90 shadow-apple-inset">
      <div
        className="h-full rounded-full transition-all duration-300 bg-primary"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: HubStatus }) {
  if (status.kind === "idle") return null;
  if (status.kind === "submitting") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-slate-600">
            Đang xử lý giao dịch...
          </span>
          <span className="text-[13px] font-bold text-slate-800">
            {status.progress}%
          </span>
        </div>
        <ProgressBar value={status.progress} />
      </div>
    );
  }
  if (status.kind === "success") {
    return (
      <div className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-emerald-50 border border-emerald-100 shadow-apple-sm">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <span className="text-[13px] font-semibold text-emerald-700">
          {status.message}
        </span>
      </div>
    );
  }
  if (status.kind === "error") {
    return (
      <div className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-rose-50 border border-rose-100 shadow-apple-sm">
        <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
        <span className="text-[13px] font-semibold text-rose-600">
          {status.message}
        </span>
      </div>
    );
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// HubPresenter — Pure Rendering Component
// ─────────────────────────────────────────────────────────────

interface HubPresenterProps {
  mode: HubMode;
  warehouseName: string;
  rows: ScannedRow[];
  duplicates: Set<string>;
  status: HubStatus;
  selectedSupplierId: number | null;
  selectedCustomerId: number | null;
  selectedDestWarehouseId: number | null;
  availableDestWarehouses: any[];
  suppliers: any[];
  customers: any[];
  totalValue: string;
  onModeChange: (m: HubMode) => void;
  onSupplierChange: (id: number) => void;
  onCustomerChange: (id: number) => void;
  onDestWarehouseChange: (id: number) => void;
  onConfirm: () => void;
  onClear: () => void;
  isShaking: boolean;
  onFileUpload: (file: File) => void;
  onRemoveRow: (id: string) => void;
}

function HubPresenter({
  mode,
  warehouseName,
  rows,
  duplicates,
  status,
  selectedSupplierId,
  selectedCustomerId,
  selectedDestWarehouseId,
  availableDestWarehouses,
  suppliers,
  customers,
  totalValue,
  onModeChange,
  onSupplierChange,
  onCustomerChange,
  onDestWarehouseChange,
  onConfirm,
  onClear,
  isShaking,
  onFileUpload,
  onRemoveRow,
}: HubPresenterProps) {
  const isInbound = mode === "INBOUND";
  const isOutbound = mode === "OUTBOUND";
  const isTransfer = mode === "TRANSFER";
  const accentColor = isInbound
    ? "#1A73E8"
    : isOutbound
      ? "#0EA5E9"
      : "#8B5CF6";
  const accentBg = isInbound
    ? "bg-primary"
    : isOutbound
      ? "bg-status-info"
      : "bg-flow-transfer";
  const ModeIcon = isInbound
    ? PackagePlus
    : isOutbound
      ? ClipboardList
      : ArrowRightLeft;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasDuplicates = duplicates.size > 0;
  const imeiCount = rows.length;
  const isReady =
    imeiCount > 0 &&
    !hasDuplicates &&
    (isInbound
      ? !!selectedSupplierId
      : isOutbound
        ? !!selectedCustomerId
        : !!selectedDestWarehouseId) &&
    status.kind !== "submitting";

  return (
    <div
      className="relative flex flex-col gap-6 rounded-2xl p-6 bg-white transition-all duration-300 border border-border-soft shadow-apple-md w-full max-w-[1120px] mx-auto"
      style={{ borderColor: `${accentColor}33` }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-apple-sm",
              accentBg,
            )}
          >
            <ModeIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Trung Tâm Vận Hành
            </p>
            <h2 className="text-[20px] font-semibold tracking-tight text-slate-900 leading-snug">
              {warehouseName}
            </h2>
          </div>
        </div>
        <ModeSwitcher mode={mode} onChange={onModeChange} />
      </div>

      <div className="h-px w-full bg-border-soft" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isInbound && (
          <>
            <ClaySelect
              label="Nhà cung cấp"
              placeholder="— Chọn nhà cung cấp —"
              items={suppliers.map((s) => ({
                id: s.id,
                name: s.company_name || s.name || "",
              }))}
              value={selectedSupplierId}
              onChange={onSupplierChange}
              accentColor={accentColor}
            />
            <PriceDisplay
              label="Tổng tiền nhập kho (₫)"
              value={totalValue}
              accentColor={accentColor}
              highlight={imeiCount > 0}
            />
          </>
        )}
        {isOutbound && (
          <>
            <ClaySelect
              label="Khách hàng"
              placeholder="— Chọn khách hàng —"
              items={customers.map((c) => ({
                id: c.id,
                name: c.full_name || c.name || "",
              }))}
              value={selectedCustomerId}
              onChange={onCustomerChange}
              accentColor={accentColor}
            />
            <PriceDisplay
              label="Tổng tiền xuất kho (₫)"
              value={totalValue}
              accentColor={accentColor}
              highlight={imeiCount > 0}
            />
          </>
        )}
        {isTransfer && (
          <>
            <ClaySelect
              label="Kho đích"
              placeholder="— Chọn kho đích —"
              items={availableDestWarehouses}
              value={selectedDestWarehouseId}
              onChange={onDestWarehouseChange}
              accentColor={accentColor}
            />
            <PriceDisplay
              label="Tổng số lượng (IMEI)"
              value={`${imeiCount}`}
              accentColor={accentColor}
              highlight={imeiCount > 0}
            />
          </>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Coins className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Danh Mục Đối Soát Dữ Liệu
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ImeiCounter count={imeiCount} hasDuplicates={hasDuplicates} />
            {imeiCount > 0 && (
              <button
                onClick={onClear}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-slate-100 transition-all active:scale-[0.98] border border-border-soft bg-white shadow-apple-sm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div
          className={cn(
            "relative rounded-xl overflow-hidden group transition-all duration-300 bg-slate-50 border h-[340px] shadow-apple-inset",
            isShaking && "animate-shake",
            imeiCount > 0 &&
              (isInbound
                ? "border-blue-200"
                : isOutbound
                  ? "border-sky-200"
                  : "border-violet-200"),
            !imeiCount && "border-border-soft",
          )}
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity animate-scan-fast z-30" />

          <div className="h-full overflow-y-auto p-4 pt-12 custom-scrollbar">
            {imeiCount === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
                <div className="w-16 h-16 rounded-3xl bg-slate-200 flex items-center justify-center">
                  <FileDigit className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-[13px] font-medium text-slate-400 text-center">
                  Sẵn sàng nhập dữ liệu.
                  <br />
                  Vui lòng chọn nút "NHẬP FILE" phía trên.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-4 pb-2">Model Sản Phẩm</th>
                    <th className="px-4 pb-2">Giá Đơn Vị</th>
                    <th className="px-4 pb-2">Mã IMEI / Serial</th>
                    <th className="px-4 pb-2 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="text-[13px]">
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="group/row animate-in fade-in slide-in-from-left-2 duration-300"
                    >
                      <td className="bg-white/40 rounded-l-2xl px-4 py-3 font-bold text-slate-700">
                        {row.productName}
                      </td>
                      <td className="bg-white/40 px-4 py-3 font-mono font-bold text-slate-600">
                        {row.price.toLocaleString()} ₫
                      </td>
                      <td className="bg-white/40 px-4 py-3 font-mono text-slate-500">
                        <span
                          className={cn(
                            duplicates.has(row.imei)
                              ? "text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded-lg"
                              : "",
                          )}
                        >
                          {row.imei}
                        </span>
                      </td>
                      <td className="bg-white/40 rounded-r-2xl px-4 py-3 text-right">
                        <button
                          onClick={() => onRemoveRow(row.id)}
                          className="opacity-0 group-hover/row:opacity-100 p-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-500 transition-all text-slate-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="absolute top-4 right-6 z-20 flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              hidden
              accept=".csv,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFileUpload(file);
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-[12px] font-bold text-white hover:opacity-90 active:scale-[0.98] transition-all shadow-apple-md"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              NHẬP FILE CSV
            </button>
          </div>
          <div className="absolute top-5 left-6 pointer-events-none opacity-20">
            <Scan className="w-5 h-5 text-slate-600" />
          </div>

          {imeiCount > 0 && !hasDuplicates && (
            <div className="absolute bottom-5 right-6 flex items-center gap-1.5 rounded-full px-4 py-1.5 z-20 bg-white/95 backdrop-blur-sm border border-border-soft shadow-apple-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-[11px] font-bold text-slate-700">
                Digital Verified
              </span>
            </div>
          )}
        </div>
      </div>

      <StatusBadge status={status} />

      <button
        onClick={onConfirm}
        disabled={!isReady}
        className={cn(
          "relative w-full rounded-full py-4 flex items-center justify-center gap-2.5",
          "text-[15px] font-bold text-white",
          "transition-all duration-200 active:scale-[0.98] disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed",
          accentBg,
          isReady && "shadow-apple-md hover:opacity-95",
        )}
      >
        {status.kind === "submitting" ? (
          <>
            <Sparkles className="w-5 h-5 animate-spin" />
            Vạn vật đang đồng bộ...
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            {isInbound
              ? `Khai báo Bulk Inbound (${imeiCount})`
              : isOutbound
                ? `Xác nhận Bulk Outbound (${imeiCount})`
                : `Thực hiện Điều chuyển (${imeiCount})`}
          </>
        )}
      </button>

      <div
        className="absolute top-5 right-5 w-3 h-3 rounded-full opacity-60 animate-pulse"
        style={{ background: accentColor }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// WarehouseOperationsHub — Container
// ─────────────────────────────────────────────────────────────

export default function WarehouseOperationsHub() {
  const { selectedWarehouseId, availableWarehouses } = useWarehouseStore();
  const { suppliers, customers, fetchPartners } = usePartnerStore();
  const warehouseName = useMemo(() => {
    if (!selectedWarehouseId) return "Chưa chọn kho";
    return (
      availableWarehouses.find((w) => w.id === selectedWarehouseId)?.name ??
      "Kho không tồn tại"
    );
  }, [selectedWarehouseId, availableWarehouses]);

  const [mode, setMode] = useState<HubMode>("INBOUND");
  const [rows, setRows] = useState<ScannedRow[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(
    null,
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null,
  );
  const [selectedDestWarehouseId, setSelectedDestWarehouseId] = useState<
    number | null
  >(null);
  const [status, setStatus] = useState<HubStatus>({ kind: "idle" });
  const [isShaking, setIsShaking] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<ApiProduct[]>([]);
  const [realSuppliers, setRealSuppliers] = useState<Supplier[]>([]);

  // Load master data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsRes, options] = await Promise.all([
          productApiService.getProducts({ page: 1, limit: 1000 }), // Get all models
          productApiService.getFormOptions(),
        ]);
        setAvailableProducts(productsRes.data);
      } catch (err) {
        console.error("Failed to load master data", err);
      }
    };
    loadData();
    fetchPartners(); // fetch real suppliers and customers
  }, []);

  const duplicates = useMemo(() => findDuplicates(rows), [rows]);
  const imeiCount = rows.length;

  const totalValueRaw = useMemo(() => {
    return rows.reduce((sum, r) => sum + r.price, 0);
  }, [rows]);

  const totalValueFormatted = useMemo(() => {
    if (totalValueRaw === 0) return "0 ₫";
    return totalValueRaw.toLocaleString() + " ₫";
  }, [totalValueRaw]);

  const handleModeChange = useCallback((m: HubMode) => {
    setMode(m);
    setRows([]);
    setSelectedSupplierId(null);
    setSelectedCustomerId(null);
    setSelectedDestWarehouseId(null);
    setStatus({ kind: "idle" });
    setIsShaking(false);
  }, []);

  const simulateSubmit = useCallback(() => {
    setStatus({ kind: "submitting", progress: 0 });
    let prog = 0;
    const timer = setInterval(() => {
      prog += Math.random() * 22 + 8;
      if (prog >= 100) {
        const verb = mode === "INBOUND" ? "Nhập" : "Xuất";
        clearInterval(timer);
        setStatus({
          kind: "success",
          message: `${verb} kho thành công! Tổng trị giá ${totalValueFormatted} đã được ghi nhận.`,
        });
        setTimeout(() => {
          setRows([]);
          setStatus({ kind: "idle" });
        }, 3000);
      } else {
        setStatus({
          kind: "submitting",
          progress: Math.min(Math.round(prog), 99),
        });
      }
    }, 200);
  }, [totalValueFormatted, mode]);

  const handleConfirm = async () => {
    if (!selectedWarehouseId) {
      setStatus({
        kind: "error",
        message: "Vui lòng chọn kho trước khi thực hiện.",
      });
      return;
    }
    if (imeiCount === 0) {
      setStatus({ kind: "error", message: "Chưa có dữ liệu để xử lý." });
      return;
    }
    if (duplicates.size > 0) {
      setStatus({
        kind: "error",
        message: "Vui lòng xóa các mã IMEI bị trùng.",
      });
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
      return;
    }

    setStatus({ kind: "submitting", progress: 10 });

    try {
      // Group rows by product to match backend structure
      const groupedItems = rows.reduce((acc: any, row) => {
        // Try to find real productId by name match
        const matchingProduct = availableProducts.find(
          (p) =>
            p.name.toLowerCase() === row.productName.toLowerCase() ||
            p.sku.toLowerCase() === row.productName.toLowerCase(), // sometimes name is SKU in CSV
        );

        if (!matchingProduct) {
          throw new Error(
            `Sản phẩm "${row.productName}" không tồn tại trong hệ thống. Hãy đăng ký nó trước.`,
          );
        }

        const pId = matchingProduct.id;
        if (!acc[pId]) {
          acc[pId] = { productId: pId, price: row.price, imeiList: [] };
        }
        acc[pId].imeiList.push(row.imei);
        return acc;
      }, {});

      const itemsArray = Object.values(groupedItems);
      setStatus({ kind: "submitting", progress: 40 });

      if (mode === "INBOUND") {
        if (!selectedSupplierId) {
          setStatus({ kind: "error", message: "Vui lòng chọn nhà cung cấp." });
          return;
        }
        const payload: InboundPayload = {
          supplierId: selectedSupplierId,
          warehouseId: selectedWarehouseId,
          notes: `Nhập kho lô hàng ${imeiCount} sản phẩm từ UI Hub`,
          items: itemsArray.map((i: any) => ({
            productId: i.productId,
            unitPrice: i.price,
            imeiList: i.imeiList,
          })),
        };
        await transactionApiService.createInbound(payload);
      } else if (mode === "OUTBOUND") {
        if (!selectedCustomerId) {
          setStatus({ kind: "error", message: "Vui lòng chọn khách hàng." });
          return;
        }
        const payload: OutboundPayload = {
          customerId: selectedCustomerId,
          warehouseId: selectedWarehouseId,
          notes: `Xuất kho lô hàng ${imeiCount} sản phẩm cho khách`,
          items: itemsArray.map((i: any) => ({
            productId: i.productId,
            sellingPrice: i.price,
            imeiList: i.imeiList,
          })),
        };
        await transactionApiService.createOutbound(payload);
      } else if (mode === "TRANSFER") {
        if (!selectedDestWarehouseId) {
          setStatus({ kind: "error", message: "Vui lòng chọn kho đích." });
          return;
        }
        const payload = {
          sourceWarehouseId: selectedWarehouseId,
          destWarehouseId: selectedDestWarehouseId,
          notes: `Điều chuyển ${imeiCount} sản phẩm từ kho #${selectedWarehouseId} sang kho #${selectedDestWarehouseId}`,
          items: itemsArray.map((i: any) => ({
            productId: i.productId,
            imeiList: i.imeiList,
          })),
        };
        await transactionApiService.createTransfer(payload);
      }

      setStatus({ kind: "submitting", progress: 100 });
      setStatus({
        kind: "success",
        message: `${mode === "INBOUND" ? "Nhập" : mode === "OUTBOUND" ? "Xuất" : "Điều chuyển"} kho thành công! Dữ liệu đã được lưu vào hệ thống.`,
      });
      setTimeout(() => {
        setRows([]);
        setStatus({ kind: "idle" });
      }, 3000);
    } catch (err: any) {
      setStatus({
        kind: "error",
        message: err.message || "Có lỗi xảy ra khi xử lý giao dịch.",
      });
    }
  };

  const handleClear = useCallback(() => {
    setRows([]);
    setStatus({ kind: "idle" });
    setIsShaking(false);
  }, []);

  const handleRemoveRow = useCallback((id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <HubPresenter
      mode={mode}
      warehouseName={warehouseName}
      rows={rows}
      duplicates={duplicates}
      status={status}
      selectedSupplierId={selectedSupplierId}
      selectedCustomerId={selectedCustomerId}
      selectedDestWarehouseId={selectedDestWarehouseId}
      availableDestWarehouses={availableWarehouses.filter(
        (w) => w.id !== selectedWarehouseId,
      )}
      suppliers={suppliers}
      customers={customers}
      totalValue={totalValueFormatted}
      onModeChange={handleModeChange}
      onSupplierChange={setSelectedSupplierId}
      onCustomerChange={setSelectedCustomerId}
      onDestWarehouseChange={setSelectedDestWarehouseId}
      onConfirm={handleConfirm}
      onClear={handleClear}
      isShaking={isShaking}
      onRemoveRow={handleRemoveRow}
      onFileUpload={(file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          const csvRows = content
            .split(/\r?\n/)
            .map((r) => r.split(",").map((c) => c.trim()))
            .filter((r) => r.length > 0 && r[0] !== "");
          if (csvRows.length === 0) return;

          const header = csvRows[0].map((h) => h.toLowerCase());
          const nameIdx = header.findIndex(
            (h) => h.includes("name") || h.includes("tên"),
          );
          const priceIdx = header.findIndex(
            (h) => h.includes("price") || h.includes("giá"),
          );
          const imeiIdx = header.findIndex(
            (h) =>
              h.includes("imei") ||
              h.includes("serial") ||
              h.includes("sample"),
          );

          const tNameIdx = nameIdx !== -1 ? nameIdx : 0;
          const tPriceIdx = priceIdx !== -1 ? priceIdx : 3;
          const tImeiIdx = imeiIdx !== -1 ? imeiIdx : csvRows[0].length - 1;

          const newScannedRows: ScannedRow[] = [];

          csvRows.forEach((row, idx) => {
            const isHeader = row.some((cell) => {
              const c = cell.toLowerCase();
              return (
                c === "imei" ||
                c === "sku" ||
                c === "price" ||
                c === "tên sản phẩm" ||
                c === "product name"
              );
            });
            if (isHeader && idx === 0) return;

            const name = row[tNameIdx] || "Sản phẩm không tên";
            const price = parseInt(
              row[tPriceIdx]?.replace(/\D/g, "") || "0",
              10,
            );
            const imei = row[tImeiIdx];

            if (imei) {
              newScannedRows.push({
                id: Math.random().toString(36).substr(2, 9),
                productName: name,
                price: price,
                imei: imei,
              });
            }
          });

          setRows((prev) => [...prev, ...newScannedRows]);
          if (newScannedRows.some((r) => duplicates.has(r.imei))) {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 600);
          }
        };
        reader.readAsText(file);
      }}
    />
  );
}
