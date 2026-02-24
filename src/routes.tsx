import { lazy } from 'react';
import type { ReactNode } from 'react';

const Home = lazy(() => import('@/pages/Home'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Bills = lazy(() => import('@/pages/Bills'));
const BillDetails = lazy(() => import('@/pages/BillDetails'));
const PaymentSuccess = lazy(() => import('@/pages/PaymentSuccess'));
const Complaints = lazy(() => import('@/pages/Complaints'));
const ComplaintDetails = lazy(() => import('@/pages/ComplaintDetails'));
const NewComplaint = lazy(() => import('@/pages/NewComplaint'));
const Services = lazy(() => import('@/pages/Services'));
const ServiceApplication = lazy(() => import('@/pages/ServiceApplication'));
const Profile = lazy(() => import('@/pages/Profile'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const MyReports = lazy(() => import('@/pages/MyReports'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminComplaints = lazy(() => import('@/pages/admin/AdminComplaints'));
const AdminServices = lazy(() => import('@/pages/admin/AdminServices'));
const AdminBills = lazy(() => import('@/pages/admin/AdminBills'));
const AdminAnnouncements = lazy(() => import('@/pages/admin/AdminAnnouncements'));
const Debug = lazy(() => import('@/pages/Debug'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const Forbidden = lazy(() => import('@/pages/Forbidden'));
const Accessibility = lazy(() => import('@/pages/Accessibility'));
const Sitemap = lazy(() => import('@/pages/Sitemap'));

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  icon?: string;
  roles?: string[];
}

const routes: RouteConfig[] = [
  {
    name: 'Home',
    path: '/',
    element: <Home />,
    visible: false,
  },
  {
    name: 'Dashboard',
    path: '/dashboard',
    element: <Dashboard />,
    visible: true,
    icon: '🏠',
    roles: ['citizen', 'officer', 'admin'],
  },
  {
    name: 'Login',
    path: '/login',
    element: <Login />,
  },
  {
    name: 'Register',
    path: '/register',
    element: <Register />,
  },
  {
    name: 'Bills',
    path: '/bills',
    element: <Bills />,
    visible: true,
    icon: '📄',
    roles: ['citizen'],
  },
  {
    name: 'Bill Details',
    path: '/bills/:id',
    element: <BillDetails />,
    roles: ['citizen'],
  },
  {
    name: 'Payment Success',
    path: '/payment-success',
    element: <PaymentSuccess />,
  },
  {
    name: 'Complaints',
    path: '/complaints',
    element: <Complaints />,
    visible: true,
    icon: '📝',
    roles: ['citizen'],
  },
  {
    name: 'New Complaint',
    path: '/complaints/new',
    element: <NewComplaint />,
    roles: ['citizen'],
  },
  {
    name: 'Complaint Details',
    path: '/complaints/:id',
    element: <ComplaintDetails />,
  },
  {
    name: 'Services',
    path: '/services',
    element: <Services />,
    visible: true,
    icon: '🏛️',
    roles: ['citizen'],
  },
  {
    name: 'Apply for Service',
    path: '/services/:id/apply',
    element: <ServiceApplication />,
    roles: ['citizen'],
  },
  {
    name: 'My Reports',
    path: '/my-reports',
    element: <MyReports />,
    visible: true,
    icon: '📊',
    roles: ['citizen'],
  },
  {
    name: 'Profile',
    path: '/profile',
    element: <Profile />,
    visible: true,
    icon: '👤',
  },
  {
    name: 'Notifications',
    path: '/notifications',
    element: <Notifications />,
  },
  {
    name: 'Admin Dashboard',
    path: '/admin',
    element: <AdminDashboard />,
    visible: true,
    icon: '⚙️',
    roles: ['admin', 'officer'],
  },
  {
    name: 'User Management',
    path: '/admin/users',
    element: <AdminUsers />,
    roles: ['admin'],
  },
  {
    name: 'Manage Complaints',
    path: '/admin/complaints',
    element: <AdminComplaints />,
    roles: ['admin', 'officer'],
  },
  {
    name: 'Manage Services',
    path: '/admin/services',
    element: <AdminServices />,
    roles: ['admin', 'officer'],
  },
  {
    name: 'Manage Bills',
    path: '/admin/bills',
    element: <AdminBills />,
    visible: true,
    icon: '🧾',
    roles: ['admin'],
  },
  {
    name: 'Broadcasts',
    path: '/admin/announcements',
    element: <AdminAnnouncements />,
    visible: true,
    icon: '📢',
    roles: ['admin', 'officer'],
  },
  {
    name: 'Forbidden',
    path: '/403',
    element: <Forbidden />,
  },
  {
    name: 'Accessibility Statement',
    path: '/accessibility',
    element: <Accessibility />,
  },
  {
    name: 'Sitemap',
    path: '/sitemap',
    element: <Sitemap />,
  },
  {
    name: 'Debug',
    path: '/debug',
    element: <Debug />,
  },
  {
    name: 'Not Found',
    path: '*',
    element: <NotFound />,
  },
];

export default routes;
