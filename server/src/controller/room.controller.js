const { BadRequestError } = require('../core/error.response');
const { OK, Created } = require('../core/success.response');

const modelRoom = require('../models/room.model');

class RoomController {
    async createRoom(req, res) {
        const { name, cinema, totalRows, seatsPerRow, type, status } = req.body;

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
        const rooms = await modelRoom.findAll({
            order: [['createdAt', 'DESC']],
        });

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
        const { id, name, cinema, totalRows, seatsPerRow, type, status } = req.body;

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
