import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import KioskLayout from '@/components/layouts/KioskLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getPendingBills, getUserBills } from '@/db/api';
import { toast } from 'sonner';
import { generatePaymentReceipt } from '@/utils/receiptGenerator';

export default function Bills() {
  const { user } = useAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');

  useEffect(() => {
    if (user) loadBills();
  }, [user, filter]);

  const loadBills = async () => {
    try {
      setLoading(true);
      let data;
      if (filter === 'pending') {
        data = await getPendingBills(user!.id);
      } else {
        data = await getUserBills(user!.id);
        if (filter === 'paid') {
          data = data.filter(b => b.status === 'paid');
        }
      }
      setBills(data);
    } catch (error) {
      console.error('Error loading bills:', error);
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return { background: 'rgba(204,85,0,.1)', color: '#cc5500', label: 'Unpaid' };
      case 'paid': return { background: 'rgba(34,197,94,.1)', color: '#16a34a', label: 'Paid' };
      case 'overdue': return { background: 'rgba(239,68,68,.1)', color: '#dc2626', label: 'Overdue' };
      default: return { background: 'rgba(107,114,128,.1)', color: '#4b5563', label: status };
    }
  };

  return (
    <KioskLayout>
      <div className="flex flex-col pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-[#0e0d0b]">Utility Bills</h1>
            <p className="text-[0.8rem] font-semibold text-[#7a7368]">Pay and track your government utility bills</p>
          </div>
          <div className="flex bg-white rounded-[12px] border p-1" style={{ borderColor: 'rgba(14,13,11,.09)' }}>
            {(['all', 'pending', 'paid'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-[9px] text-[0.7rem] font-black uppercase transition-all ${
                  filter === f ? 'bg-[#0e0d0b] text-white' : 'text-[#7a7368] hover:bg-[#fafaf9]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Bills List */}
        <div className="flex-grow overflow-y-auto pr-2 scrollbar-hide">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#cc5500]"></div>
            </div>
          ) : bills.length > 0 ? (
            <div className="grid gap-4">
              {bills.map((bill) => {
                const status = getStatusStyle(bill.status);
                const isPending = bill.status !== 'paid';
                return (
                  <div 
                    key={bill.id}
                    className="rounded-[24px] border bg-white p-5 flex items-center justify-between transition-all hover:border-[#cc5500]/30"
                    style={{ borderColor: 'rgba(14,13,11,.09)', boxShadow: '0 2px 8px rgba(14,13,11,.05)' }}
                  >
                    <div className="flex gap-5">
                      <div 
                        className="h-14 w-14 rounded-[20px] flex items-center justify-center text-2xl"
                        style={{ background: isPending ? 'rgba(204,85,0,.1)' : 'rgba(34,197,94,.1)' }}
                      >
                        {bill.utility_services?.utility_type === 'electricity' ? '⚡' : '🚰'}
                      </div>
                      <div>
                        <h3 className="text-[1rem] font-black text-[#0e0d0b]">{bill.utility_services?.service_name || 'Utility Bill'}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[0.7rem] font-bold text-[#7a7368]">{bill.bill_number}</span>
                          <span className="text-[0.7rem] text-[#d1d0cf]">•</span>
                          <span className="text-[0.7rem] font-bold text-[#7a7368]">Due: {new Date(bill.due_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-[1.2rem] font-black text-[#0e0d0b]">₹{bill.amount}</div>
                        <div 
                          className="inline-block px-2 py-0.5 rounded text-[0.55rem] font-black uppercase tracking-tight"
                          style={{ backgroundColor: status.background, color: status.color }}
                        >
                          {status.label}
                        </div>
                      </div>
                      {isPending ? (
                        <Link 
                          to={`/bills/${bill.id}`}
                          className="px-6 py-2.5 rounded-[12px] bg-[#0e0d0b] text-white text-[0.75rem] font-black hover:opacity-90 transition-all shadow-lg"
                        >
                          Pay Now
                        </Link>
                      ) : (
                        <button 
                          onClick={async () => {
                            await generatePaymentReceipt({
                              billNumber: bill.bill_number || 'N/A',
                              transactionId: `TXN_${bill.id}`,
                              amount: bill.amount || 0,
                              serviceName: bill.utility_services?.service_name || 'Service',
                              serviceType: bill.utility_services?.utility_type || 'utility',
                              providerName: bill.utility_services?.provider_name || 'Smart Janseva Municipal Corp',
                              month: bill.billing_period_start ? new Date(bill.billing_period_start).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Current',
                              dueDate: bill.due_date || '',
                              paidAt: bill.updated_at || new Date().toISOString(),
                              payerName: (user as any)?.user_metadata?.full_name || 'Citizen',
                              payerEmail: user?.email || '',
                              paymentMethod: 'stripe',
                            });
                            toast.success('Receipt downloaded!');
                          }}
                          className="px-6 py-2.5 rounded-[12px] border border-green-200 bg-green-50 text-green-700 text-[0.75rem] font-black hover:bg-green-100 transition-all cursor-pointer"
                        >
                          📥 Receipt
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-[24px] border border-dashed border-[#d1d0cf]">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-[1rem] font-extrabold text-[#0e0d0b]">No bills found</h3>
              <p className="text-[0.75rem] font-semibold text-[#7a7368] mt-1">
                You're all caught up with your payments!
              </p>
            </div>
          )}
        </div>
      </div>
    </KioskLayout>
  );
}
