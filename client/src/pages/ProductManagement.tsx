/**
 * PRODUCT MANAGEMENT PAGE
 * ========================
 * Refactored với đầy đủ Design Patterns:
 *
 * - Container/Presenter Pattern (H2): ProductManagementPage (Container) vs ProductManagementView (Presenter)
 * - Compound Component Pattern (S2): Modal.Header / Modal.Body / Modal.Footer
 * - Custom Hooks (S3): useProducts + useProductStats thay vì inline fetching
 * - Zustand State (S1): useWarehouseStore cho Warehouse Selector toàn app
 * - Strategy Pattern: SPEC_FIELDS, mapApiProductToUI
 * - Inner Shadow CSS Guideline (H4): inset 8px 8px 12px rgba(255,255,255,0.5), inset -8px -8px 12px rgba(0,0,0,0.05)
 */

import React, { useState, useMemo, useEffect, useCallback, createContext, useContext } from 'react'
import { 
  Plus, Search, Filter, Box, AlertCircle, Edit2, Trash2, Home, BarChart2, CheckCircle2, 
  Package, X, ChevronRight, Download, Eye, 
  Smartphone, Camera, Headphones, Loader, Battery, Monitor, Cpu, ChevronDown, 
  Check, Zap, ArrowDownToLine, Printer, ScanLine, HardDrive, Tag, Laptop, Edit3, Loader2, RefreshCw 
} from 'lucide-react'

import Header from '../components/common/Header'
import AppSidebar from '../components/common/AppSidebar'

import {
  productApiService,
  ApiProduct, ApiProductStats, FormOptions,
  CreateProductPayload,
} from '../services/product.service'
import { useProducts } from '../hooks/useProducts'
import { useProductStats } from '../hooks/useProductStats'
import { useWarehouseStore } from '../store/useWarehouseStore'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type CategoryFilter = 'Tất cả' | 'Điện thoại' | 'Laptop' | 'Phụ kiện'
type StockStatus = 'READY_TO_SELL' | 'DEFECTIVE' | 'IN_TRANSIT'

interface ProductSpec {
  [key: string]: string
}

/** UI Product shape (mapped từ ApiProduct) */
interface UIProduct {
  id: number
  name: string
  sku: string
  category: string
  status: StockStatus
  quantity: number
  specs: ProductSpec
  iconType: 'phone' | 'laptop' | 'accessory'
  iconColor: string
  cardBg: string
  categoryId: number | null
  imageUrl: string | null
}

interface ModalForm {
  name: string
  sku: string
  category_id: number
  image_url: string
  // warehouse_id và supplier_id đã được loại bỏ.
  // Model là Master Data, Supplier sẽ được chọn khi Nhập kho.
  specs: ProductSpec
}

interface ModalState {
  open: boolean
  mode: 'add' | 'edit'
  productId: number | null
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

function getTotalQuantity(inventory: ApiProduct['inventory']): number {
  return inventory
    .filter((inv) => inv.status === 'READY_TO_SELL')
    .reduce((sum, inv) => sum + inv.quantity, 0)
}

function getPrimaryStatus(inventory: ApiProduct['inventory']): StockStatus {
  if (inventory.length === 0) return 'READY_TO_SELL'
  if (inventory.some((inv) => inv.status === 'READY_TO_SELL')) return 'READY_TO_SELL'
  if (inventory.some((inv) => inv.status === 'IN_TRANSIT')) return 'IN_TRANSIT'
  return 'DEFECTIVE'
}

/** Factory Method Pattern (Frontend): mapApiProductToUI */
function mapApiProductToUI(p: ApiProduct): UIProduct {
  const categoryName = p.category?.name ?? 'Unknown'

  const iconTypeMap: Record<string, UIProduct['iconType']> = {
    'Điện thoại': 'phone',
    'Phone': 'phone',
    'Laptop': 'laptop',
    'Phụ kiện': 'accessory',
    'Accessory': 'accessory',
  }

  const cardBgMap: Record<string, string> = {
    'Điện thoại': 'bg-sky-50',
    'Phone': 'bg-sky-50',
    'Laptop': 'bg-primary/10',
    'Phụ kiện': 'bg-violet-50',
    'Accessory': 'bg-violet-50',
  }

  const iconColorMap: Record<string, string> = {
    'Điện thoại': 'text-rose-500',
    'Laptop': 'text-slate-700',
    'Phụ kiện': 'text-violet-600',
  }

  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: categoryName,
    status: getPrimaryStatus(p.inventory),
    quantity: getTotalQuantity(p.inventory),
    specs: (p.specifications as ProductSpec) ?? {},
    iconType: iconTypeMap[categoryName] ?? 'accessory',
    iconColor: iconColorMap[categoryName] ?? 'text-slate-600',
    cardBg: cardBgMap[categoryName] ?? 'bg-slate-100',
    categoryId: p.category?.id ?? null,
    imageUrl: p.image_url,
  }
}

// ─────────────────────────────────────────────
// Strategy Pattern (Frontend): Spec field renderers
// ─────────────────────────────────────────────
interface SpecFieldDef {
  key: string
  label: string
  icon: React.ReactNode
  placeholder: string
}

const SPEC_FIELDS: Record<string, SpecFieldDef[]> = {
  'Điện thoại': [
    { key: 'display', label: 'Màn hình', icon: <Monitor className="w-3 h-3" />, placeholder: '6.7\" Super AMOLED' },
    { key: 'os', label: 'Hệ điều hành', icon: <Cpu className="w-3 h-3" />, placeholder: 'Android 14 / iOS 17' },
    { key: 'camera', label: 'Camera', icon: <ScanLine className="w-3 h-3" />, placeholder: '200MP + 10MP + 12MP' },
    { key: 'chip', label: 'Chip / CPU', icon: <Cpu className="w-3 h-3" />, placeholder: 'Snapdragon 8 Gen 3' },
    { key: 'ram', label: 'RAM', icon: <HardDrive className="w-3 h-3" />, placeholder: '12 GB' },
    { key: 'battery', label: 'Dung lượng Pin', icon: <Battery className="w-3 h-3" />, placeholder: '5000 mAh' },
    { key: 'storage', label: 'Bộ nhớ trong', icon: <HardDrive className="w-3 h-3" />, placeholder: '256 GB' },
  ],
  'Laptop': [
    { key: 'cpu', label: 'CPU', icon: <Cpu className="w-3 h-3" />, placeholder: 'Intel Core i9-13900H' },
    { key: 'ram', label: 'RAM', icon: <HardDrive className="w-3 h-3" />, placeholder: '32 GB DDR5' },
    { key: 'storage', label: 'Ổ cứng', icon: <HardDrive className="w-3 h-3" />, placeholder: '1 TB SSD NVMe' },
    { key: 'vga', label: 'VGA / GPU', icon: <Monitor className="w-3 h-3" />, placeholder: 'RTX 4070 8GB' },
    { key: 'ports', label: 'Cổng kết nối', icon: <Tag className="w-3 h-3" />, placeholder: 'USB-C, HDMI, SD Card' },
    { key: 'display', label: 'Màn hình', icon: <Monitor className="w-3 h-3" />, placeholder: '15.6\" 2K 165Hz' },
  ],
  'Phụ kiện': [
    { key: 'type', label: 'Loại phụ kiện', icon: <Tag className="w-3 h-3" />, placeholder: 'Tai nghe / Ốp lưng...' },
    { key: 'compatibility', label: 'Thiết bị tương thích', icon: <ScanLine className="w-3 h-3" />, placeholder: 'iPhone 15, Samsung S24' },
    { key: 'color', label: 'Màu sắc', icon: <Tag className="w-3 h-3" />, placeholder: 'Trắng sứ' },
    { key: 'material', label: 'Chất liệu', icon: <Tag className="w-3 h-3" />, placeholder: 'Nhôm / Silicone / Nhựa ABS' },
    { key: 'battery', label: 'Thời lượng Pin', icon: <Battery className="w-3 h-3" />, placeholder: '30h (có hộp sạc)' },
  ],
}

const CARD_SPEC_KEYS: Record<string, string[]> = {
  'Điện thoại': ['chip', 'ram', 'battery', 'storage'],
  'Laptop': ['cpu', 'ram', 'vga', 'storage'],
  'Phụ kiện': ['type', 'compatibility', 'color'],
}

// ─────────────────────────────────────────────
// Product Icon
// ─────────────────────────────────────────────
function ProductIcon({ type, className }: { type: UIProduct['iconType']; className?: string }) {
  const base = cn('w-14 h-14', className)
  if (type === 'phone') return <Smartphone className={base} strokeWidth={1.4} />
  if (type === 'laptop') return <Laptop className={base} strokeWidth={1.4} />
  return <Headphones className={base} strokeWidth={1.4} />
}

// ─────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────
function StatusBadge({ status }: { status: StockStatus }) {
  const map: Record<StockStatus, { label: string; cls: string }> = {
    READY_TO_SELL: { label: '✦ Sẵn sàng bán', cls: 'bg-emerald-50 text-emerald-800 border border-emerald-100' },
    DEFECTIVE: { label: '✕ Hỏng hóc', cls: 'bg-red-50 text-red-800 border border-red-100' },
    IN_TRANSIT: { label: '→ Đang luân chuyển', cls: 'bg-violet-50 text-violet-800 border border-violet-100' },
  }
  const { label, cls } = map[status]
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide border border-border-soft/60', cls)}>
      {label}
    </span>
  )
}

// ─────────────────────────────────────────────
// Spec Tag
// ─────────────────────────────────────────────
function SpecTag({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-semibold text-slate-700 border border-border-soft/50', color)}>
      {icon}
      <span className="opacity-60">{label}:</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}

// ─────────────────────────────────────────────
// Product Card
// ─────────────────────────────────────────────
function ProductCard({ product, onEdit, onDelete }: {
  product: UIProduct
  onEdit: (p: UIProduct) => void
  onDelete: (id: number) => void
}) {
  const specColors = ['bg-primary/15', 'bg-violet-100', 'bg-sky-100', 'bg-slate-200', 'bg-amber-100']
  const cardSpecKeys = CARD_SPEC_KEYS[product.category] ?? []
  const specEntries = cardSpecKeys
    .map((key) => ({ key, value: product.specs[key] }))
    .filter((e) => e.value)

  const fieldDefs = SPEC_FIELDS[product.category] ?? []
  const getLabel = (key: string) => fieldDefs.find((f) => f.key === key)?.label ?? key.toUpperCase()

  return (
    <div
      className={cn('apple-product-card rounded-card border border-border-soft p-5 flex flex-col gap-4 relative overflow-hidden group bg-white shadow-apple-md', product.cardBg)}
    >
      <div className="absolute top-4 right-4 flex gap-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          type="button"
          onClick={() => onEdit(product)}
          className="w-7 h-7 rounded-full bg-white border border-border-soft flex items-center justify-center transition-all active:opacity-80 hover:bg-slate-50 shadow-apple-sm"
          title="Sửa"
        >
          <Edit3 className="w-3.5 h-3.5 text-slate-600" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(product.id)}
          className="w-7 h-7 rounded-full bg-red-50 border border-red-100 flex items-center justify-center transition-all active:opacity-80 shadow-apple-sm"
          title="Xóa"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-700" />
        </button>
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="w-[72px] h-[72px] rounded-xl bg-slate-50 border border-border-soft flex items-center justify-center shrink-0">
          <ProductIcon type={product.iconType} className={product.iconColor} />
        </div>

        <div className="flex flex-col gap-1 items-end flex-1 pt-1">
          {specEntries.slice(0, 3).map((e, i) => (
            <SpecTag
              key={e.key}
              icon={<Tag className="w-2.5 h-2.5" />}
              label={getLabel(e.key)}
              value={e.value}
              color={specColors[i % specColors.length]}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-[15px] font-semibold tracking-tight text-slate-900 leading-snug line-clamp-2">{product.name}</p>
        <p className="text-[11px] text-slate-500 mt-0.5 font-mono tracking-wide">SKU: {product.sku}</p>
      </div>

      {specEntries.length > 3 && (
        <div className="flex flex-wrap gap-1.5">
          {specEntries.slice(3).map((e, i) => (
            <SpecTag
              key={e.key}
              icon={<Tag className="w-2.5 h-2.5" />}
              label={getLabel(e.key)}
              value={e.value}
              color={specColors[(i + 3) % specColors.length]}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-auto">
        <StatusBadge status={product.status} />
        <div className="text-right">
          <p className="text-[10px] text-slate-500">{product.quantity} đơn vị</p>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon, loading }: {
  label: string; value: number | string; sub: string; color: string; icon: React.ReactNode; loading?: boolean
}) {
  return (
    <div className={cn('rounded-card border border-border-soft p-5 flex flex-col gap-3 bg-white shadow-apple-md', color)}>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-border-soft flex items-center justify-center">
          {icon}
        </div>
        {loading ? (
          <Loader2 className="w-7 h-7 text-slate-400 animate-spin" />
        ) : (
          <p className="text-[30px] font-semibold tabular-nums font-mono text-slate-900 leading-none">{value}</p>
        )}
      </div>
      <div>
        <p className="text-[14px] font-semibold tracking-tight text-slate-900">{label}</p>
        <p className="text-[11px] text-slate-600 mt-0.5 font-normal leading-relaxed">{sub}</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Filter Pill
// ─────────────────────────────────────────────
function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-9 rounded-full px-5 text-[13px] font-semibold transition-all border border-border-soft active:opacity-90 active:scale-[0.98]',
        active ? 'bg-slate-900 text-white shadow-apple-sm' : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-apple-sm',
      )}
    >
      {label}
    </button>
  )
}

// ─────────────────────────────────────────────
// H4 Fix: Clay Input — Inner Shadow theo Guideline
// Guideline: inset 8px 8px 12px rgba(255,255,255,0.5), inset -8px -8px 12px rgba(0,0,0,0.05)
// ─────────────────────────────────────────────

function ClayInput({ label, value, onChange, placeholder, type = 'text', required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl bg-white border border-border-soft px-4 py-3 text-[14px] font-normal text-slate-800 outline-none placeholder:text-slate-500 transition-shadow focus:ring-2 focus:ring-primary/40 shadow-apple-inset"
      />
    </div>
  )
}

// ─────────────────────────────────────────────
// Clay Select
// ─────────────────────────────────────────────
function ClaySelect<T extends string | number>({ label, value, onChange, options, required }: {
  label: string; value: T; onChange: (v: T) => void;
  options: { value: T; label: string }[]; required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      <div className="relative group">
        <select
          value={String(value)}
          onChange={(e) => {
            const raw = e.target.value
            onChange((typeof value === 'number' ? Number(raw) : raw) as T)
          }}
          className="w-full rounded-xl bg-white border border-border-soft px-4 py-3 text-[14px] font-normal text-slate-800 outline-none appearance-none cursor-pointer transition-all focus:ring-2 focus:ring-primary/40 pr-10 hover:bg-slate-50 shadow-apple-inset"
        >
          {options.map((o) => (
            <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-slate-600 transition-colors">
          <ChevronDown size={16} />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// S2: Compound Component Pattern — Modal
// Usage:
//   <Modal onClose={...} saving={...}>
//     <Modal.Header title="Thêm Sản Phẩm" />
//     <Modal.Body>...</Modal.Body>
//     <Modal.Footer onSave={...} onClose={...} />
//   </Modal>
// ─────────────────────────────────────────────
interface ModalContextValue {
  onClose: () => void
  saving: boolean
}
const ModalContext = createContext<ModalContextValue>({ onClose: () => {}, saving: false })

interface ModalComposition {
  Header: typeof ModalHeader
  Body: typeof ModalBody
  Footer: typeof ModalFooter
}

function Modal({ children, onClose, saving }: {
  children: React.ReactNode
  onClose: () => void
  saving: boolean
}) {
  return (
    <ModalContext.Provider value={{ onClose, saving }}>
      <div
        className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(6px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <div
          className="modal-panel w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[20px] border border-border-soft bg-white shadow-apple-lg"
        >
          {children}
        </div>
      </div>
    </ModalContext.Provider>
  )
}

function ModalHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { onClose } = useContext(ModalContext)
  return (
    <div className="flex items-center justify-between p-6 pb-0">
      <div>
        {subtitle && <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{subtitle}</p>}
        <h2 className="text-[20px] font-semibold tracking-tight text-slate-900">{title}</h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-9 h-9 rounded-full bg-white border border-border-soft flex items-center justify-center transition-all active:opacity-80 hover:bg-slate-50 shadow-apple-sm"
      >
        <X className="w-4 h-4 text-slate-600" />
      </button>
    </div>
  )
}

function ModalBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6 flex flex-col gap-4">
      {children}
    </div>
  )
}

function ModalFooter({ onSave, saveLabel = '✦ Thêm sản phẩm', cancelLabel = 'Hủy bỏ' }: {
  onSave: () => void
  saveLabel?: string
  cancelLabel?: string
}) {
  const { onClose, saving } = useContext(ModalContext)
  return (
    <div className="flex gap-3 px-6 pb-6">
      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        className="flex-1 h-11 rounded-full bg-white border border-border-soft text-[14px] font-semibold text-slate-600 transition-all active:opacity-80 hover:bg-slate-50 disabled:opacity-50 shadow-apple-sm"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="flex-1 h-11 rounded-full bg-primary text-[14px] font-bold text-white transition-all active:opacity-90 hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2 shadow-apple-sm"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {saving ? 'Đang lưu...' : saveLabel}
      </button>
    </div>
  )
}

// Attach sub-components to Modal (Compound Component Pattern)
;(Modal as unknown as ModalComposition).Header = ModalHeader
;(Modal as unknown as ModalComposition).Body = ModalBody
;(Modal as unknown as ModalComposition).Footer = ModalFooter
const ModalComponent = Modal as typeof Modal & ModalComposition

// ─────────────────────────────────────────────
// ClayModal — Compound Component usage (S2)
// ─────────────────────────────────────────────
function ClayModal({ state, formOptions, onClose, onSave, saving }: {
  state: ModalState
  formOptions: FormOptions | null
  onClose: () => void
  onSave: (form: ModalForm) => Promise<void>
  saving: boolean
}) {
  const firstCatId = formOptions?.categories[0]?.id ?? 1

  const [form, setForm] = useState<ModalForm>({
    name: '', sku: '', category_id: firstCatId,
    image_url: '', specs: {},
  })

  useEffect(() => {
    if (state.open) {
      setForm({
        name: '', sku: '', category_id: firstCatId,
        image_url: '', specs: {},
      })
    }
  }, [state.open, firstCatId])

  // Strategy Pattern (FE): tra cứu parent category nếu là subcategory — giống H1 fix trên BE
  const selectedCategory = formOptions?.categories.find((c) => c.id === form.category_id)
  let categoryName = selectedCategory?.name ?? 'Phụ kiện'
  if (!SPEC_FIELDS[categoryName] && selectedCategory?.parent_id != null) {
    const parentCat = formOptions?.categories.find((c) => c.id === selectedCategory.parent_id)
    if (parentCat && SPEC_FIELDS[parentCat.name]) categoryName = parentCat.name
  }
  const specFields = SPEC_FIELDS[categoryName] ?? SPEC_FIELDS['Phụ kiện'] ?? []

  const setSpec = (key: string, val: string) =>
    setForm((prev) => ({ ...prev, specs: { ...prev.specs, [key]: val } }))

  return (
    <ModalComponent onClose={onClose} saving={saving}>
      <ModalComponent.Header title="✦ Đăng ký Model Mới" subtitle="Master Data" />
      <ModalComponent.Body>
        <ClayInput required label="Tên sản phẩm" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Ví dụ: iPhone 15 Pro Max" />

        <div className="grid grid-cols-2 gap-3">
          <ClayInput required label="Mã SKU" value={form.sku} onChange={(v) => setForm((f) => ({ ...f, sku: v }))} placeholder="APL-IP15PM-256" />
          {formOptions && (
            <ClaySelect<number>
              required
              label="Danh mục"
              value={form.category_id}
              onChange={(v) => setForm((f) => ({ ...f, category_id: v, specs: {} }))}
              options={formOptions.categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          )}
        </div>

        <div className="grid grid-cols-1 gap-3">
          <ClayInput label="URL ảnh" value={form.image_url} onChange={(v) => setForm((f) => ({ ...f, image_url: v }))} placeholder="https://..." />
        </div>

        {/* Dynamic JSON Spec Fields (Strategy Pattern) */}
        <div className="rounded-card border border-border-soft p-4 bg-slate-50/80 shadow-apple-inset">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            📋 Thông số kỹ thuật — {categoryName}
          </p>
          <div className="flex flex-col gap-3">
            {specFields.map((field) => (
              <ClayInput
                key={field.key}
                label={`${field.label}${['display','os','camera','chip','ram','battery','cpu','storage','vga','ports','type','compatibility'].includes(field.key) ? ' *' : ''}`}
                value={form.specs[field.key] ?? ''}
                onChange={(v) => setSpec(field.key, v)}
                placeholder={field.placeholder}
              />
            ))}
          </div>
        </div>
      </ModalComponent.Body>
      <ModalComponent.Footer onSave={() => onSave(form)} saveLabel="✦ Đăng ký Model" />
    </ModalComponent>
  )
}

// ─────────────────────────────────────────────
// Delete Confirm Modal
// ─────────────────────────────────────────────
function DeleteModal({ productName, onClose, onConfirm, deleting }: {
  productName: string; onClose: () => void; onConfirm: () => void; deleting: boolean
}) {
  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="modal-panel w-full max-w-sm rounded-[20px] border border-border-soft bg-white p-8 flex flex-col items-center gap-5 text-center shadow-apple-lg"
      >
        <div className="w-16 h-16 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shadow-apple-sm">
          <Trash2 className="w-7 h-7 text-rose-600" />
        </div>
        <div>
          <h3 className="text-[18px] font-bold text-slate-900">Xóa sản phẩm?</h3>
          <p className="text-[13px] text-slate-500 mt-1">
            Bạn sắp xóa <span className="font-semibold text-slate-700">"{productName}"</span>. Hành động này không thể hoàn tác.
          </p>
        </div>
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="flex-1 h-10 rounded-full bg-white border border-border-soft text-[13px] font-semibold text-slate-600 transition-all active:opacity-80 disabled:opacity-50 shadow-apple-sm"
          >
            Giữ lại
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 h-10 rounded-full bg-rose-500 text-[13px] font-bold text-white transition-all active:opacity-90 flex items-center justify-center gap-2 disabled:opacity-60 shadow-apple-sm"
          >
            {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {deleting ? 'Đang xóa...' : 'Xóa ngay'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Toast Notification
// ─────────────────────────────────────────────
type ToastType = 'success' | 'error'
function Toast({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-xl px-5 py-4 text-[14px] font-semibold transition-all animate-slide-up shadow-apple-lg',
        type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-100' : 'bg-red-50 text-red-900 border border-red-100',
      )}
    >
      {type === 'success' ? '✦' : '✕'} {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// PRESENTER — Pure render, receives all data as props
// (H2: Container/Presenter split)
// ─────────────────────────────────────────────
interface ProductManagementViewProps {
  products: UIProduct[]
  stats: ApiProductStats | null
  formOptions: FormOptions | null
  modal: ModalState
  deleteTarget: UIProduct | null
  loadingProducts: boolean
  loadingStats: boolean
  saving: boolean
  deleting: boolean
  toast: { message: string; type: ToastType } | null
  error: string | null
  activeCategory: CategoryFilter
  searchQuery: string
  onCategoryChange: (cat: CategoryFilter) => void
  onSearchChange: (q: string) => void
  onOpenAdd: () => void
  onEdit: (p: UIProduct) => void
  onDelete: (id: number) => void
  onModalClose: () => void
  onModalSave: (form: ModalForm) => Promise<void>
  onDeleteClose: () => void
  onDeleteConfirm: () => void
  onToastClose: () => void
  onRefresh: () => void
  selectedWarehouseId: number | null
  onOpenWarehouseModal: () => void
  availableWarehouses: { id: number; name: string }[]
}

function ProductManagementView({
  products, stats, formOptions, modal, deleteTarget,
  loadingProducts, loadingStats, saving, deleting, toast, error,
  activeCategory, searchQuery,
  onCategoryChange, onSearchChange, onOpenAdd, onEdit, onDelete,
  onModalClose, onModalSave, onDeleteClose, onDeleteConfirm, onToastClose, onRefresh,
  selectedWarehouseId, onOpenWarehouseModal, availableWarehouses
}: ProductManagementViewProps) {
  const categories: CategoryFilter[] = ['Tất cả', 'Điện thoại', 'Laptop', 'Phụ kiện']

  const filtered = useMemo(() => {
    if (!searchQuery) return products
    const q = searchQuery.toLowerCase()
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    )
  }, [products, searchQuery])

  return (
    <div className="min-h-screen bg-surface-app">
      <div className="mx-auto max-w-[1440px] px-6 py-6">
        <div className="flex gap-6">

          <AppSidebar />

          {/* ── Main Content ─────────────────── */}
          <main className="flex-1 min-w-0">

            <Header
              title="Quản lý Sản phẩm"
              subtitle={
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 bg-emerald-50 px-3 py-0.5 rounded-full font-bold shadow-sm border border-emerald-100">
                      {stats ? `${stats.total_models} Models` : '—'}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 font-medium whitespace-nowrap">
                      Tổng tồn: {stats?.total_quantity ?? '—'} đơn vị
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">Tại kho:</span>
                     <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[12px] border border-emerald-100">
                       {selectedWarehouseId === null ? 'Tất cả chi nhánh' : (availableWarehouses.find(w => w.id === selectedWarehouseId)?.name || 'Đang tải...')}
                     </span>
                  </div>
                </div>
              }
              showSearch
              searchPlaceholder="Tìm theo tên, SKU..."
              onSearchChange={onSearchChange}
              actions={{
                secondary: {
                  label: "Chọn Kho",
                  icon: <Home className="w-4 h-4 text-[#F43F5E]" />,
                  color: "#F43F5E",
                  bgColor: "bg-[#FFE4E9]",
                  onClick: onOpenWarehouseModal
                },
                primary: {
                  label: "Thêm Model",
                  icon: <Plus className="w-5 h-5 text-[#10B981]" />,
                  color: "#10B981",
                  bgColor: "bg-[#DCFCE7]",
                  onClick: onOpenAdd,
                  variant: 'bubble'
                }
              }}
              userInitials="VT"
            />



            {/* ── Stats Row ── */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <StatCard
                label="Điện thoại"
                value={stats?.phones.model_count ?? 0}
                sub={`${stats?.phones.total_quantity ?? 0} máy tồn · ${stats?.phones.sold_count ?? 0} đã bán`}
                color="bg-sky-100/80"
                icon={<Smartphone className="w-5 h-5 text-rose-500" />}
                loading={loadingStats}
              />
              <StatCard
                label="Laptop"
                value={stats?.laptops.model_count ?? 0}
                sub={`${stats?.laptops.total_quantity ?? 0} máy tồn · ${stats?.laptops.sold_count ?? 0} đã bán`}
                color="bg-primary/10"
                icon={<Laptop className="w-5 h-5 text-emerald-600" />}
                loading={loadingStats}
              />
              <StatCard
                label="Phụ kiện"
                value={stats?.accessories.model_count ?? 0}
                sub={`${stats?.accessories.total_quantity ?? 0} tồn · ${stats?.accessories.sold_count ?? 0} đã bán`}
                color="bg-amber-100/80"
                icon={<Headphones className="w-5 h-5 text-orange-500" />}
                loading={loadingStats}
              />
            </div>

            {/* ── Filter Pills ── */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <Filter className="w-4 h-4 text-slate-400" />
              {categories.map((cat) => (
                <FilterPill
                  key={cat}
                  label={cat}
                  active={activeCategory === cat}
                  onClick={() => onCategoryChange(cat)}
                />
              ))}
              <span className="ml-auto text-[12px] text-slate-400 font-medium">
                {filtered.length} sản phẩm
              </span>
            </div>

            {/* ── Error Banner ── */}
            {error && (
              <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-100 px-5 py-4 mb-6 text-red-800 text-[13px] font-semibold">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
                <button onClick={onRefresh} className="ml-auto underline">Thử lại</button>
              </div>
            )}

            {/* ── Bento Grid ── */}
            {loadingProducts ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4 text-slate-400">
                  <Loader2 className="w-10 h-10 animate-spin" />
                  <p className="text-[14px] font-medium">Đang tải sản phẩm...</p>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Box className="w-16 h-16 text-slate-300" />
                <p className="text-[15px] text-slate-400 font-medium">
                  {error ? 'Không thể tải dữ liệu' : 'Không có sản phẩm nào'}
                </p>
                <button
                  type="button"
                  onClick={onOpenAdd}
                  className="h-10 rounded-full px-5 text-[13px] font-bold bg-primary text-white inline-flex items-center gap-2 shadow-apple-sm active:opacity-90"
                >
                  <Plus className="w-4 h-4" />
                  Thêm sản phẩm đầu tiên
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── Modals ── */}
      {modal.open && (
        <ClayModal
          state={modal}
          formOptions={formOptions}
          onClose={onModalClose}
          onSave={onModalSave}
          saving={saving}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          productName={deleteTarget.name}
          onClose={onDeleteClose}
          onConfirm={onDeleteConfirm}
          deleting={deleting}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={onToastClose}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// CONTAINER — Xử lý data fetching + business logic
// (H2: Container/Presenter Pattern)
// ─────────────────────────────────────────────
import WarehouseModal from '../components/common/WarehouseModal'

export default function ProductManagement() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('Tất cả')
  const [searchQuery, setSearchQuery] = useState('')
  const [formOptions, setFormOptions] = useState<FormOptions | null>(null)
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'add', productId: null })
  const [warehouseModal, setWarehouseModal] = useState<{ open: boolean; tab: 'select' | 'create' }>({ open: false, tab: 'select' })
  const [deleteTarget, setDeleteTarget] = useState<UIProduct | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  // Lấy warehouse context từ global store (S1)
  const { selectedWarehouseId, availableWarehouses } = useWarehouseStore()

  // Xác định category_id từ activeCategory filter
  const categoryId = useMemo(() => {
    if (activeCategory === 'Tất cả') return undefined
    if (formOptions?.categories) {
      return formOptions.categories.find((c) => c.name === activeCategory)?.id
    }
    return undefined
  }, [activeCategory, formOptions])

  // Custom Hooks thay thế inline fetch logic (S3 / H2)
  const { products: rawProducts, loading: loadingProducts, error, refetch: refetchProducts } = useProducts({
    category_id: categoryId,
    warehouse_id: selectedWarehouseId ?? undefined,
    search: searchQuery || undefined,
    limit: 50,
  })
  const { stats, loading: loadingStats, refetch: refetchStats } = useProductStats(selectedWarehouseId ?? undefined)

  const products = useMemo(() => rawProducts.map(mapApiProductToUI), [rawProducts])

  // ── Fetch form options ──
  const fetchFormOptions = useCallback(async () => {
    try {
      const opts = await productApiService.getFormOptions()
      setFormOptions(opts)
    } catch (err) {
      console.error('[FormOptions] Error:', err)
    }
  }, [])

  useEffect(() => {
    fetchFormOptions()
  }, [fetchFormOptions])

  const handleRefresh = useCallback(() => {
    refetchProducts()
    refetchStats()
  }, [refetchProducts, refetchStats])

  const handleSave = useCallback(async (form: ModalForm) => {
    setSaving(true)
    try {
      const categoryName = formOptions?.categories.find((c) => c.id === form.category_id)?.name ?? ''
      const specFields = SPEC_FIELDS[categoryName] ?? []
      const cleanSpecs: Record<string, string> = {}
      specFields.forEach((f) => {
        const v = form.specs[f.key]
        if (v && v.trim()) cleanSpecs[f.key] = v.trim()
      })

      const payload: CreateProductPayload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        category_id: form.category_id,
        image_url: form.image_url.trim() || undefined,
        specifications: cleanSpecs,
        // warehouse_id & supplier_id removed.
      }

      await productApiService.createProduct(payload)
      setToast({ message: `✦ Đã đăng ký Model "${form.name}" thành công!`, type: 'success' })
      setModal({ open: false, mode: 'add', productId: null })
      refetchProducts()
      refetchStats()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi thêm sản phẩm'
      setToast({ message: msg, type: 'error' })
    } finally {
      setSaving(false)
    }
  }, [formOptions, refetchProducts, refetchStats])

  const handleDelete = useCallback((id: number) => {
    const target = products.find((p) => p.id === id)
    if (target) setDeleteTarget(target)
  }, [products])

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await productApiService.deleteProduct(deleteTarget.id)
      setToast({ message: `Đã xóa "${deleteTarget.name}"`, type: 'success' })
      setDeleteTarget(null)
      refetchProducts()
      refetchStats()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi xóa sản phẩm'
      setToast({ message: msg, type: 'error' })
    } finally {
      setDeleting(false)
    }
  }, [deleteTarget, refetchProducts, refetchStats])

  return (
    <>
      <ProductManagementView
        products={products}
        stats={stats}
        formOptions={formOptions}
        modal={modal}
        deleteTarget={deleteTarget}
        loadingProducts={loadingProducts}
        loadingStats={loadingStats}
        saving={saving}
        deleting={deleting}
        toast={toast}
        error={error}
        activeCategory={activeCategory}
        searchQuery={searchQuery}
        selectedWarehouseId={selectedWarehouseId}
        availableWarehouses={availableWarehouses}
        onCategoryChange={setActiveCategory}
        onSearchChange={setSearchQuery}
        onOpenAdd={() => setModal({ open: true, mode: 'add', productId: null })}
        onEdit={() => setModal({ open: true, mode: 'add', productId: null })}
        onDelete={handleDelete}
        onModalClose={() => setModal({ open: false, mode: 'add', productId: null })}
        onModalSave={handleSave}
        onDeleteClose={() => setDeleteTarget(null)}
        onDeleteConfirm={confirmDelete}
        onToastClose={() => setToast(null)}
        onRefresh={handleRefresh}
        onOpenWarehouseModal={() => setWarehouseModal({ open: true, tab: 'select' })}
      />

      <WarehouseModal
        isOpen={warehouseModal.open}
        defaultTab={warehouseModal.tab}
        onClose={() => setWarehouseModal({ ...warehouseModal, open: false })}
      />
    </>
  )
}
