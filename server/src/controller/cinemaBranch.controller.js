const CinemaBranch = require('../models/cinemaBranch.model');
const { OK, Created } = require('../core/success.response');
const { BadRequestError } = require('../core/error.response');

const SEED_BRANCHES = [
    {
        name: 'CGV Vincom Center Đồng Khởi',
        brand: 'CGV',
        address: 'Tầng 3, TTTM Vincom Center, 72 Lê Thánh Tôn & 45A Lý Tự Trọng, P. Bến Nghé, Quận 1',
        province: 'Hồ Chí Minh',
        city: 'Quận 1',
        lat: 10.7779,
        lng: 106.7018,
        phone: '1900 6017',
        totalRooms: 10,
        imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop',
        openHours: '08:00 - 24:00',
    },
    {
        name: 'CGV Crescent Mall',
        brand: 'CGV',
        address: 'Lầu 5, Crescent Mall, Đại lộ Nguyễn Văn Linh, Phú Mỹ Hưng, P. Tân Phú, Quận 7',
        province: 'Hồ Chí Minh',
        city: 'Quận 7',
        lat: 10.7295,
        lng: 106.7189,
        phone: '1900 6017',
        totalRooms: 8,
        imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop',
        openHours: '08:30 - 23:30',
    },
    {
        name: 'CGV Landmark 81',
        brand: 'CGV',
        address: 'Tầng B1, TTTM Vincom Center Landmark 81, 720A Điện Biên Phủ, P. 22, Bình Thạnh',
        province: 'Hồ Chí Minh',
        city: 'Bình Thạnh',
        lat: 10.7951,
        lng: 106.7218,
        phone: '1900 6017',
        totalRooms: 7,
        imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop',
        openHours: '08:00 - 24:00',
    },
    {
        name: 'CGV SC VivoCity',
        brand: 'CGV',
        address: 'Lầu 5, TTTM SC VivoCity, 1058 Nguyễn Văn Linh, P. Tân Phong, Quận 7',
        province: 'Hồ Chí Minh',
        city: 'Quận 7',
        lat: 10.7303,
        lng: 106.7077,
        phone: '1900 6017',
        totalRooms: 7,
        imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&auto=format&fit=crop',
        openHours: '08:30 - 23:30',
    },
    {
        name: 'CGV Vincom Center Bà Triệu',
        brand: 'CGV',
        address: 'Tầng 6, Vincom Center Hà Nội, 191 Bà Triệu, Q. Hai Bà Trưng',
        province: 'Hà Nội',
        city: 'Hai Bà Trưng',
        lat: 21.0115,
        lng: 105.8490,
        phone: '1900 6017',
        totalRooms: 10,
        imageUrl: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=800&auto=format&fit=crop',
        openHours: '08:00 - 24:00',
    },
    {
        name: 'CGV Aeon Mall Long Biên',
        brand: 'CGV',
        address: 'Tầng 4, TTTM AEON MALL Long Biên, 27 Cổ Linh, Q. Long Biên',
        province: 'Hà Nội',
        city: 'Long Biên',
        lat: 21.0267,
        lng: 105.8986,
        phone: '1900 6017',
        totalRooms: 10,
        imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop',
        openHours: '08:30 - 23:30',
    },
    {
        name: 'CGV Vincom Royal City',
        brand: 'CGV',
        address: 'Tầng B2, TTTM Vincom Mega Mall Royal City, 72A Nguyễn Trãi, Q. Thanh Xuân',
        province: 'Hà Nội',
        city: 'Thanh Xuân',
        lat: 21.0028,
        lng: 105.8157,
        phone: '1900 6017',
        totalRooms: 9,
        imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop',
        openHours: '08:30 - 23:30',
    },
    {
        name: 'CGV Vincom Plaza Đà Nẵng',
        brand: 'CGV',
        address: 'Tầng 4, TTTM Vincom Plaza Đà Nẵng, Ngô Quyền, P. An Hải Bắc, Q. Sơn Trà',
        province: 'Đà Nẵng',
        city: 'Sơn Trà',
        lat: 16.0716,
        lng: 108.2319,
        phone: '1900 6017',
        totalRooms: 5,
        imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop',
        openHours: '08:30 - 23:30',
    },
    {
        name: 'CGV Vincom Plaza Xuân Khánh',
        brand: 'CGV',
        address: 'Tầng 5, TTTM Vincom Plaza Xuân Khánh, 209 Đường 30/4, P. Xuân Khánh, Q. Ninh Kiều',
        province: 'Cần Thơ',
        city: 'Ninh Kiều',
        lat: 10.0242,
        lng: 105.7725,
        phone: '1900 6017',
        totalRooms: 6,
        imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&auto=format&fit=crop',
        openHours: '08:30 - 23:30',
    },
    {
        name: 'CGV Vincom Plaza Hải Phòng',
        brand: 'CGV',
        address: 'Tầng 4, TTTM Vincom Plaza, 1 Lê Thánh Tông, P. Máy Tơ, Q. Ngô Quyền',
        province: 'Hải Phòng',
        city: 'Ngô Quyền',
        lat: 20.8653,
        lng: 106.6917,
        phone: '1900 6017',
        totalRooms: 5,
        imageUrl: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=800&auto=format&fit=crop',
        openHours: '08:30 - 23:00',
    },
    {
        name: 'CGV Vincom Plaza Biên Hòa',
        brand: 'CGV',
        address: 'Tầng 3, TTTM Vincom Plaza Biên Hòa, 1096 Phạm Văn Thuận, P. Tân Mai',
        province: 'Đồng Nai',
        city: 'Biên Hòa',
        lat: 10.9575,
        lng: 106.8427,
        phone: '1900 6017',
        totalRooms: 5,
        imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop',
        openHours: '08:30 - 23:00',
    },
    {
        name: 'CGV Aeon Mall Canary Bình Dương',
        brand: 'CGV',
        address: 'Tầng 2, TTTM AEON MALL Canary Bình Dương, Đại lộ Bình Dương, P. Thuận Giao, TP. Thuận An',
        province: 'Bình Dương',
        city: 'Thuận An',
        lat: 10.9322,
        lng: 106.7028,
        phone: '1900 6017',
        totalRooms: 7,
        imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop',
        openHours: '08:30 - 23:30',
    },
];

class CinemaBranchController {
    /**
     * Lấy toàn bộ danh sách cụm rạp
     */
    async getAllBranches(req, res) {
        const { province } = req.query;
        const where = { status: 'active' };
        if (province && province !== 'all') {
            where.province = province;
        }

        let branches = await CinemaBranch.findAll({
            where,
            order: [['province', 'ASC'], ['name', 'ASC']],
        });

        // Nếu DB chưa có dữ liệu, tự động khởi tạo dữ liệu mẫu
        if (branches.length === 0) {
            await CinemaBranch.bulkCreate(SEED_BRANCHES);
            branches = await CinemaBranch.findAll({ order: [['province', 'ASC']] });
        }

        new OK({ message: 'Lấy danh sách chi nhánh rạp thành công', metadata: branches }).send(res);
    }

    /**
     * Lấy chi tiết 1 rạp
     */
    async getBranchById(req, res) {
        const { id } = req.query;
        const branch = await CinemaBranch.findByPk(id);
        if (!branch) throw new BadRequestError('Không tìm thấy chi nhánh rạp');
        new OK({ message: 'Lấy chi tiết rạp thành công', metadata: branch }).send(res);
    }

    /**
     * Khởi tạo hoặc cập nhật lại danh sách rạp CGV mẫu
     */
    async seedBranches(req, res) {
        for (const item of SEED_BRANCHES) {
            const found = await CinemaBranch.findOne({ where: { name: item.name } });
            if (!found) {
                await CinemaBranch.create(item);
            }
        }
        const all = await CinemaBranch.findAll();
        new Created({ message: 'Khởi tạo chi nhánh rạp thành công', metadata: all }).send(res);
    }

    /**
     * Tạo mới rạp (Admin)
     */
    async createBranch(req, res) {
        const branch = await CinemaBranch.create(req.body);
        new Created({ message: 'Tạo chi nhánh rạp thành công', metadata: branch }).send(res);
    }

    /**
     * Cập nhật rạp (Admin)
     */
    async updateBranch(req, res) {
        const { id, ...data } = req.body;
        const branch = await CinemaBranch.findByPk(id);
        if (!branch) throw new BadRequestError('Không tìm thấy chi nhánh rạp');
        await branch.update(data);
        new OK({ message: 'Cập nhật chi nhánh rạp thành công', metadata: branch }).send(res);
    }

    /**
     * Xóa rạp (Admin)
     */
    async deleteBranch(req, res) {
        const { id } = req.body;
        const branch = await CinemaBranch.findByPk(id);
        if (!branch) throw new BadRequestError('Không tìm thấy chi nhánh rạp');
        await branch.destroy();
        new OK({ message: 'Xóa chi nhánh rạp thành công', metadata: branch }).send(res);
    }
}

module.exports = new CinemaBranchController();

