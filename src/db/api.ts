import { supabase } from './supabase';
export { supabase };
import type {
  Profile,
  UtilityService,
  Complaint,
  ServiceApplication,
  Notification,
  Announcement,
  ComplaintCategory,
  ServiceType,
} from '../types/types';

// ============ Profiles ============
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Profile[];
}

export async function updateUserRole(userId: string, role: string) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

// ============ Utility Services ============
export async function getUserUtilityServices(userId: string) {
  const { data, error } = await supabase
    .from('utility_services')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as UtilityService[];
}

export async function createUtilityService(service: Omit<UtilityService, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('utility_services')
    .insert(service)
    .select()
    .single();

  if (error) throw error;
  return data as UtilityService;
}

// ============ Bills ============
export async function getUserBills(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('bills')
    .select('*, utility_services(service_name, utility_type, provider_name)')
    .eq('user_id', userId)
    .order('due_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as any[];
}

export async function getPendingBills(userId: string) {
  const { data, error } = await supabase
    .from('bills')
    .select('*, utility_services(service_name, utility_type)')
    .eq('user_id', userId)
    .in('status', ['pending', 'overdue', 'partial'])
    .order('due_date', { ascending: true });

  if (error) throw error;
  return (data || []) as any[];
}

export async function getBillById(billId: string) {
  const { data, error } = await supabase
    .from('bills')
    .select('*, utility_services(*)')
    .eq('id', billId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ============ Payments ============
export async function getUserPayments(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('payments')
    .select('*, bills(bill_number, utility_services(service_name))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as any[];
}

export async function getPaymentById(paymentId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*, bills(*, utility_services(*))')
    .eq('id', paymentId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ============ Complaints ============
export async function getUserComplaints(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as Complaint[];
}

export async function getAllComplaints(limit = 50) {
  const { data, error } = await supabase
    .from('complaints')
    .select('*, profiles(full_name, email, phone)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as any[];
}

export async function createComplaint(complaint: Omit<Complaint, 'id' | 'complaint_number' | 'created_at' | 'updated_at'>) {
  // Generate complaint number
  const complaintNumber = `CMP${Date.now()}${Math.floor(Math.random() * 1000)}`;

  const { data, error } = await supabase
    .from('complaints')
    .insert({ ...complaint, complaint_number: complaintNumber })
    .select()
    .single();

  if (error) throw error;
  return data as Complaint;
}

export async function updateComplaint(complaintId: string, updates: Partial<Complaint>) {
  const { data, error } = await supabase
    .from('complaints')
    .update(updates)
    .eq('id', complaintId)
    .select()
    .single();

  if (error) throw error;
  return data as Complaint;
}

export async function getComplaintById(complaintId: string) {
  const { data, error } = await supabase
    .from('complaints')
    .select('*, profiles(full_name, email, phone)')
    .eq('id', complaintId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ============ Service Applications ============
export async function getUserServiceApplications(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('service_applications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as ServiceApplication[];
}

export async function getAllServiceApplications(limit = 50) {
  const { data, error } = await supabase
    .from('service_applications')
    .select('*, profiles(full_name, email, phone)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as any[];
}

export async function createServiceApplication(application: Omit<ServiceApplication, 'id' | 'application_number' | 'created_at' | 'updated_at'>) {
  // Generate application number
  const applicationNumber = `APP${Date.now()}${Math.floor(Math.random() * 1000)}`;

  const { data, error } = await supabase
    .from('service_applications')
    .insert({ ...application, application_number: applicationNumber })
    .select()
    .single();

  if (error) throw error;
  return data as ServiceApplication;
}

export async function updateServiceApplication(applicationId: string, updates: Partial<ServiceApplication>) {
  const { data, error } = await supabase
    .from('service_applications')
    .update(updates)
    .eq('id', applicationId)
    .select()
    .single();

  if (error) throw error;
  return data as ServiceApplication;
}

// ============ Notifications ============
export async function getUserNotifications(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as Notification[];
}

export async function getUnreadNotificationsCount(userId: string) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
}

export async function markNotificationAsRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) throw error;
}

export async function markAllNotificationsAsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
}

// ============ Announcements ============
export async function getActiveAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Announcement[];
}

export async function createAnnouncement(announcement: Omit<Announcement, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('announcements')
    .insert(announcement)
    .select()
    .single();

  if (error) throw error;
  return data as Announcement;
}

// ============ Complaint Categories ============
export async function getComplaintCategories() {
  const { data, error } = await supabase
    .from('complaint_categories')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return (data || []) as ComplaintCategory[];
}

// ============ Service Types ============
export async function getServiceTypes() {
  const { data, error } = await supabase
    .from('service_types')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return (data || []) as ServiceType[];
}

// ============ Analytics ============
export async function getDashboardStats(userId: string) {
  const [bills, payments, complaints, services] = await Promise.all([
    supabase.from('bills').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('service_applications').select('*', { count: 'exact', head: true }).eq('user_id', userId),
  ]);

  return {
    totalBills: bills.count || 0,
    totalPayments: payments.count || 0,
    totalComplaints: complaints.count || 0,
    totalServices: services.count || 0,
  };
}

export async function getAdminStats() {
  const [users, bills, payments, complaints, services] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('bills').select('*', { count: 'exact', head: true }),
    supabase.from('payments').select('amount').eq('status', 'completed'),
    supabase.from('complaints').select('*', { count: 'exact', head: true }),
    supabase.from('service_applications').select('*', { count: 'exact', head: true }),
  ]);

  const totalRevenue = payments.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  return {
    totalUsers: users.count || 0,
    totalBills: bills.count || 0,
    totalRevenue,
    totalComplaints: complaints.count || 0,
    totalServices: services.count || 0,
  };
}
