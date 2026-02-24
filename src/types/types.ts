// SMART JANSEVA Type Definitions

export type UserRole = 'citizen' | 'officer' | 'admin';

export type UtilityType = 'electricity' | 'water' | 'gas' | 'sanitation' | 'municipal';

export type BillStatus = 'pending' | 'paid' | 'overdue' | 'partial';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type ComplaintStatus = 'submitted' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed' | 'escalated';

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ServiceApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'completed';

export type NotificationType = 'bill' | 'payment' | 'complaint' | 'service' | 'announcement' | 'alert';

// User Profile
export interface Profile {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  role: UserRole;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  avatar_url: string | null;
  language_preference: string;
  accessibility_mode: string | null;
  created_at: string;
  updated_at: string;
}

// Utility Service
export interface UtilityService {
  id: string;
  user_id: string;
  utility_type: UtilityType;
  service_number: string;
  service_name: string;
  provider_name: string;
  connection_address: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Bill
export interface Bill {
  id: string;
  user_id: string;
  utility_service_id: string;
  bill_number: string;
  bill_date: string;
  due_date: string;
  amount: number;
  amount_paid: number;
  status: BillStatus;
  billing_period_start: string;
  billing_period_end: string;
  consumption_units: number | null;
  late_fee: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Payment
export interface Payment {
  id: string;
  user_id: string;
  bill_id: string | null;
  payment_method: string;
  amount: number;
  status: PaymentStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  receipt_url: string | null;
  receipt_qr_code: string | null;
  transaction_date: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Complaint
export interface Complaint {
  id: string;
  user_id: string;
  complaint_number: string;
  category: string;
  subcategory: string | null;
  title: string;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  attachments: string[];
  assigned_to: string | null;
  resolution_notes: string | null;
  satisfaction_rating: number | null;
  satisfaction_feedback: string | null;
  sla_deadline: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

// Service Application
export interface ServiceApplication {
  id: string;
  user_id: string;
  application_number: string;
  service_type: string;
  service_name: string;
  form_data: Record<string, any>;
  documents: string[];
  status: ServiceApplicationStatus;
  assigned_to: string | null;
  review_notes: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Notification
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

// Announcement
export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'alert' | 'emergency';
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  target_roles: UserRole[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Analytics Data
export interface ConsumptionAnalytics {
  utility_service_id: string;
  period: string;
  consumption: number;
  cost: number;
  comparison: number;
}

export interface SystemAnalytics {
  total_users: number;
  active_users: number;
  total_bills: number;
  total_payments: number;
  total_complaints: number;
  resolved_complaints: number;
  pending_services: number;
  revenue: number;
}

// Chat Message
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// OTP Verification
export interface OTPVerification {
  id: string;
  identifier: string; // email or phone
  otp_code: string;
  otp_type: 'email' | 'phone';
  expires_at: string;
  attempts: number;
  verified: boolean;
  created_at: string;
}

// Saved Biller
export interface SavedBiller {
  id: string;
  user_id: string;
  biller_name: string;
  biller_id: string;
  utility_type: UtilityType;
  nickname: string | null;
  is_autopay_enabled: boolean;
  created_at: string;
}

// Complaint Category
export interface ComplaintCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  subcategories: string[];
  sla_hours: number;
  is_active: boolean;
}

// Service Type
export interface ServiceType {
  id: string;
  name: string;
  description: string;
  icon: string;
  form_schema: Record<string, any>;
  required_documents: string[];
  processing_time_days: number;
  is_active: boolean;
}
