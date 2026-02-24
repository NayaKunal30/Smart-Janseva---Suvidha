import { useLocation, useNavigate, Link } from 'react-router-dom';
import KioskLayout from '@/components/layouts/KioskLayout';
import { generatePaymentReceipt } from '@/utils/receiptGenerator';
import { toast } from 'sonner';

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { bill, transactionId } = location.state || {};

  const handleDownloadReceipt = async () => {
    if (!bill) return;
    await generatePaymentReceipt({
      billNumber: bill.bill_number || 'N/A',
      transactionId: transactionId || `TXN_${Date.now()}`,
      amount: bill.amount || 0,
      serviceName: bill.utility_services?.service_name || 'Government Service',
      serviceType: bill.utility_services?.utility_type || 'utility',
      providerName: bill.utility_services?.provider_name || 'Smart Janseva Municipal Corp',
      month: bill.billing_period_start ? new Date(bill.billing_period_start).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Current',
      dueDate: bill.due_date || '',
      paidAt: new Date().toISOString(),
      payerName: 'Citizen',
      payerEmail: '',
      paymentMethod: 'stripe',
    });
    toast.success('Receipt PDF downloaded!');
  };

  if (!bill) {
    return (
      <KioskLayout>
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-black">Invalid Session</h2>
          <Link to="/dashboard" className="px-6 py-2 bg-black text-white rounded-xl font-bold">Return Home</Link>
        </div>
      </KioskLayout>
    );
  }

  return (
    <KioskLayout>
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-10 animate-in zoom-in duration-500">
        
        <div className="bg-white rounded-[32px] border p-10 text-center w-full relative overflow-hidden"
              style={{ borderColor: 'rgba(14,13,11,.09)', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
          
          <div className="absolute top-0 inset-x-0 h-2 bg-green-500" />
          
          <div className="mb-6">
            <div className="h-20 w-20 rounded-full bg-green-50 border-4 border-white flex items-center justify-center text-4xl mx-auto shadow-xl shadow-green-500/10 mb-4 animate-bounce">
              ✅
            </div>
            <h1 className="text-[1.6rem] font-black text-[#0e0d0b]">Payment Successful!</h1>
            <p className="text-[0.85rem] font-bold text-[#7a7368] mt-1">Funds received and invoice cleared</p>
          </div>

          <div className="bg-[#fafaf9] rounded-[20px] p-6 mb-8 space-y-3 border border-[#0e0d0b]/5">
            <div className="flex justify-between items-center text-[0.8rem] font-bold">
              <span className="text-[#7a7368]">Transaction ID</span>
              <span className="text-[#0e0d0b] font-mono text-[0.7rem]">{transactionId || 'TXN_VERIFIED'}</span>
            </div>
            <div className="h-px bg-[#0e0d0b]/5" />
            <div className="flex justify-between items-center text-[0.8rem] font-bold">
              <span className="text-[#7a7368]">Amount Paid</span>
              <span className="text-[#16a34a] text-[1.1rem] font-black">₹{bill.amount?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center text-[0.8rem] font-bold">
              <span className="text-[#7a7368]">Service</span>
              <span className="text-[#0e0d0b]">{bill.utility_services?.service_name || 'Government Fee'}</span>
            </div>
            <div className="flex justify-between items-center text-[0.8rem] font-bold">
              <span className="text-[#7a7368]">Payment via</span>
              <span className="text-[#635BFF] font-black">Stripe</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleDownloadReceipt}
              className="w-full py-3.5 rounded-xl bg-white border-2 border-[#0e0d0b] text-[#0e0d0b] text-[0.85rem] font-black hover:bg-[#fafaf9] transition-all flex items-center justify-center gap-2"
            >
              📥 Download Suvidha Receipt (PDF)
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3.5 rounded-xl bg-[#0e0d0b] text-white text-[0.85rem] font-black hover:opacity-90 transition-all shadow-xl shadow-black/10"
            >
              Return to Dashboard
            </button>
          </div>
        </div>

        <p className="mt-8 text-[0.65rem] font-bold text-[#7a7368] uppercase tracking-widest text-center">
          Payment processed securely via Stripe Gateway
        </p>
      </div>
    </KioskLayout>
  );
}
