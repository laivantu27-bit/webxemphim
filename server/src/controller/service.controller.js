const { BadRequestError } = require('../core/error.response');
const { OK, Created } = require('../core/success.response');

const modelService = require('../models/service.model');

const defaultServices = [
    {
        name: 'Combo Solo (1 Bắp + 1 Nước)',
        description: '1 Bắp rang bơ vị ngọt size L + 1 Nước ngọt size L (Coca/Sprite/Fanta)',
        price: 75000,
        image: 'https://images.unsplash.com/photo-1572177812156-58036aae439c?w=400&auto=format&fit=crop',
        category: 'combo',
        status: 'active',
    },
    {
        name: 'Combo Couple (1 Bắp + 2 Nước)',
        description: '1 Bắp rang bơ size L + 2 Nước ngọt size L tùy chọn',
        price: 99000,
        image: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400&auto=format&fit=crop',
        category: 'combo',
        status: 'active',
    },
    {
        name: 'Combo Family (2 Bắp + 3 Nước)',
        description: '2 Bắp rang bơ size L + 3 Nước ngọt size L + 1 Snack',
        price: 169000,
        image: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=400&auto=format&fit=crop',
        category: 'combo',
        status: 'active',
    },
    {
        name: 'Bắp rang bơ Ngọt (Size L)',
        description: 'Bắp rang bơ truyền thống vị ngọt béo giòn rụm',
        price: 45000,
        image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400&auto=format&fit=crop',
        category: 'food',
        status: 'active',
    },
    {
        name: 'Bắp rang bơ Phô Mai (Size L)',
        description: 'Bắp rang bơ lắc bột phô mai thơm ngon đậm đà',
        price: 55000,
        image: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400&auto=format&fit=crop',
        category: 'food',
        status: 'active',
    },
    {
        name: 'Bắp rang bơ Caramel (Size L)',
        description: 'Bắp rang bơ phủ lớp sốt caramel thơm lừng giòn tan',
        price: 55000,
        image: 'https://images.unsplash.com/photo-1572177812156-58036aae439c?w=400&auto=format&fit=crop',
        category: 'food',
        status: 'active',
    },
    {
        name: 'Xúc xích nướng tiêu đen',
        description: 'Xúc xích Đức nướng nóng hổi ăn kèm tương ớt',
        price: 35000,
        image: 'https://images.unsplash.com/photo-1627054234612-4217342674e2?w=400&auto=format&fit=crop',
        category: 'food',
        status: 'active',
    },
    {
        name: 'Coca-Cola (Size L - 32oz)',
        description: 'Nước ngọt có gas Coca-Cola mát lạnh',
        price: 30000,
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop',
        category: 'drink',
        status: 'active',
    },
    {
        name: 'Sprite (Size L - 32oz)',
        description: 'Nước ngọt vị chanh thanh mát đã khát',
        price: 30000,
        image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&auto=format&fit=crop',
        category: 'drink',
        status: 'active',
    },
    {
        name: 'Trà Đào Hạt Chia',
        description: 'Trà đào thơm mát cùng miếng đào giòn và hạt chia',
        price: 38000,
        image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&auto=format&fit=crop',
        category: 'drink',
        status: 'active',
    },
    {
        name: 'Nước khoáng Dasani (500ml)',
        description: 'Nước khoáng tinh khiết đóng chai 500ml',
        price: 20000,
        image: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=400&auto=format&fit=crop',
        category: 'drink',
        status: 'active',
    },
];

async function ensureDefaultServices() {
    const count = await modelService.count();
    if (count === 0) {
        for (const item of defaultServices) {
            await modelService.create(item);
        }
    }
}

class ServiceController {
    async createService(req, res) {
        const { name, description, price, image, category, status } = req.body;

        if (!name || !price) {
            throw new BadRequestError('Tên và giá dịch vụ là bắt buộc');
        }

        const service = await modelService.create({
            name,
            description: description || '',
            price,
            image: image || '',
            category: category || 'food',
            status: status || 'active',
        });

        new Created({
            message: 'Tạo dịch vụ thành công',
            metadata: service,
        }).send(res);
    }

    async getAllServices(req, res) {
        await ensureDefaultServices();
        const services = await modelService.findAll({
            order: [['createdAt', 'DESC']],
        });

        new OK({
            message: 'Lấy danh sách dịch vụ thành công',
            metadata: services,
        }).send(res);
    }

    async getActiveServices(req, res) {
        await ensureDefaultServices();
        const services = await modelService.findAll({
            where: { status: 'active' },
            order: [
                ['category', 'ASC'],
                ['name', 'ASC'],
            ],
        });

        new OK({
            message: 'Lấy danh sách dịch vụ thành công',
            metadata: services,
        }).send(res);
    }

    async updateService(req, res) {
        const { id, name, description, price, image, category, status } = req.body;

        const service = await modelService.findOne({ where: { id } });
        if (!service) {
            throw new BadRequestError('Không tìm thấy dịch vụ');
        }

        await service.update({
            name: name || service.name,
            description: description !== undefined ? description : service.description,
            price: price || service.price,
            image: image !== undefined ? image : service.image,
            category: category || service.category,
            status: status !== undefined ? status : service.status,
        });

        new OK({
            message: 'Cập nhật dịch vụ thành công',
            metadata: service,
        }).send(res);
    }

    async deleteService(req, res) {
        const { id } = req.query;
        const service = await modelService.findOne({ where: { id } });

        if (!service) {
            throw new BadRequestError('Không tìm thấy dịch vụ');
        }

        await service.destroy();

        new OK({
            message: 'Xóa dịch vụ thành công',
            metadata: service,
        }).send(res);
    }
}

module.exports = new ServiceController();
