import App from '../App';
import BookMovie from '../Pages/BookMovie';
import DetailMovie from '../Pages/DetailMovie';
import Login from '../Pages/Login';
import Register from '../Pages/Register';
import PaymentSuccess from '../Pages/PaymentSuccess';
import ProfileUser from '../Pages/InfoUser/ProfileUser';
import Category from '../Pages/Category';
import Admin from '../Pages/Admin/Index';
import ForgotPassword from '../Pages/ForgotPassword';
import Staff from '../Pages/Staff/Staff';
import ProtectedRoute from '../Components/ProtectedRoute/ProtectedRoute';

export const routes = [
    {
        path: '/',
        component: <App />,
    },
    {
        path: '/movie/:id',
        component: <DetailMovie />,
    },
    {
        path: '/login',
        component: <Login />,
    },
    {
        path: '/register',
        component: <Register />,
    },
    {
        path: '/booking/:id',
        component: <BookMovie />,
    },
    {
        path: '/payment-success/:id',
        component: <PaymentSuccess />,
    },
    {
        path: '/profile',
        component: <ProfileUser />,
    },
    {
        path: '/settings',
        component: <ProfileUser />,
    },
    {
        path: '/category/:id',
        component: <Category />,
    },
    {
        // Chỉ Admin mới vào được
        path: '/admin',
        component: (
            <ProtectedRoute allowedRoles={['admin']} redirectTo="/">
                <Admin />
            </ProtectedRoute>
        ),
    },
    {
        path: '/forgot-password',
        component: <ForgotPassword />,
    },
    {
        // Nhân viên và Admin mới vào được
        path: '/staff',
        component: (
            <ProtectedRoute allowedRoles={['staff', 'admin']} redirectTo="/">
                <Staff />
            </ProtectedRoute>
        ),
    },
];
