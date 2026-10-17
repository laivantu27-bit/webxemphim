const { AuthFailureError, BadRequestError, ForbiddenError } = require('../core/error.response');
const { verifyToken } = require('../services/tokenServices');
const modelUser = require('../models/users.model');

const asyncHandler = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

const authUser = async (req, res, next) => {
    try {
        const user = req.cookies.token;
        if (!user) throw new AuthFailureError('Vui lòng đăng nhập');
        const token = user;
        const decoded = await verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        next(error);
    }
};

const authAdmin = async (req, res, next) => {
    try {
        const user = req.cookies.token;
        if (!user) throw new ForbiddenError('Bạn không có quyền truy cập');
        const token = user;
        const decoded = await verifyToken(token);
        const { id } = decoded;
        const findUser = await modelUser.findOne({ where: { id } });
        // Hỗ trợ cả isAdmin (cũ) và role (mới)
        const isAdmin = findUser.isAdmin !== '0' || findUser.role === 'admin';
        if (!isAdmin) {
            throw new ForbiddenError('Bạn không có quyền truy cập - Chỉ Admin');
        }
        req.user = decoded;
        next();
    } catch (error) {
        next(error);
    }
};

const authStaff = async (req, res, next) => {
    try {
        const user = req.cookies.token;
        if (!user) throw new ForbiddenError('Vui lòng đăng nhập');
        const token = user;
        const decoded = await verifyToken(token);
        const { id } = decoded;
        const findUser = await modelUser.findOne({ where: { id } });
        // Admin cũng có thể vào khu nhân viên
        const hasAccess =
            findUser.role === 'staff' ||
            findUser.role === 'admin' ||
            findUser.isAdmin !== '0';
        if (!hasAccess) {
            throw new ForbiddenError('Bạn không có quyền truy cập - Chỉ Nhân viên hoặc Admin');
        }
        req.user = decoded;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    asyncHandler,
    authUser,
    authAdmin,
    authStaff,
};

