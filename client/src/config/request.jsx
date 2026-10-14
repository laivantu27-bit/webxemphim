import axios from 'axios';

import { apiClient } from './axiosClient';

const request = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

const apiUser = '/api/users';

export const requestRegister = async (data) => {
    const res = await request.post(`${apiUser}/register`, data);
    return res;
};

export const requestLogin = async (data) => {
    const res = await request.post(`${apiUser}/login`, data);
    return res;
};

export const requestLoginGoogle = async (data) => {
    const res = await request.post(`${apiUser}/login-google`, data);
    return res;
};

export const requestAuth = async () => {
    const res = await apiClient.get(`${apiUser}/auth`);
    return res.data;
};

export const requestLogout = async () => {
    const res = await apiClient.get(`${apiUser}/logout`);
    return res.data;
};

export const requestRefreshToken = async () => {
    const res = await request.get(`${apiUser}/refresh-token`);
    return res.data;
};

export const requestUpdateUser = async (data) => {
    const res = await apiClient.post(`${apiUser}/update-user`, data);
    return res.data;
};

export const requestUpdatePassword = async (data) => {
    const res = await apiClient.post(`${apiUser}/update-password`, data);
    return res.data;
};

export const requestGetUserByAdmin = async () => {
    const res = await apiClient.get(`${apiUser}/admin`);
    return res.data;
};

export const requestUpdateRoleUser = async (data) => {
    const res = await apiClient.post(`${apiUser}/update-role-user`, data);
    return res.data;
};

export const requestForgotPassword = async (data) => {
    const res = await request.post(`${apiUser}/forgot-password`, data);
    return res.data;
};

export const requestResetPassword = async (data) => {
    const res = await request.post(`${apiUser}/reset-password`, data);
    return res.data;
};

/// movie
const apiMovie = '/api/movie';

export const requestFindMovieNew = async () => {
    const res = await apiClient.get(`${apiMovie}/movie`);
    return res.data;
};

export const requestUploadImage = async (data) => {
    const res = await apiClient.post(`${apiMovie}/upload-image`, data);
    return res.data;
};

export const requestGetAllMovie = async () => {
    const res = await apiClient.get(`${apiMovie}/all`);
    return res.data;
};

export const requestGetMovieById = async (id) => {
    const res = await apiClient.get(`${apiMovie}/detail`, { params: { id } });
    return res.data;
};

export const requestGetSeatByMovieId = async (data) => {
    const res = await apiClient.get(`${apiMovie}/seat`, {
        params: data,
    });
    return res.data;
};

export const requestCreateMovie = async (data) => {
    const res = await apiClient.post(`${apiMovie}/create`, data);
    return res.data;
};

export const requestUpdateMovie = async (data) => {
    const res = await apiClient.post(`${apiMovie}/update`, data);
    return res.data;
};

export const requestDeleteMovie = async (id) => {
    const res = await apiClient.post(`${apiMovie}/delete`, { id });
    return res.data;
};

export const requestSearchMovie = async (name) => {
    const res = await request.get(`${apiMovie}/search`, { params: { name } });
    return res.data;
};

//// payments
const apiPayments = '/api/payments';

export const requestCreatePayment = async (data) => {
    const res = await apiClient.post(`${apiPayments}/create`, data);
    return res.data;
};

export const requestGetPaymentById = async (id) => {
    const res = await apiClient.get(`${apiPayments}/detail`, {
        params: {
            id,
        },
    });
    return res.data;
};

export const requestGetPaymentByUserId = async () => {
    const res = await apiClient.get(`${apiPayments}/user`);
    return res.data;
};

export const requestGetPaymentByAdmin = async () => {
    const res = await apiClient.get(`${apiPayments}/admin`);
    return res.data;
};

export const requestUpdatePaymentStatus = async (data) => {
    const res = await apiClient.post(`${apiPayments}/update-status`, data);
    return res.data;
};

export const requestCancelBooking = async (data) => {
    const res = await apiClient.post(`${apiPayments}/cancel-booking`, data);
    return res.data;
};

export const requestAddServicesToPayment = async (data) => {
    const res = await apiClient.post(`${apiPayments}/add-services`, data);
    return res.data;
};

/// category
const apiCategory = '/api/category';

export const requestGetAllCategory = async () => {
    const res = await apiClient.get(`${apiCategory}/all`);
    return res.data;
};

export const requestCreateCategory = async (data) => {
    const res = await apiClient.post(`${apiCategory}/create`, data);
    return res.data;
};

export const requestUpdateCategory = async (data) => {
    const res = await apiClient.post(`${apiCategory}/update`, data);
    return res.data;
};

export const requestDeleteCategory = async (id) => {
    const res = await apiClient.delete(`${apiCategory}/delete`, {
        params: {
            id,
        },
    });
    return res.data;
};

export const requestGetMovieByCategory = async (id) => {
    const res = await apiClient.get(`${apiCategory}/movie`, {
        params: {
            id,
        },
    });
    return res.data;
};

// Dashboard API endpoints
export const requestDashboard = async (params) => {
    const res = await apiClient.get(`${apiUser}/dashboard`, { params });
    return res.data;
};

export const requestGetOrderStats = async (params) => {
    const res = await apiClient.get(`${apiUser}/dashboard`, {
        params: { ...params, chartData: 'orderStats' },
    });
    return res.data;
};

export const requestGetPieChartData = async () => {
    const res = await apiClient.get(`${apiUser}/dashboard`, {
        params: { chartData: 'pieCharts' },
    });
    return res.data;
};

//// preview movie
const apiPreviewMovie = '/api/preview-movie';

export const requestCreatePreviewMovie = async (data) => {
    const res = await apiClient.post(`${apiPreviewMovie}/create`, data);
    return res.data;
};

//// room
const apiRoom = '/api/room';

export const requestGetAllRooms = async () => {
    const res = await apiClient.get(`${apiRoom}/all`);
    return res.data;
};

export const requestCreateRoom = async (data) => {
    const res = await apiClient.post(`${apiRoom}/create`, data);
    return res.data;
};

export const requestUpdateRoom = async (data) => {
    const res = await apiClient.post(`${apiRoom}/update`, data);
    return res.data;
};

export const requestDeleteRoom = async (id) => {
    const res = await apiClient.delete(`${apiRoom}/delete`, {
        params: { id },
    });
    return res.data;
};

//// services (snacks & drinks)
const apiService = '/api/service';

export const requestGetAllServices = async () => {
    const res = await apiClient.get(`${apiService}/all`);
    return res.data;
};

export const requestGetActiveServices = async () => {
    const res = await apiClient.get(`${apiService}/active`);
    return res.data;
};

export const requestCreateService = async (data) => {
    const res = await apiClient.post(`${apiService}/create`, data);
    return res.data;
};

export const requestUpdateService = async (data) => {
    const res = await apiClient.post(`${apiService}/update`, data);
    return res.data;
};

export const requestDeleteService = async (id) => {
    const res = await apiClient.delete(`${apiService}/delete`, {
        params: { id },
    });
    return res.data;
};

//// chatbot
const apiChatbot = '/api/chatbot';

export const requestChatbot = async (data) => {
    const res = await request.post(`${apiChatbot}/chat`, data);
    return res.data;
};

//// staff
const apiStaff = '/api/staff';

export const requestStaffGetTicketByCode = async (code) => {
    const res = await apiClient.get(`${apiStaff}/ticket/${code}`);
    return res.data;
};

export const requestStaffCheckIn = async (data) => {
    const res = await apiClient.post(`${apiStaff}/check-in`, data);
    return res.data;
};

export const requestStaffSellTicket = async (data) => {
    const res = await apiClient.post(`${apiStaff}/sell-ticket`, data);
    return res.data;
};

export const requestStaffGetRooms = async () => {
    const res = await apiClient.get(`${apiStaff}/rooms`);
    return res.data;
};

export const requestStaffGetSeats = async (params) => {
    const res = await apiClient.get(`${apiStaff}/seats`, { params });
    return res.data;
};

export const requestStaffUpdateSeatMaintenance = async (data) => {
    const res = await apiClient.post(`${apiStaff}/seat-maintenance`, data);
    return res.data;
};

export const requestStaffGetShiftReport = async (params) => {
    const res = await apiClient.get(`${apiStaff}/shift-report`, { params });
    return res.data;
};

export const requestStaffGetTransactions = async (params) => {
    const res = await apiClient.get(`${apiStaff}/transactions`, { params });
    return res.data;
};

export const requestStaffCancelTransaction = async (data) => {
    const res = await apiClient.post(`${apiStaff}/cancel-transaction`, data);
    return res.data;
};

//// vouchers (khuyến mãi & giảm giá)
const apiVoucher = '/api/voucher';

export const requestGetAllVouchers = async () => {
    const res = await apiClient.get(`${apiVoucher}/all`);
    return res.data;
};

export const requestGetActiveVouchers = async () => {
    const res = await request.get(`${apiVoucher}/active`);
    return res.data;
};

export const requestCheckVoucher = async (data) => {
    const res = await request.post(`${apiVoucher}/check`, data);
    return res.data;
};

export const requestCreateVoucher = async (data) => {
    const res = await apiClient.post(`${apiVoucher}/create`, data);
    return res.data;
};

export const requestUpdateVoucher = async (data) => {
    const res = await apiClient.post(`${apiVoucher}/update`, data);
    return res.data;
};

export const requestDeleteVoucher = async (id) => {
    const res = await apiClient.delete(`${apiVoucher}/delete`, {
        data: { id },
    });
    return res.data;
};

