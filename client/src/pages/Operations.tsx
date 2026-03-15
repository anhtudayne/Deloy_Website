import React, { useState } from 'react'
import {
  Home,
  Plus,
} from 'lucide-react'

import Header from '../components/common/Header'
import AppSidebar from '../components/common/AppSidebar'
import WarehouseModal from '../components/common/WarehouseModal'
import WarehouseOperationsHub from '../components/warehouse-hub/WarehouseOperationsHub'

export default function Operations() {
  const [warehouseModal, setWarehouseModal] = useState<{ open: boolean; tab: 'select' | 'create' }>({ open: false, tab: 'select' })

  return (
    <div className="min-h-screen bg-surface-app">
      <div className="mx-auto max-w-[1440px] px-6 py-6">
        <div className="flex gap-6">
          <AppSidebar />

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Unified Top Header — Claymorphism Edition */}
            <Header
              title="Vận Hành Tổng Thể"
              subtitle="Thực hiện các thao tác Nhập/Xuất kho hàng loạt bằng mã IMEI."
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


            <div className="max-w-[1200px] mx-auto">
              <WarehouseOperationsHub />
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
