import React, { useState, useEffect, useCallback, useRef } from 'react'
import { CheckCircle, Truck, PackageCheck, AlertTriangle, ListFilter, Sparkles, AlertCircle, FileUp, X, Home, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWarehouseStore } from '../store/useWarehouseStore'
import { transactionApiService } from '../services/transaction.service'

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

import Header from '../components/common/Header'
import AppSidebar from '../components/common/AppSidebar'
import WarehouseModal from '../components/common/WarehouseModal'

interface ScannedRow {
  id: string
  imei: string
}

export default function WarehouseConfirmationPage() {
  const { availableWarehouses, selectedWarehouseId } = useWarehouseStore()
  
  const currentWarehouse = React.useMemo(() => {
    return availableWarehouses.find(w => w.id === selectedWarehouseId)
  }, [availableWarehouses, selectedWarehouseId])
  
  const warehouseId = currentWarehouse?.id

  const [warehouseModal, setWarehouseModal] = useState<{ open: boolean; tab: 'select' | 'create' }>({ open: false, tab: 'select' })

  const [transfers, setTransfers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedTx, setSelectedTx] = useState<any | null>(null)
  const [confirmStatus, setConfirmStatus] = useState<any>({ kind: 'idle' })
  const [scannedRows, setScannedRows] = useState<ScannedRow[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchTransfers = useCallback(async () => {
    if (!warehouseId) return
    setLoading(true)
    setError(null)
    try {
      const data = await transactionApiService.getPendingTransfers(warehouseId)
      setTransfers(data)
    } catch (err: any) {
      setError(err.message || 'Lỗi tải danh sách')
    } finally {
      setLoading(false)
    }
  }, [warehouseId])

  useEffect(() => {
    fetchTransfers()
  }, [fetchTransfers])

  const handleQuickConfirm = async (tx: any) => {
    if (!warehouseId) return
    setConfirmStatus({ kind: 'submitting', progress: 100 })
    try {
      await transactionApiService.confirmTransfer({
        transactionId: tx.id,
        warehouseId
      })
      setConfirmStatus({ kind: 'success', message: 'Xác nhận lô hàng thành công!' })
      // Update local state without fetching completely
      setTransfers(prev => prev.filter(t => t.id !== tx.id))
      setTimeout(() => {
        setConfirmStatus({ kind: 'idle' })
        setSelectedTx(null)
      }, 2000)
    } catch (err: any) {
      setConfirmStatus({ kind: 'error', message: err.message || 'Xác nhận thất bại' })
    }
  }

  const handleDetailedConfirm = async () => {
    if (!warehouseId || !selectedTx) return
    
    // Validate scanned vs required
    const expectedImeis = new Set()
    selectedTx.details.forEach((d: any) => {
      d.imeis.forEach((i: any) => expectedImeis.add(i.imei_serial))
    })

    const scannedImeis = new Set(scannedRows.map(r => r.imei))
    
    if (scannedImeis.size !== expectedImeis.size) {
      setConfirmStatus({ kind: 'error', message: `Số lượng IMEI quét (${scannedImeis.size}) không khớp với lô hàng (${expectedImeis.size}).` })
      return
    }

    let mismatch = false
    scannedImeis.forEach(imei => {
      if (!expectedImeis.has(imei)) mismatch = true
    })

    if (mismatch) {
       setConfirmStatus({ kind: 'error', message: 'Có IMEI không thuộc lô hàng này.' })
       return
    }

    await handleQuickConfirm(selectedTx)
  }

  const handleFileUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
      const parsed: ScannedRow[] = lines.map(line => {
        const parts = line.split(',')
        if (parts.length >= 1) return { id: crypto.randomUUID(), imei: parts[0] }
        return null
      }).filter(Boolean) as ScannedRow[]
      
      setScannedRows(parsed)
      setConfirmStatus({ kind: 'idle' })
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen bg-surface-app">
      <div className="mx-auto max-w-[1440px] px-6 py-6">
        <div className="flex gap-6">
          <AppSidebar />

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <Header
              title="Trung Tâm Xác Nhận"
              subtitle="Tiếp nhận hàng hoá đang chuyển đến kho của bạn."
              actions={{
                secondary: {
                  label: "Chọn Kho",
                  icon: <Home className="w-4 h-4 text-[#F43F5E]" />,
                  color: "#F43F5E",
                  bgColor: "bg-[#FFE4E9]",
                  onClick: () => setWarehouseModal({ open: true, tab: 'select' })
                },
                primary: {
                  label: "Nhập Kho Mới",
                  icon: <Plus className="w-4 h-4 text-[#10B981]" />,
                  color: "#10B981",
                  bgColor: "bg-[#DCFCE7]",
                  onClick: () => setWarehouseModal({ open: true, tab: 'create' })
                }
              }}
              userInitials="VT"
            />

            <div className="max-w-[1200px] mx-auto mt-6">
               {!warehouseId ? (
                  <div className="flex flex-col items-center justify-center min-h-[50vh]">
                     <AlertTriangle className="w-12 h-12 text-slate-400 mb-4" />
                     <h2 className="text-xl font-semibold text-slate-700">Chưa chọn kho</h2>
                     <p className="text-slate-500 mt-2">Vui lòng chọn một kho để xem hàng đang đến.</p>
                  </div>
               ) : (
                  <div className="space-y-8 animate-fade-in">
                     <div className="bg-white border border-border-soft rounded-2xl p-6 lg:p-8 relative shadow-apple-md">
                        <div className="flex items-center justify-between mb-6">
                           <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                              <ListFilter className="w-5 h-5 text-slate-400" />
                              Hàng Đang Đến 
                              {transfers.length > 0 && <span className="ml-2 bg-lilac-200 text-lilac-800 text-xs px-2 py-0.5 rounded-full">{transfers.length}</span>}
                           </h2>
                           <button onClick={fetchTransfers} className="text-sm font-semibold text-lilac-500 hover:text-lilac-600 transition-colors">Tải Lại</button>
                        </div>

                        {loading ? (
                           <div className="flex justify-center py-12">
                              <Sparkles className="w-6 h-6 animate-spin text-lilac-400" />
                           </div>
                        ) : error ? (
                           <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-2">
                              <AlertCircle className="w-5 h-5" />
                              {error}
                           </div>
                        ) : transfers.length === 0 ? (
                           <div className="text-center py-16 px-4 border-2 border-dashed border-lilac-100 rounded-3xl bg-white/50">
                              <PackageCheck className="w-12 h-12 mx-auto mb-3 opacity-50 text-lilac-400" />
                              <p className="font-semibold text-slate-600">Tuyệt vời!</p>
                              <p className="text-slate-500 text-sm mt-1">Kho {currentWarehouse?.name} hiện không có lô hàng nào đang chờ xác nhận.</p>
                           </div>
                        ) : (
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {transfers.map(tx => {
                                 const totalItems = tx.details.reduce((acc: number, d: any) => acc + d.quantity, 0)
                                 const isSelected = selectedTx?.id === tx.id

                                 return (
                                    <div 
                                       key={tx.id}
                                       onClick={() => {
                                          setSelectedTx(isSelected ? null : tx)
                                          setScannedRows([])
                                          setConfirmStatus({ kind: 'idle' })
                                       }}
                                       className={cn(
                                          'p-5 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden group border border-border-soft',
                                          isSelected
                                             ? 'bg-violet-50 shadow-apple-inset ring-1 ring-violet-300'
                                             : 'bg-white shadow-apple-sm hover:bg-slate-50'
                                       )}
                                    >
                                       <div className="absolute top-0 left-0 w-1.5 h-full bg-lilac-400" />
                                       
                                       <div className="flex justify-between items-start mb-3">
                                          <span className="text-xs font-bold text-slate-500 px-2 py-1 bg-slate-100/80 rounded-md truncate max-w-[140px]">
                                             {tx.code}
                                          </span>
                                          <span className="w-2.5 h-2.5 rounded-full bg-lilac-400 animate-pulse shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
                                       </div>

                                       <div className="space-y-1 mb-4">
                                          <div className="text-[13px] text-slate-500 flex justify-between">
                                             <span>Từ kho:</span>
                                             <span className="font-semibold text-slate-700">{tx.source_warehouse?.name || 'N/A'}</span>
                                          </div>
                                          <div className="text-[13px] text-slate-500 flex justify-between">
                                             <span>Gửi lúc:</span>
                                             <span className="font-medium text-slate-700">{new Date(tx.created_at).toLocaleDateString('vi-VN')}</span>
                                          </div>
                                          <div className="text-[13px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                                             <span>Số lượng:</span>
                                             <span className="font-bold text-lilac-600">{totalItems} máy</span>
                                          </div>
                                       </div>

                                       {isSelected && (
                                          <div className="mt-4 pt-4 border-t border-black/5 space-y-3">
                                             <button
                                                onClick={(e) => { e.stopPropagation(); handleQuickConfirm(tx) }}
                                                disabled={confirmStatus.kind === 'submitting'}
                                                className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-sm flex justify-center items-center gap-2 hover:opacity-90 transition-all shadow-apple-sm active:scale-[0.98]"
                                             >
                                                <CheckCircle className="w-4 h-4" /> Xác nhận Nhanh
                                             </button>
                                          </div>
                                       )}
                                    </div>
                                 )
                              })}
                           </div>
                        )}
                     </div>

                     <AnimatePresence>
                        {selectedTx && (
                           <motion.div
                              initial={{ opacity: 0, y: 30 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 20 }}
                              className="bg-white border border-border-soft rounded-2xl p-6 lg:p-8 shadow-apple-md"
                           >
                              <div className="flex justify-between items-center mb-6">
                                 <h3 className="text-lg font-bold text-slate-800">Xác nhận Chi tiết bằng IMEI (Bảo mật quét mã)</h3>
                                 <button onClick={() => { setSelectedTx(null); setScannedRows([]); setConfirmStatus({kind:'idle'}) }} className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
                                    <X className="w-5 h-5" />
                                 </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 {/* CSV Upload */}
                                 <div className="space-y-4">
                                    <div 
                                       onClick={() => fileInputRef.current?.click()}
                                       className="h-32 rounded-2xl border-2 border-dashed border-lilac-300 bg-lilac-50/50 flex flex-col items-center justify-center cursor-pointer hover:bg-lilac-50 transition-colors group"
                                    >
                                       <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={(e) => {
                                          if (e.target.files) handleFileUpload(e.target.files[0])
                                       }} />
                                       <FileUp className="w-8 h-8 text-lilac-400 mb-2 group-hover:-translate-y-1 transition-transform" />
                                       <span className="text-sm font-bold text-lilac-600">Tải lên file CSV kiểm đếm</span>
                                    </div>
                                    <p className="text-xs text-slate-500 px-2 leading-relaxed">
                                       <strong>Mẹo:</strong> Upload file CSV chứa danh sách IMEI đã quét thực tế tại kho để hệ thống tự động đối chiếu số lượng và mã máy gửi đến.
                                    </p>
                                 </div>

                                 {/* Submit Detailed */}
                                 <div className="flex flex-col justify-between">
                                    <div className="bg-white rounded-2xl p-4 border border-border-soft h-32 overflow-y-auto shadow-apple-inset">
                                       <div className="text-sm font-bold text-slate-700 mb-2 flex justify-between">
                                          <span>Máy đã quét: {scannedRows.length}</span>
                                          <span className="text-slate-400 font-normal">Tỉ lệ: {Math.min(scannedRows.length / selectedTx.details.reduce((a:number,b:any)=>a+b.quantity,0) * 100, 100).toFixed(0)}%</span>
                                       </div>
                                       {scannedRows.slice(0, 3).map(r => (
                                          <div key={r.id} className="text-xs text-slate-600 font-mono py-1 border-b border-slate-100 last:border-0 truncate">{r.imei}</div>
                                       ))}
                                       {scannedRows.length > 3 && <div className="text-xs text-slate-400 mt-1 italic font-medium">...và {scannedRows.length - 3} thiết bị khác</div>}
                                       {scannedRows.length === 0 && <div className="text-[13px] text-slate-400 italic">Chưa có mã nào được quét.</div>}
                                    </div>

                                    <div className="mt-4">
                                       {confirmStatus.kind === 'error' && <div className="text-red-500 text-sm mb-2 px-2 flex items-center gap-1.5"><AlertCircle className="w-4 h-4 shrink-0" />{confirmStatus.message}</div>}
                                       {confirmStatus.kind === 'success' && <div className="text-emerald-500 text-sm mb-2 px-2 flex items-center gap-1.5"><CheckCircle className="w-4 h-4 shrink-0" />{confirmStatus.message}</div>}
                                       
                                       <button
                                          onClick={handleDetailedConfirm}
                                          disabled={scannedRows.length === 0 || confirmStatus.kind === 'submitting'}
                                          className={cn(
                                             'w-full py-3 rounded-full font-bold text-[15px] flex justify-center items-center gap-2 transition-all duration-300 active:scale-[0.98]',
                                             scannedRows.length > 0 ? 'bg-violet-600 text-white shadow-apple-md hover:opacity-95' : 'bg-slate-100 text-slate-400 shadow-flat'
                                          )}
                                       >
                                          {confirmStatus.kind === 'submitting' ? <Sparkles className="w-5 h-5 animate-spin" /> : <PackageCheck className="w-5 h-5" />}
                                          Đối chiếu & Xác nhận vào kho
                                       </button>
                                    </div>
                                 </div>
                              </div>
                           </motion.div>
                        )}
                     </AnimatePresence>
                  </div>
               )}
            </div>
          </main>
        </div>
      </div>

      <WarehouseModal 
        isOpen={warehouseModal.open} 
        onClose={() => setWarehouseModal(prev => ({ ...prev, open: false }))} 
        defaultTab={warehouseModal.tab} 
      />
    </div>
  )
}
