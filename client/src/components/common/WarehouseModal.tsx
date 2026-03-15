import React, { useState, useEffect } from "react";
import { X, Loader2, Check, Plus, Home, MapPin, Box } from "lucide-react";
import { useWarehouseStore } from "../../store/useWarehouseStore";
import {
  warehouseApiService,
  ApiWarehouse,
} from "../../services/warehouse.service";
import { useAuthStore } from "../../store/useAuthStore";

// Helper
function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

interface WarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "select" | "create";
}

export default function WarehouseModal({
  isOpen,
  onClose,
  defaultTab = "select",
}: WarehouseModalProps) {
  const {
    selectedWarehouseId,
    setWarehouse,
    availableWarehouses,
    setAvailableWarehouses,
  } = useWarehouseStore();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<"select" | "create">(defaultTab);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({ name: "", address: "", capacity: "" });

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab, isOpen]);

  useEffect(() => {
    if (isOpen && activeTab === "select") {
      fetchWarehouses();
    }
  }, [isOpen, activeTab]);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const data = await warehouseApiService.getAllWarehouses();
      setAvailableWarehouses(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      setError("Tên kho là bắt buộc!");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const newWh = await warehouseApiService.createWarehouse({
        name: form.name.trim(),
        address: form.address.trim() || undefined,
        capacity: form.capacity ? parseInt(form.capacity) : undefined,
      });
      // Update store
      setAvailableWarehouses([...availableWarehouses, newWh]);
      setWarehouse(newWh.id);
      setForm({ name: "", address: "", capacity: "" });
      onClose();
    } catch (err: any) {
      setError(err.message || "Lỗi khi tạo kho mới");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(15,23,42,0.35)",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-panel w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[20px] border border-border-soft bg-white flex flex-col shadow-apple-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex bg-slate-100 rounded-full p-1 border border-border-soft">
            <button
              onClick={() => setActiveTab("select")}
              className={cn(
                "px-4 py-1.5 rounded-full text-[13px] font-bold transition-all",
                activeTab === "select"
                  ? "bg-violet-100 text-violet-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              Chọn Kho
            </button>
            {user?.role === "Admin" && (
              <button
                onClick={() => setActiveTab("create")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[13px] font-bold transition-all",
                  activeTab === "create"
                    ? "bg-primary text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                Nhập Kho Mới
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-border-soft flex items-center justify-center transition-all active:opacity-80 hover:bg-slate-50 shadow-apple-sm"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 pt-2 flex flex-col gap-4">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-100 text-red-800 text-[13px] font-semibold rounded-2xl">
              {error}
            </div>
          )}

          {activeTab === "select" ? (
            <div className="flex flex-col gap-3">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : availableWarehouses.length === 0 ? (
                <p className="text-center text-slate-500 text-[13px] font-medium py-10">
                  Bạn chưa có kho nào hoặc không có quyền xem.
                </p>
              ) : (
                <>
                  {user?.role === "Admin" && (
                    <button
                      onClick={() => {
                        setWarehouse(null);
                        onClose();
                      }}
                      className={cn(
                        "text-left flex items-center justify-between px-5 py-4 rounded-2xl transition-all border-2",
                        selectedWarehouseId === null
                          ? "bg-white border-violet-400"
                          : "bg-surface-app border-transparent hover:bg-white",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-slate-700">
                          <Home className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-slate-900">
                            Tất cả chi nhánh
                          </p>
                          <p className="text-[12px] text-slate-500 font-medium">
                            Theo dõi tổng thể
                          </p>
                        </div>
                      </div>
                      {selectedWarehouseId === null && (
                        <Check className="w-5 h-5 text-purple-600" />
                      )}
                    </button>
                  )}
                  {availableWarehouses.map((wh) => (
                    <button
                      key={wh.id}
                      onClick={() => {
                        setWarehouse(wh.id);
                        onClose();
                      }}
                      className={cn(
                        "text-left flex items-center justify-between px-5 py-4 rounded-2xl transition-all border-2",
                        selectedWarehouseId === wh.id
                          ? "bg-white border-primary"
                          : "bg-surface-app border-transparent hover:bg-white",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-slate-700">
                          <Home className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-slate-900">
                            {wh.name}
                          </p>
                          <p className="text-[12px] text-slate-500 font-medium">
                            ID: #{wh.id}
                          </p>
                        </div>
                      </div>
                      {selectedWarehouseId === wh.id && (
                        <Check className="w-5 h-5 text-emerald-600" />
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Tên kho <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ví dụ: Kho Tổng HCM"
                  className="w-full rounded-xl bg-white border border-border-soft px-4 py-3 text-[14px] font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-primary/40 shadow-apple-inset"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Địa chỉ
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    placeholder="Quận 1, TP.HCM..."
                    className="w-full rounded-xl bg-white border border-border-soft pl-11 pr-4 py-3 text-[14px] font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-primary/40 shadow-apple-inset"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Sức chứa (Capacity)
                </label>
                <div className="relative">
                  <Box className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    value={form.capacity}
                    onChange={(e) =>
                      setForm({ ...form, capacity: e.target.value })
                    }
                    placeholder="Ví dụ: 5000"
                    className="w-full rounded-xl bg-white border border-border-soft pl-11 pr-4 py-3 text-[14px] font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-primary/40 shadow-apple-inset"
                  />
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={saving}
                className="mt-4 h-11 w-full rounded-full bg-primary text-[14px] font-bold text-white transition-all active:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 shadow-apple-sm"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Đang tạo..." : "✦ Tạo Kho Mới"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
