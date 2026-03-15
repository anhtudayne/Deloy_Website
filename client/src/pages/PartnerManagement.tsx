import React, { useEffect, useState } from 'react';
import { usePartnerStore } from '../store/usePartnerStore';
import { Plus, Edit2, Trash2, Mail, Phone, MapPin, Package, Home } from 'lucide-react';
import Header from '../components/common/Header';
import AppSidebar from '../components/common/AppSidebar';

const pressApple = 'active:opacity-80 active:scale-[0.98] transition-all';

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

// ─────────────────────────────────────────────
// PartnerFormFactory
// ─────────────────────────────────────────────
const PartnerFormFactory = ({ type, onClose, onSubmit }: { type: 'supplier' | 'customer', onClose: () => void, onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    company_name: '',
    full_name: '',
    phone: '',
    email: '',
    address: '',
    customer_type: 'RETAIL',
    tax_code: '', // Mock for supplier factory pattern demonstration
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'supplier') {
      onSubmit({
        company_name: formData.company_name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
      });
    } else {
      onSubmit({
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        customer_type: formData.customer_type,
      });
    }
  };

  return (
    <div className="p-8 rounded-[20px] bg-white border border-border-soft w-full max-w-md mx-auto shadow-apple-lg">
      <h3 className="text-xl font-semibold tracking-tight mb-6 text-slate-900">Thêm mới {type === 'supplier' ? 'Nhà cung cấp' : 'Khách hàng'}</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {type === 'supplier' ? (
          <>
            <input name="company_name" placeholder="Tên công ty" required onChange={handleChange} className="p-4 rounded-full border border-border-soft outline-none focus:ring-2 focus:ring-primary bg-white shadow-apple-inset" />
            <input name="tax_code" placeholder="Mã số thuế" onChange={handleChange} className="p-4 rounded-full border border-border-soft outline-none focus:ring-2 focus:ring-primary bg-white shadow-apple-inset" />
          </>
        ) : (
          <>
            <input name="full_name" placeholder="Họ tên" required onChange={handleChange} className="p-4 rounded-full border border-border-soft outline-none focus:ring-2 focus:ring-status-info bg-white shadow-apple-inset" />
            <select name="customer_type" onChange={handleChange} className="p-4 rounded-full border border-border-soft outline-none focus:ring-2 focus:ring-status-info bg-white cursor-pointer shadow-apple-inset">
              <option value="RETAIL">Khách hàng Bán Lẻ</option>
              <option value="WHOLESALE">Khách hàng Bán Buôn</option>
            </select>
          </>
        )}
        <input name="phone" placeholder="Số điện thoại" required onChange={handleChange} className={`p-4 rounded-full border border-border-soft outline-none focus:ring-2 ${type==='supplier'?'focus:ring-primary':'focus:ring-status-info'} bg-white shadow-apple-inset`} />
        <input name="email" type="email" placeholder="Email (Tùy chọn)" onChange={handleChange} className={`p-4 rounded-full border border-border-soft outline-none focus:ring-2 ${type==='supplier'?'focus:ring-primary':'focus:ring-status-info'} bg-white shadow-apple-inset`} />
        <input name="address" placeholder="Địa chỉ (Tùy chọn)" onChange={handleChange} className={`p-4 rounded-full border border-border-soft outline-none focus:ring-2 ${type==='supplier'?'focus:ring-primary':'focus:ring-status-info'} bg-white shadow-apple-inset`} />
        
        <div className="flex gap-4 mt-4">
          <button type="button" onClick={onClose} className={cn('flex-1 py-4 px-6 rounded-full font-bold text-slate-600 bg-white border border-border-soft shadow-apple-sm', pressApple)}>
            Hủy
          </button>
          <button type="submit" className={cn('flex-1 py-4 px-6 rounded-full font-bold text-white shadow-apple-sm', type === 'supplier' ? 'bg-primary' : 'bg-status-info', pressApple)}>
            Lưu ngay
          </button>
        </div>
      </form>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function PartnerManagementPage() {
  const { suppliers, customers, isLoading, fetchPartners, addSupplier, addCustomer } = usePartnerStore();
  const [activeTab, setActiveTab] = useState<'supplier' | 'customer'>('supplier');
  const [showForm, setShowForm] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleAdd = async (data: any) => {
    try {
      if (activeTab === 'supplier') {
        await addSupplier(data);
      } else {
        await addCustomer(data);
      }
      setShowForm(false);
    } catch (error) {
      alert("Lỗi khi thêm: " + error);
    }
  };

  const getCardColor = () => activeTab === 'supplier' ? 'bg-primary/10 border border-primary/20' : 'bg-sky-50 border border-sky-200/60';

  const dataList = activeTab === 'supplier' ? suppliers : customers;

  return (
    <div className="min-h-screen bg-surface-app">
      <div className="mx-auto max-w-[1440px] px-6 py-6">
        <div className="flex gap-6">

          <AppSidebar />

          {/* ── Main Content ───────────────────────────── */}
          <main className="flex-1 min-w-0">

            <Header
              title="Quản Lý Đối Tác"
              subtitle="Hệ sinh thái liên kết Master Data toàn hệ thống"
              showSearch
              actions={{
                primary: {
                  label: "Thêm Đối Tác",
                  icon: <Plus className="w-4 h-4 text-[#10B981]" />,
                  color: "#10B981",
                  bgColor: "bg-[#DCFCE7]",
                  onClick: () => setShowForm(true)
                }
              }}
              userInitials="VT"
            />

            {/* TAB SECTION */}
            <div className="flex gap-6 mb-8 mt-6">
              <button 
                onClick={() => setActiveTab('supplier')}
                className={`px-8 py-3 rounded-full font-bold border border-border-soft transition-all duration-300 ${activeTab === 'supplier' ? `bg-primary text-white border-primary shadow-apple-sm` : `bg-white text-slate-500 shadow-apple-sm`} ${pressApple}`}
              >
                Nhà cung cấp
              </button>
              <button 
                onClick={() => setActiveTab('customer')}
                className={`px-8 py-3 rounded-full font-bold border border-border-soft transition-all duration-300 ${activeTab === 'customer' ? `bg-status-info text-white border-sky-300 shadow-apple-sm` : `bg-white text-slate-500 shadow-apple-sm`} ${pressApple}`}
              >
                Khách hàng
              </button>
            </div>

            {/* LIST SECTION (Bento Grid) */}
            {isLoading ? (
              <div className="flex items-center justify-center p-20 text-slate-500"><p>Đang tải dữ liệu đối tác...</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {dataList.map((partner) => (
                  <div 
                    key={partner.id} 
                    onClick={() => setSelectedPartner(partner)}
                    className={`p-6 rounded-2xl cursor-pointer ${getCardColor()} hover:bg-opacity-90 transition-colors duration-200 relative group shadow-apple-md`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-white border border-border-soft flex items-center justify-center mb-4">
                       {activeTab === 'supplier' ? <Package className="text-primary" /> : <Users className="text-sky-600" />}
                    </div>
                    <h3 className="text-[17px] font-bold text-slate-900 mb-1 truncate">
                      {partner.company_name || partner.full_name}
                    </h3>
                    <p className="text-slate-600 text-[13px] mb-4 flex items-center gap-1"><Phone size={14}/> {partner.phone || 'Chưa cập nhật'}</p>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute top-6 right-6">
                       <button type="button" className={`w-8 h-8 flex items-center justify-center bg-white rounded-full border border-border-soft shadow-apple-sm ${pressApple}`} onClick={(e) => { e.stopPropagation(); /* handle edit */ }}>
                          <Edit2 size={14} className="text-slate-600" />
                       </button>
                       <button type="button" className={`w-8 h-8 flex items-center justify-center bg-white rounded-full border border-border-soft shadow-apple-sm ${pressApple}`} onClick={(e) => { e.stopPropagation(); /* handle delete */ }}>
                          <Trash2 size={14} className="text-rose-500" />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
          </main>
        </div>
      </div>

      {/* ── Modals ── */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <PartnerFormFactory type={activeTab} onClose={() => setShowForm(false)} onSubmit={handleAdd} />
        </div>
      )}

      {selectedPartner && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="w-full max-w-2xl p-8 rounded-[20px] bg-white border border-border-soft max-h-[90vh] overflow-y-auto shadow-apple-lg">
              
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center border border-border-soft ${activeTab === 'supplier' ? 'bg-primary/10' : 'bg-sky-50'}`}>
                  {activeTab === 'supplier' ? <Package className="w-8 h-8 text-primary" /> : <Users className="w-8 h-8 text-sky-600" />}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-900 leading-tight">
                     {selectedPartner.company_name || selectedPartner.full_name}
                  </h2>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-[11px] font-bold ${activeTab === 'supplier' ? 'bg-primary/15 text-blue-900' : 'bg-sky-100 text-sky-900'}`}>
                    {activeTab === 'supplier' ? 'Nhà cung cấp' : selectedPartner.customer_type}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-4 rounded-xl border border-border-soft shadow-apple-inset">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"><Phone size={14} className="text-slate-500" /></div>
                    <span className="font-semibold">{selectedPartner.phone || 'N/A'}</span>
                 </div>
                 <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-4 rounded-xl border border-border-soft shadow-apple-inset">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"><Mail size={14} className="text-slate-500" /></div>
                    <span className="font-semibold">{selectedPartner.email || 'N/A'}</span>
                 </div>
                 <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-4 rounded-xl col-span-2 border border-border-soft shadow-apple-inset">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"><MapPin size={14} className="text-slate-500" /></div>
                    <span className="font-semibold">{selectedPartner.address || 'N/A'}</span>
                 </div>
              </div>

              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">
                 <Package className="w-5 h-5 text-slate-500" /> Lịch sử giao dịch gần đây (Top 10)
              </h3>
              
              <div className="flex flex-col gap-3">
                 {selectedPartner.transactions?.length > 0 ? selectedPartner.transactions.map((tx: any) => (
                    <div key={tx.id} className="p-4 rounded-xl flex justify-between items-center bg-white border border-border-soft shadow-apple-sm">
                       <div>
                          <p className="font-bold text-slate-900">{tx.code}</p>
                          <p className="text-[12px] text-slate-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                       </div>
                       <div className="text-right">
                          <p className="font-bold text-emerald-600">{Number(tx.total_amount).toLocaleString()}đ</p>
                          <p className="text-[10px] font-bold tracking-widest uppercase mt-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 inline-block">{tx.type} • {tx.status}</p>
                       </div>
                    </div>
                 )) : <div className="text-center py-8 opacity-50"><Package size={40} className="mx-auto mb-2" /><p className="font-medium">Chưa có giao dịch nào.</p></div>}
              </div>

              <button type="button" onClick={() => setSelectedPartner(null)} className={`mt-8 w-full py-4 rounded-full font-bold text-slate-900 bg-slate-200 hover:bg-slate-300 border border-border-soft shadow-apple-sm ${pressApple}`}>
                 Đóng lại
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
