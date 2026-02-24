import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import KioskLayout from '@/components/layouts/KioskLayout';
import { getBillById, supabase } from '@/db/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { generatePaymentReceipt } from '@/utils/receiptGenerator';

export default function BillDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'choose' | 'card' | 'upi' | 'processing' | 'success'>('choose');
  const [cardDetails, setCardDetails] = useState({ number: '4242424242424242', expiry: '12/29', cvc: '123', name: '' });
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    if (id) loadBill();
  }, [id]);

  const loadBill = async () => {
    try {
      setLoading(true);
      const data = await getBillById(id!);
      if (!data) {
        toast.error('Bill not found');
        navigate('/bills');
        return;
      }
      setBill(data);
    } catch (error) {
      console.error('Error loading bill:', error);
      toast.error('Failed to load bill details');
    } finally {
      setLoading(false);
    }
  };

  const getBillingPeriod = () => {
    if (bill?.billing_period_start) {
      return new Date(bill.billing_period_start).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    }
    return 'Current';
  };

  const processPayment = async (method: 'stripe' | 'upi') => {
    if (!bill || !user) return;
    setPaying(true);
    setPaymentStep('processing');

    try {
      await new Promise(resolve => setTimeout(resolve, 2500));

      const transactionId = method === 'stripe'
        ? `pi_test_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
        : `upi_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      const { error: payError } = await (supabase.from('payments') as any).insert({
        user_id: user.id,
        bill_id: bill.id,
        amount: bill.amount,
        status: 'completed',
        transaction_id: transactionId,
        payment_method: method,
      });
      if (payError) throw payError;

      const { error: billError } = await (supabase.from('bills') as any)
        .update({ status: 'paid' })
        .eq('id', bill.id);
      if (billError) throw billError;

      setPaymentStep('success');
      toast.success('Payment Successful!');

      setTimeout(() => {
        generatePaymentReceipt({
          billNumber: bill.bill_number,
          transactionId,
          amount: bill.amount,
          serviceName: bill.utility_services?.service_name || 'Government Service',
          serviceType: bill.utility_services?.utility_type || 'utility',
          providerName: bill.utility_services?.provider_name || 'Smart Janseva Municipal Corp',
          month: getBillingPeriod(),
          dueDate: bill.due_date,
          paidAt: new Date().toISOString(),
          payerName: (profile as any)?.full_name || 'Citizen',
          payerEmail: (profile as any)?.email || user.email || '',
          paymentMethod: method,
        });
      }, 600);

    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error('Payment failed: ' + (error.message || 'Please try again.'));
      setPaymentStep('choose');
    } finally {
      setPaying(false);
    }
  };

  const handleDownloadReceipt = () => {
    if (!bill) return;
    generatePaymentReceipt({
      billNumber: bill.bill_number,
      transactionId: `pi_receipt_${Date.now()}`,
      amount: bill.amount,
      serviceName: bill.utility_services?.service_name || 'Government Service',
      serviceType: bill.utility_services?.utility_type || 'utility',
      providerName: bill.utility_services?.provider_name || 'Smart Janseva Municipal Corp',
      month: getBillingPeriod(),
      dueDate: bill.due_date,
      paidAt: new Date().toISOString(),
      payerName: (profile as any)?.full_name || 'Citizen',
      payerEmail: (profile as any)?.email || user?.email || '',
      paymentMethod: 'stripe',
    });
    toast.success('Receipt downloaded!');
  };

  if (loading) return <KioskLayout><div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#cc5500]"></div></div></KioskLayout>;

  const isPaid = bill?.status === 'paid';

  return (
    <KioskLayout>
      <div className="max-w-2xl mx-auto flex flex-col pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
        
        <button onClick={() => navigate('/bills')} className="flex items-center gap-2 mb-4 text-[0.75rem] font-bold text-[#7a7368] hover:text-[#0e0d0b] transition-colors">
          ← Back to Bills
        </button>

        {/* Bill Card */}
        <div className="bg-white rounded-[28px] border p-6 relative overflow-hidden" 
             style={{ borderColor: 'rgba(14,13,11,.09)', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
          
          {isPaid && <div className="absolute top-0 inset-x-0 h-1.5 bg-green-500" />}
          {!isPaid && <div className="absolute top-0 inset-x-0 h-1.5 bg-[#cc5500]" />}
          
          <div className="flex flex-col items-center mb-5 pt-2">
            <div className="h-14 w-14 rounded-[16px] bg-[#f8faff] flex items-center justify-center text-2xl mb-2 border border-[#eff4ff]">
              {bill.utility_services?.utility_type === 'electricity' ? '⚡' : 
               bill.utility_services?.utility_type === 'water' ? '🚰' : '🏛️'}
            </div>
            <h2 className="text-[1.1rem] font-black text-[#0e0d0b]">{bill.utility_services?.service_name || 'Government Bill'}</h2>
            <p className="text-[0.7rem] font-bold text-[#7a7368]">{bill.utility_services?.provider_name || 'Smart Janseva'}</p>
          </div>

          <div className="space-y-2.5 border-t border-b py-4 my-3" style={{ borderColor: 'rgba(14,13,11,.05)' }}>
            {[
              ['Bill Number', bill.bill_number],
              ['Due Date', new Date(bill.due_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })],
              ['Billing Period', getBillingPeriod()],
              ['Status', isPaid ? '✅ Paid' : '⏳ Pending'],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between items-center">
                <span className="text-[0.72rem] font-bold text-[#7a7368]">{label}</span>
                <span className={`text-[0.72rem] font-black ${label === 'Status' ? (isPaid ? 'text-green-600' : 'text-[#cc5500]') : 'text-[#0e0d0b]'}`}>{value}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mb-5">
            <span className="text-[0.85rem] font-black text-[#0e0d0b]">Total Amount</span>
            <span className="text-[1.5rem] font-black text-[#cc5500]">₹{bill.amount?.toLocaleString('en-IN')}</span>
          </div>

          {!isPaid ? (
            <button
              onClick={() => { setShowPaymentModal(true); setPaymentStep('choose'); }}
              className="w-full py-3 rounded-[14px] bg-[#0e0d0b] text-white text-[0.85rem] font-black hover:opacity-95 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              💳 Pay Now
            </button>
          ) : (
            <button
              onClick={handleDownloadReceipt}
              className="w-full py-3 rounded-[14px] bg-green-600 text-white text-[0.85rem] font-black hover:opacity-95 transition-all shadow-xl shadow-green-500/10 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              📥 Download Smart Janseva Receipt (PDF)
            </button>
          )}
        </div>

        <div className="mt-3 p-3 bg-[#fafaf9] rounded-xl border border-[#0e0d0b]/5 flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-8 w-8 rounded-lg object-contain" />
          <div>
            <div className="text-[0.7rem] font-black text-[#0e0d0b]">Smart Janseva Payment Gateway</div>
            <div className="text-[0.6rem] font-semibold text-[#7a7368]">Card (4242...) & UPI supported • Test Mode</div>
          </div>
        </div>

        {/* Payment Modal — scrollable overlay */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8 px-4 animate-in fade-in duration-200" onClick={(e) => { if (e.target === e.currentTarget && paymentStep === 'choose') setShowPaymentModal(false); }}>
            <div className="bg-white w-full max-w-md rounded-[20px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 my-auto" onClick={(e) => e.stopPropagation()}>
              
              {/* Header */}
              <div className="bg-[#0e0d0b] p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="" className="h-7 w-7 rounded object-contain bg-white p-0.5" />
                  <span className="text-white text-[0.8rem] font-bold">Smart Janseva Checkout</span>
                </div>
                {(paymentStep === 'choose' || paymentStep === 'card' || paymentStep === 'upi') && (
                  <button onClick={() => setShowPaymentModal(false)} className="text-white/70 hover:text-white text-lg leading-none">✕</button>
                )}
              </div>
              
              {/* Method Chooser */}
              {paymentStep === 'choose' && (
                <div className="p-5 space-y-4">
                  <div className="text-center mb-3">
                    <p className="text-[0.65rem] font-bold text-[#7a7368] uppercase tracking-wider">Paying for {bill.utility_services?.service_name || 'Bill'}</p>
                    <p className="text-[1.5rem] font-black text-[#0e0d0b]">₹{bill.amount?.toLocaleString('en-IN')}</p>
                  </div>

                  <button onClick={() => setPaymentStep('card')} className="w-full py-3.5 rounded-xl border-2 border-[#0e0d0b]/10 text-left px-4 hover:border-[#635BFF] hover:bg-[#635BFF]/5 transition-all flex items-center gap-3 group">
                    <div className="h-10 w-10 rounded-lg bg-[#635BFF] flex items-center justify-center text-white text-[0.7rem] font-black flex-shrink-0">💳</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.8rem] font-black text-[#0e0d0b]">Credit / Debit Card</div>
                      <div className="text-[0.6rem] font-semibold text-[#7a7368]">Visa, MasterCard, RuPay</div>
                    </div>
                    <span className="text-[#7a7368] group-hover:text-[#635BFF] text-sm">→</span>
                  </button>

                  <button onClick={() => setPaymentStep('upi')} className="w-full py-3.5 rounded-xl border-2 border-[#0e0d0b]/10 text-left px-4 hover:border-[#16a34a] hover:bg-green-50 transition-all flex items-center gap-3 group">
                    <div className="h-10 w-10 rounded-lg bg-[#16a34a] flex items-center justify-center text-white text-[0.65rem] font-black flex-shrink-0">UPI</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.8rem] font-black text-[#0e0d0b]">UPI Payment</div>
                      <div className="text-[0.6rem] font-semibold text-[#7a7368]">Google Pay, PhonePe, Paytm, BHIM</div>
                    </div>
                    <span className="text-[#7a7368] group-hover:text-[#16a34a] text-sm">→</span>
                  </button>

                  <button onClick={() => { setPaymentStep('processing'); processPayment('upi'); }} className="w-full py-3.5 rounded-xl border-2 border-[#0e0d0b]/10 text-left px-4 hover:border-[#cc5500] hover:bg-orange-50 transition-all flex items-center gap-3 group">
                    <div className="h-10 w-10 rounded-lg bg-[#cc5500] flex items-center justify-center text-white text-[0.65rem] font-black flex-shrink-0">🏦</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.8rem] font-black text-[#0e0d0b]">Net Banking</div>
                      <div className="text-[0.6rem] font-semibold text-[#7a7368]">SBI, HDFC, ICICI & more</div>
                    </div>
                    <span className="text-[#7a7368] group-hover:text-[#cc5500] text-sm">→</span>
                  </button>

                  <p className="text-center text-[0.55rem] font-semibold text-[#7a7368]">🔒 All payments secured by Smart Janseva • Test Mode</p>
                </div>
              )}

              {/* Card Form */}
              {paymentStep === 'card' && (
                <div className="p-5 space-y-3">
                  <button onClick={() => setPaymentStep('choose')} className="text-[0.65rem] font-bold text-[#7a7368] hover:text-[#0e0d0b] mb-1">← Back</button>
                  
                  <div className="text-center mb-2">
                    <p className="text-[0.6rem] font-bold text-[#7a7368] uppercase tracking-wider">Card Payment</p>
                    <p className="text-[1.4rem] font-black text-[#0e0d0b]">₹{bill.amount?.toLocaleString('en-IN')}</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[0.55rem] font-black uppercase tracking-wider text-[#7a7368]">Card Number</label>
                    <input value={cardDetails.number} onChange={e => setCardDetails(p => ({...p, number: e.target.value}))} placeholder="4242 4242 4242 4242"
                      className="w-full h-10 rounded-lg border bg-[#fafaf9] px-3 text-[0.8rem] font-mono font-bold outline-none border-[#e2e8f0] focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[0.55rem] font-black uppercase tracking-wider text-[#7a7368]">Expiry</label>
                      <input value={cardDetails.expiry} onChange={e => setCardDetails(p => ({...p, expiry: e.target.value}))} placeholder="MM/YY"
                        className="w-full h-10 rounded-lg border bg-[#fafaf9] px-3 text-[0.8rem] font-mono font-bold outline-none border-[#e2e8f0] focus:border-[#635BFF]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[0.55rem] font-black uppercase tracking-wider text-[#7a7368]">CVC</label>
                      <input value={cardDetails.cvc} onChange={e => setCardDetails(p => ({...p, cvc: e.target.value}))} placeholder="123"
                        className="w-full h-10 rounded-lg border bg-[#fafaf9] px-3 text-[0.8rem] font-mono font-bold outline-none border-[#e2e8f0] focus:border-[#635BFF]" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[0.55rem] font-black uppercase tracking-wider text-[#7a7368]">Name on Card</label>
                    <input value={cardDetails.name} onChange={e => setCardDetails(p => ({...p, name: e.target.value}))} placeholder={(profile as any)?.full_name || 'Your name'}
                      className="w-full h-10 rounded-lg border bg-[#fafaf9] px-3 text-[0.8rem] font-bold outline-none border-[#e2e8f0] focus:border-[#635BFF]" />
                  </div>

                  <button onClick={() => processPayment('stripe')} disabled={paying}
                    className="w-full py-3 rounded-lg bg-[#635BFF] text-white text-[0.85rem] font-black hover:bg-[#5046E5] transition-all">
                    Pay ₹{bill.amount?.toLocaleString('en-IN')}
                  </button>
                  <p className="text-center text-[0.55rem] font-semibold text-[#7a7368]">🔒 Stripe Test Mode • Card 4242...</p>
                </div>
              )}

              {/* UPI Form */}
              {paymentStep === 'upi' && (
                <div className="p-5 space-y-3">
                  <button onClick={() => setPaymentStep('choose')} className="text-[0.65rem] font-bold text-[#7a7368] hover:text-[#0e0d0b] mb-1">← Back</button>
                  
                  <div className="text-center mb-2">
                    <p className="text-[0.6rem] font-bold text-[#7a7368] uppercase tracking-wider">UPI Payment</p>
                    <p className="text-[1.4rem] font-black text-[#0e0d0b]">₹{bill.amount?.toLocaleString('en-IN')}</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[0.55rem] font-black uppercase tracking-wider text-[#7a7368]">UPI ID</label>
                    <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@upi"
                      className="w-full h-10 rounded-lg border bg-[#fafaf9] px-3 text-[0.8rem] font-bold outline-none border-[#e2e8f0] focus:border-[#16a34a] focus:ring-2 focus:ring-green-500/20" />
                  </div>

                  <div className="grid grid-cols-4 gap-2 py-2">
                    {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                      <button key={app} onClick={() => setUpiId(app.toLowerCase().replace(' ', '') + '@upi')}
                        className="py-2 px-1 rounded-lg border border-[#0e0d0b]/10 text-[0.55rem] font-black text-[#0e0d0b] hover:bg-green-50 hover:border-green-300 transition-all text-center">
                        {app}
                      </button>
                    ))}
                  </div>

                  <button onClick={() => processPayment('upi')} disabled={paying || !upiId}
                    className="w-full py-3 rounded-lg bg-[#16a34a] text-white text-[0.85rem] font-black hover:bg-[#15803d] transition-all disabled:opacity-50">
                    Pay via UPI
                  </button>
                  <p className="text-center text-[0.55rem] font-semibold text-[#7a7368]">🔒 UPI Test Mode</p>
                </div>
              )}

              {/* Processing */}
              {paymentStep === 'processing' && (
                <div className="p-8 flex flex-col items-center justify-center gap-3">
                  <div className="h-10 w-10 border-4 border-[#cc5500] border-t-transparent rounded-full animate-spin" />
                  <p className="text-[0.85rem] font-black text-[#0e0d0b]">Processing Payment...</p>
                  <p className="text-[0.65rem] font-bold text-[#7a7368]">Connecting to payment gateway</p>
                </div>
              )}

              {/* Success */}
              {paymentStep === 'success' && (
                <div className="p-6 flex flex-col items-center justify-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center text-2xl">✅</div>
                  <p className="text-[1rem] font-black text-[#0e0d0b]">Payment Confirmed!</p>
                  <p className="text-[0.75rem] font-bold text-[#7a7368] text-center">₹{bill.amount?.toLocaleString('en-IN')} paid. Receipt PDF downloaded.</p>
                  
                  <div className="flex gap-2 w-full mt-2">
                    <button onClick={handleDownloadReceipt} className="flex-1 py-2.5 rounded-lg border-2 border-[#0e0d0b] text-[#0e0d0b] text-[0.7rem] font-black hover:bg-[#fafaf9] transition-all">
                      📥 Receipt
                    </button>
                    <button onClick={() => navigate('/dashboard')} className="flex-1 py-2.5 rounded-lg bg-[#0e0d0b] text-white text-[0.7rem] font-black hover:opacity-90 transition-all">
                      Dashboard
                    </button>
                  </div>
                </div>
              )}
              
            </div>
          </div>
        )}

      </div>
    </KioskLayout>
  );
}
