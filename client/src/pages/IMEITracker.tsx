import React, { useState, useEffect, useCallback } from 'react'
import { 
   Package, Truck, Warehouse,
  Search, ScanLine, ArrowDownRight, PackageCheck, AlertCircle, ArrowRight, User, CheckCircle,
} from 'lucide-react'

import Header from '../components/common/Header'
import AppSidebar from '../components/common/AppSidebar'
import { productApiService } from '../services/product.service'

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

const txMeta = {
   INBOUND: {
      icon: PackageCheck,
      iconColor: 'text-emerald-700',
      bg: 'bg-primary',
      accent: 'bg-emerald-400',
      title: 'Nhập kho mới',
   },
   TRANSFER: {
      icon: Truck,
      iconColor: 'text-purple-700',
      bg: 'bg-flow-transfer',
      accent: 'bg-purple-400',
      title: 'Điều chuyển nội bộ',
   },
   OUTBOUND: {
      icon: ArrowDownRight,
      iconColor: 'text-rose-700',
      bg: 'bg-status-info',
      accent: 'bg-sky-400',
      title: 'Xuất kho bán',
   },
   DEFAULT: {
      icon: Package,
      iconColor: 'text-slate-700',
      bg: 'bg-slate-300',
      accent: 'bg-slate-400',
      title: 'Giao dịch',
   },
} as const

const profileStatusText: Record<string, string> = {
   IN_STOCK: '📦 Đang lưu kho',
   SOLD: '🤝 Đã bán',
   IN_TRANSIT: '🚚 Đang chuyển kho',
}

export default function IMEITrackerPage() {
  const [imei, setImei] = useState('')
  const debouncedImei = useDebounce(imei, 600)

  const [traceData, setTraceData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

   const fetchTrace = useCallback(async (rawCode: string) => {
      const code = rawCode.trim()
      if (code.length < 5) return
    setLoading(true)
    setError(null)
    setTraceData(null)
    try {
         const resp = await productApiService.getImeiTrace(code)
      setTraceData(resp)
    } catch (err: any) {
      setError(err.message || 'Không tìm thấy hoặc có lỗi xảy ra.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debouncedImei) fetchTrace(debouncedImei)
  }, [debouncedImei, fetchTrace])

  return (
    <div className="min-h-screen bg-surface-app">
      <div className="mx-auto max-w-[1440px] px-6 py-6">
        <div className="flex gap-6">
          <AppSidebar />

          {/* Main Content */}
          <main className="flex-1 min-w-0 flex flex-col items-center">
            <div className="w-full max-w-4xl">
              <Header
                title="Truy vết Thiết Bị"
                subtitle="Tìm kiếm IMEI để xem toàn bộ sơ yếu lý lịch từ lúc nhập, điều chuyển tới lúc xuất kho."
                userInitials="VT"
              />

              <div className="mt-6 p-2 rounded-full bg-white border border-border-soft flex items-center shadow-apple-inset">
                 <ScanLine className="w-8 h-8 text-slate-400 ml-4 shrink-0" />
                 <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (imei) fetchTrace(imei)
                    }}
                    className="flex-1 flex items-center"
                 >
                    <input 
                       type="text" 
                       placeholder="Nhập hoặc quét mã IMEI..." 
                       value={imei}
                       onChange={(e) => setImei(e.target.value)}
                       className="w-full bg-transparent border-none outline-none px-4 text-xl md:text-2xl font-medium tabular-nums text-slate-900 placeholder:text-slate-400 font-mono"
                    />
                 </form>
                 <button 
                  type="button"
                  onClick={() => imei && fetchTrace(imei)}
                  className="w-14 h-14 rounded-full bg-flow-transfer text-white flex items-center justify-center transition-all active:opacity-90 shadow-apple-sm"
                 >
                    {loading ? <div className="w-6 h-6 border-b-2 border-slate-800 rounded-full animate-spin"/> : <Search className="w-6 h-6" />}
                 </button>
              </div>

              {error && (
                 <div className="mt-8 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center gap-3 w-full max-w-xl mx-auto shadow-sm">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-semibold text-lg">{error}</span>
                 </div>
              )}

              {traceData && !loading && !error && (
                 <div className="mt-12 space-y-10 w-full">
                    <div className="p-6 md:p-8 rounded-2xl border border-border-soft bg-white relative overflow-hidden shadow-apple-md">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary rounded-bl-full opacity-35 blur-2xl" />
                      <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start relative z-10">
                        <div className="w-32 h-32 md:w-40 md:h-40 shrink-0 bg-slate-50 rounded-2xl border border-border-soft p-4 flex items-center justify-center shadow-apple-inset">
                          <img src={traceData.profile.product?.image_url || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80'} alt="Product" className="object-contain h-full mix-blend-multiply drop-shadow-md" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                          <span className="px-3 py-1 bg-lilac-200 text-lilac-900 text-xs font-semibold uppercase tracking-wide rounded-full font-mono tabular-nums">IMEI {traceData.profile.imei}</span>
                          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 mt-3 leading-snug">{traceData.profile.product?.name}</h2>
                          <p className="text-slate-600 font-normal text-base mt-1 leading-relaxed">
                            <span className="font-mono text-sm text-slate-700">SKU: {traceData.profile.product?.sku}</span>
                            {' · '}
                            Danh mục: {traceData.profile.product?.category?.name || 'Chưa phân loại'}
                          </p>
                          <div className="mt-5 flex flex-wrap gap-4 items-center justify-center md:justify-start">
                            <div className="px-5 py-2.5 rounded-2xl bg-slate-100 flex items-center gap-2 font-medium text-slate-800 shadow-sm border border-slate-200">
                              {profileStatusText[traceData.profile.current_status] || 'Tình trạng: Khác'}
                            </div>
                            {traceData.profile.current_warehouse && (
                              <div className="px-5 py-2.5 rounded-2xl bg-primary flex items-center gap-2 font-medium text-white shadow-sm">
                                <Warehouse className="w-4 h-4" /> Vị trí: {traceData.profile.current_warehouse.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="relative pt-6">
                      <h3 className="text-xl font-semibold tracking-tight text-slate-900 mb-10 pl-4 border-l-4 border-slate-900 rounded-sm">Lịch sử Hành trình</h3>
                      <div className="absolute left-8 md:left-12 top-24 bottom-10 w-1.5 bg-slate-200 rounded-full shadow-inner" />
                      <div className="space-y-12">
                        {traceData.timeline.map((tx: any) => {
                          const meta = txMeta[tx.type as keyof typeof txMeta] || txMeta.DEFAULT
                          const Icon = meta.icon
                          return (
                            <div key={tx.id} className="relative flex items-start gap-8 group">
                              <div className="relative z-10 w-16 h-16 md:w-24 md:h-24 shrink-0 flex items-center justify-center">
                                <div className={`${meta.bg} w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center transition-opacity group-hover:opacity-90 duration-300 shadow-apple-sm`}>
                                  <Icon className={`w-5 h-5 ${meta.iconColor}`} />
                                </div>
                                <div className={`${meta.accent} absolute -bottom-2 -right-2 w-5 h-5 rounded-full border-4 border-surface-app`} />
                              </div>

                              <div className="flex-1 bg-white p-5 md:p-6 rounded-xl border border-border-soft transition-shadow duration-300 group-hover:shadow-apple-md shadow-apple-sm">
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 border-b border-slate-100 pb-4 mb-4">
                                  <div>
                                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500 font-mono tabular-nums">Giao dịch · {new Date(tx.created_at).toLocaleString('vi-VN')}</span>
                                    <h4 className="text-base font-semibold text-slate-900 mt-1 flex items-center gap-2 tracking-tight">
                                      {meta.title}
                                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-mono border border-slate-200">{tx.code}</span>
                                    </h4>
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold w-fit ${tx.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}`}>
                                    {tx.status === 'COMPLETED' ? 'Đã Hoàn Tất' : 'Đang Xử Lý'}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                  {tx.type === 'INBOUND' && (
                                    <>
                                      <div className="flex flex-col gap-1">
                                        <span className="text-slate-400 font-medium">Từ nhà cung cấp:</span>
                                        <span className="font-bold text-slate-800">{tx.supplier?.company_name || 'N/A'}</span>
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <span className="text-slate-400 font-medium">Nhập vào kho:</span>
                                        <span className="font-bold text-slate-800">{tx.dest_warehouse?.name || 'N/A'}</span>
                                      </div>
                                    </>
                                  )}

                                  {tx.type === 'TRANSFER' && (
                                    <>
                                      <div className="flex flex-col gap-1 col-span-1 md:col-span-2">
                                        <span className="text-slate-400 font-medium">Hành trình:</span>
                                        <div className="flex items-center gap-3 mt-1 font-bold text-slate-800 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                          <span>{tx.source_warehouse?.name || 'N/A'}</span>
                                          <ArrowRight className="w-4 h-4 text-purple-400" />
                                          <span>{tx.dest_warehouse?.name || 'N/A'}</span>
                                        </div>
                                      </div>
                                      {tx.confirmed_at && (
                                        <div className="flex flex-col gap-1 col-span-1 md:col-span-2">
                                          <span className="text-slate-400 font-medium">Xác nhận nhận lúc:</span>
                                          <span className="text-slate-700 font-medium">{new Date(tx.confirmed_at).toLocaleString('vi-VN')}</span>
                                        </div>
                                      )}
                                    </>
                                  )}

                                  {tx.type === 'OUTBOUND' && (
                                    <>
                                      <div className="flex flex-col gap-1">
                                        <span className="text-slate-400 font-medium">Xuất từ kho:</span>
                                        <span className="font-bold text-slate-800">{tx.source_warehouse?.name || 'N/A'}</span>
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <span className="text-slate-400 font-medium">Bán cho đối tác:</span>
                                        <span className="font-bold text-pink-600 text-base">{tx.partner_name || 'Khách lẻ'}</span>
                                      </div>
                                    </>
                                  )}

                                  <div className="col-span-1 md:col-span-2 mt-2 pt-4 border-t border-slate-50 flex flex-wrap gap-4">
                                    {tx.creator && (
                                      <div className="flex items-center gap-2 bg-surface-app px-3 py-1.5 rounded-xl border border-border-soft">
                                        <User className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs text-slate-500">Người lập phiếu: <strong className="text-slate-700">{tx.creator.full_name}</strong></span>
                                      </div>
                                    )}
                                    {tx.confirmer && (
                                      <div className="flex items-center gap-2 bg-surface-app px-3 py-1.5 rounded-xl border border-border-soft">
                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                        <span className="text-xs text-slate-500">Người xác nhận: <strong className="text-slate-700">{tx.confirmer.full_name}</strong></span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
