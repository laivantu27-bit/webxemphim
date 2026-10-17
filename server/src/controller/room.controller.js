const { BadRequestError } = require('../core/error.response');
const { OK, Created } = require('../core/success.response');

const modelRoom = require('../models/room.model');

class RoomController {
    async createRoom(req, res) {
        const { name, cinema, totalRows, seatsPerRow, type, status, cinemaBranchId } = req.body;

        if (!name || !cinema || !totalRows || !seatsPerRow) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin phòng chiếu');
        }

        if (totalRows < 1 || totalRows > 26) {
            throw new BadRequestError('Số hàng ghế phải từ 1 đến 26');
        }

        if (seatsPerRow < 1 || seatsPerRow > 30) {
            throw new BadRequestError('Số ghế mỗi hàng phải từ 1 đến 30');
        }

        const room = await modelRoom.create({
            name,
            cinema,
            cinemaBranchId: cinemaBranchId || null,
            totalRows,
            seatsPerRow,
            type: type || '2D',
            status: status || 'active',
        });

        new Created({
            message: 'Tạo phòng chiếu thành công',
            metadata: room,
        }).send(res);
    }

    async getAllRooms(req, res) {
        let rooms = await modelRoom.findAll({
            order: [['createdAt', 'DESC']],
        });

        if (rooms.length === 0) {
            try {
                const CinemaBranch = require('../models/cinemaBranch.model');
                const branches = await CinemaBranch.findAll();
                if (branches && branches.length > 0) {
                    const sampleRooms = [
                        {
                            name: 'Phòng 01 (Cinema 1)',
                            cinema: branches[0]?.name || 'CGV Vincom Center Đồng Khởi',
                            cinemaBranchId: branches[0]?.id || null,
                            totalRows: 8,
                            seatsPerRow: 12,
                            type: '2D',
                            status: 'active',
                        },
                        {
                            name: 'Phòng 02 (IMAX Laser)',
                            cinema: branches[1]?.name || 'CGV Landmark 81',
                            cinemaBranchId: branches[1]?.id || null,
                            totalRows: 8,
                            seatsPerRow: 12,
                            type: 'IMAX',
                            status: 'active',
                        },
                        {
                            name: 'Phòng 03 (Gold Class VIP)',
                            cinema: branches[2]?.name || 'CGV Vincom Center Bà Triệu',
                            cinemaBranchId: branches[2]?.id || null,
                            totalRows: 8,
                            seatsPerRow: 12,
                            type: '2D',
                            status: 'active',
                        },
                        {
                            name: 'Phòng 04 (4DX Motion)',
                            cinema: branches[3]?.name || 'CGV Crescent Mall',
                            cinemaBranchId: branches[3]?.id || null,
                            totalRows: 8,
                            seatsPerRow: 12,
                            type: '4DX',
                            status: 'active',
                        },
                        {
                            name: 'Phòng 05 (Starium 3D)',
                            cinema: branches[4]?.name || 'CGV SC VivoCity',
                            cinemaBranchId: branches[4]?.id || null,
                            totalRows: 8,
                            seatsPerRow: 12,
                            type: '3D',
                            status: 'active',
                        },
                    ];
                    await modelRoom.bulkCreate(sampleRooms);
                    rooms = await modelRoom.findAll({ order: [['createdAt', 'DESC']] });
                }
            } catch (err) {
                console.error('Lỗi khi seed phòng mẫu:', err);
            }
        }

        new OK({
            message: 'Lấy danh sách phòng chiếu thành công',
            metadata: rooms,
        }).send(res);
    }

    async getRoomById(req, res) {
        const { id } = req.query;
        const room = await modelRoom.findOne({ where: { id } });

        if (!room) {
            throw new BadRequestError('Không tìm thấy phòng chiếu');
        }

        new OK({
            message: 'Lấy thông tin phòng chiếu thành công',
            metadata: room,
        }).send(res);
    }

    async updateRoom(req, res) {
        const { id, name, cinema, totalRows, seatsPerRow, type, status, cinemaBranchId } = req.body;

        const room = await modelRoom.findOne({ where: { id } });
        if (!room) {
            throw new BadRequestError('Không tìm thấy phòng chiếu');
        }

        if (totalRows && (totalRows < 1 || totalRows > 26)) {
            throw new BadRequestError('Số hàng ghế phải từ 1 đến 26');
        }

        if (seatsPerRow && (seatsPerRow < 1 || seatsPerRow > 30)) {
            throw new BadRequestError('Số ghế mỗi hàng phải từ 1 đến 30');
        }

        await room.update({
            name: name || room.name,
            cinema: cinema || room.cinema,
            cinemaBranchId: cinemaBranchId !== undefined ? cinemaBranchId : room.cinemaBranchId,
            totalRows: totalRows || room.totalRows,
            seatsPerRow: seatsPerRow || room.seatsPerRow,
            type: type || room.type,
            status: status !== undefined ? status : room.status,
        });

        new OK({
            message: 'Cập nhật phòng chiếu thành công',
            metadata: room,
        }).send(res);
    }

    async deleteRoom(req, res) {
        const { id } = req.query;
        const room = await modelRoom.findOne({ where: { id } });

        if (!room) {
            throw new BadRequestError('Không tìm thấy phòng chiếu');
        }

        await room.destroy();

        new OK({
            message: 'Xóa phòng chiếu thành công',
            metadata: room,
        }).send(res);
    }
}

module.exports = new RoomController();
