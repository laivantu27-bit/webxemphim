import { useEffect, useState, useMemo } from 'react';
import styles from './ManagerRoom.module.scss';
import classNames from 'classnames/bind';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import {
    requestGetAllRooms,
    requestCreateRoom,
    requestUpdateRoom,
    requestDeleteRoom,
    requestGetAllBranches,
} from '../../../../config/request';

const cx = classNames.bind(styles);

function SeatPreview({ totalRows, seatsPerRow }) {
    const rows = useMemo(() => {
        const result = [];
        const rowCount = Math.min(totalRows || 0, 26);
        const seatCount = Math.min(seatsPerRow || 0, 30);
        for (let i = 0; i < rowCount; i++) {
            const rowLabel = String.fromCharCode(65 + i);
            const seats = [];
            for (let j = 1; j <= seatCount; j++) {
                seats.push(`${rowLabel}${j}`);
            }
            result.push({ label: rowLabel, seats });
        }
        return result;
    }, [totalRows, seatsPerRow]);

    if (!totalRows || !seatsPerRow || totalRows < 1 || seatsPerRow < 1) {
        return null;
    }

    return (
        <div className={cx('seat-preview')}>
            <div className={cx('screen')} />
            <div className={cx('screen-label')}>MÀN HÌNH</div>
            <div className={cx('seat-grid')}>
                {rows.map((row) => (
                    <div key={row.label} className={cx('seat-row')}>
                        <span className={cx('row-label')}>{row.label}</span>
                        {row.seats.map((seat) => (
                            <div key={seat} className={cx('seat')}>
                                {seat}
                            </div>
                        ))}
                        <span className={cx('row-label')}>{row.label}</span>
                    </div>
                ))}
            </div>
            <div className={cx('total-info')}>
                Tổng: {totalRows * seatsPerRow} ghế ({totalRows} hàng × {seatsPerRow} ghế)
            </div>
        </div>
    );
}

function ManagerRoom() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewRoom, setPreviewRoom] = useState(null);
    const [modalMode, setModalMode] = useState('add');
    const [form] = Form.useForm();
    const [rooms, setRooms] = useState([]);
    const [branches, setBranches] = useState([]);

    const formRows = Form.useWatch('totalRows', form);
    const formSeats = Form.useWatch('seatsPerRow', form);

    const fetchRooms = async () => {
        try {
            const [roomsRes, branchRes] = await Promise.all([
                requestGetAllRooms(),
                requestGetAllBranches().catch(() => ({ metadata: [] })),
            ]);
            setRooms(roomsRes.metadata || []);
            setBranches(branchRes.metadata || []);
        } catch (error) {
            message.error('Lỗi khi tải danh sách phòng chiếu');
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const columns = [
        {
            title: 'STT',
            dataIndex: 'id',
            key: 'index',
            width: 60,
            render: (_, __, index) => index + 1,
        },
        {
            title: 'Tên phòng',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <strong>{text}</strong>,
        },
        {
            title: 'Rạp trực thuộc',
            dataIndex: 'cinema',
            key: 'cinema',
            render: (cinema) => (
                <Tag color="magenta" style={{ fontWeight: 600, fontSize: '12.5px', padding: '3px 8px' }}>
                    🏢 {cinema}
                </Tag>
            ),
        },
        {
            title: 'Loại phòng',
            dataIndex: 'type',
            key: 'type',
            render: (type) => {
                const colorMap = {
                    '2D': 'blue',
                    '3D': 'green',
                    IMAX: 'gold',
                    '4DX': 'magenta',
                };
                return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
            },
        },
        {
            title: 'Số hàng',
            dataIndex: 'totalRows',
            key: 'totalRows',
            align: 'center',
        },
        {
            title: 'Ghế/Hàng',
            dataIndex: 'seatsPerRow',
            key: 'seatsPerRow',
            align: 'center',
        },
        {
            title: 'Tổng ghế',
            key: 'totalSeats',
            align: 'center',
            render: (_, record) => (
                <Tag color="cyan" className={cx('capacity-tag')}>
                    {record.totalRows * record.seatsPerRow}
                </Tag>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) =>
                status === 'active' ? (
                    <span className={cx('status-active')}>● Hoạt động</span>
                ) : (
                    <span className={cx('status-inactive')}>● Tạm đóng</span>
                ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size="small">
                    <Button
                        icon={<EyeOutlined />}
                        onClick={() => {
                            setPreviewRoom(record);
                            setIsPreviewOpen(true);
                        }}
                    >
                        Xem
                    </Button>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setModalMode('edit');
                            setIsModalOpen(true);
                            form.setFieldsValue({
                                ...record,
                            });
                        }}
                    >
                        Sửa
                    </Button>
                    <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
                        Xóa
                    </Button>
                </Space>
            ),
        },
    ];

    const handleDelete = (id) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc chắn muốn xóa phòng chiếu này? Thao tác này không thể hoàn tác.',
            okText: 'Xóa',
            cancelText: 'Hủy',
            okType: 'danger',
            onOk: async () => {
                try {
                    await requestDeleteRoom(id);
                    message.success('Đã xóa phòng chiếu thành công');
                    await fetchRooms();
                } catch (error) {
                    message.error('Lỗi khi xóa phòng chiếu');
                }
            },
        });
    };

    const handleSubmit = async (values) => {
        try {
            if (modalMode === 'add') {
                await requestCreateRoom(values);
                message.success('Đã tạo phòng chiếu thành công');
            } else {
                await requestUpdateRoom(values);
                message.success('Đã cập nhật phòng chiếu thành công');
            }
            setIsModalOpen(false);
            form.resetFields();
            await fetchRooms();
        } catch (error) {
            message.error(error?.response?.data?.message || 'Có lỗi xảy ra!');
        }
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('header')}>
                <h2>Quản lý phòng chiếu</h2>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setModalMode('add');
                        setIsModalOpen(true);
                        form.resetFields();
                    }}
                >
                    Thêm phòng chiếu
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={rooms}
                bordered
                rowKey="id"
                className={cx('room-table')}
                pagination={{ pageSize: 10 }}
            />

            {/* Modal Thêm / Sửa */}
            <Modal
                title={modalMode === 'add' ? 'Thêm phòng chiếu mới' : 'Sửa phòng chiếu'}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={600}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item name="id" hidden>
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="name"
                        label="Tên phòng chiếu"
                        rules={[{ required: true, message: 'Vui lòng nhập tên phòng chiếu!' }]}
                    >
                        <Input placeholder="VD: Phòng 1, Phòng VIP, Phòng IMAX" />
                    </Form.Item>

                    <Form.Item
                        name="cinema"
                        label="Rạp / Chi nhánh trực thuộc"
                        rules={[{ required: true, message: 'Vui lòng chọn rạp trực thuộc!' }]}
                    >
                        <Select
                            showSearch
                            placeholder="-- Chọn chi nhánh rạp CGV --"
                            optionFilterProp="filterText"
                            onChange={(val, opt) => {
                                form.setFieldsValue({
                                    cinema: val,
                                    cinemaBranchId: opt?.branchId,
                                });
                            }}
                            options={branches.map((b) => ({
                                value: b.name,
                                branchId: b.id,
                                filterText: `${b.name} ${b.province} ${b.city} ${b.address}`,
                                label: (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>🏢 <strong>{b.name}</strong></span>
                                        <Tag color="cyan">{b.province || b.city}</Tag>
                                    </div>
                                ),
                            }))}
                        />
                    </Form.Item>
                    <Form.Item name="cinemaBranchId" hidden>
                        <Input />
                    </Form.Item>

                    <Space style={{ width: '100%' }} size="large">
                        <Form.Item
                            name="totalRows"
                            label="Số hàng ghế"
                            rules={[{ required: true, message: 'Vui lòng nhập số hàng!' }]}
                            style={{ flex: 1 }}
                        >
                            <InputNumber min={1} max={26} placeholder="VD: 7" style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item
                            name="seatsPerRow"
                            label="Số ghế mỗi hàng"
                            rules={[{ required: true, message: 'Vui lòng nhập số ghế!' }]}
                            style={{ flex: 1 }}
                        >
                            <InputNumber min={1} max={30} placeholder="VD: 12" style={{ width: '100%' }} />
                        </Form.Item>
                    </Space>

                    {formRows > 0 && formSeats > 0 && <SeatPreview totalRows={formRows} seatsPerRow={formSeats} />}

                    <Space style={{ width: '100%' }} size="large">
                        <Form.Item
                            name="type"
                            label="Loại phòng"
                            rules={[{ required: true, message: 'Vui lòng chọn loại phòng!' }]}
                            initialValue="2D"
                            style={{ flex: 1 }}
                        >
                            <Select
                                placeholder="Chọn loại phòng"
                                options={[
                                    { value: '2D', label: '2D' },
                                    { value: '3D', label: '3D' },
                                    { value: 'IMAX', label: 'IMAX' },
                                    { value: '4DX', label: '4DX' },
                                ]}
                            />
                        </Form.Item>

                        <Form.Item name="status" label="Trạng thái" initialValue="active" style={{ flex: 1 }}>
                            <Select
                                options={[
                                    { value: 'active', label: '🟢 Hoạt động' },
                                    { value: 'inactive', label: '🔴 Tạm đóng' },
                                ]}
                            />
                        </Form.Item>
                    </Space>

                    <Form.Item className={cx('form-actions')}>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                {modalMode === 'add' ? 'Thêm phòng' : 'Lưu thay đổi'}
                            </Button>
                            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal Xem sơ đồ ghế */}
            <Modal
                title={previewRoom ? `Sơ đồ ghế - ${previewRoom.name} (${previewRoom.cinema})` : 'Sơ đồ ghế'}
                open={isPreviewOpen}
                onCancel={() => setIsPreviewOpen(false)}
                footer={null}
                width={700}
            >
                {previewRoom && (
                    <>
                        <p>
                            <strong>Loại phòng:</strong> {previewRoom.type} &nbsp;&nbsp;
                            <strong>Trạng thái:</strong>{' '}
                            {previewRoom.status === 'active' ? '🟢 Hoạt động' : '🔴 Tạm đóng'}
                        </p>
                        <SeatPreview totalRows={previewRoom.totalRows} seatsPerRow={previewRoom.seatsPerRow} />
                    </>
                )}
            </Modal>
        </div>
    );
}

export default ManagerRoom;
