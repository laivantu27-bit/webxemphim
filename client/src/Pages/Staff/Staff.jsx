import React, { useState, useEffect } from 'react';
import { Layout, Tabs, Tag, Button, Space } from 'antd';
import {
    QrcodeOutlined,
    ShoppingOutlined,
    ToolOutlined,
    FundOutlined,
    HistoryOutlined,
    HomeOutlined,
    UserOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import QrCheckIn from './Components/QrCheckIn/QrCheckIn';
import PosTicket from './Components/PosTicket/PosTicket';
import SeatMaintenance from './Components/SeatMaintenance/SeatMaintenance';
import ShiftReport from './Components/ShiftReport/ShiftReport';
import TransactionHistory from './Components/TransactionHistory/TransactionHistory';
import styles from './Staff.module.scss';

const { Header, Content } = Layout;

const Staff = () => {
    const [activeTab, setActiveTab] = useState('checkin');
    const [currentTime, setCurrentTime] = useState(dayjs().format('HH:mm:ss - DD/MM/YYYY'));
    const navigate = useNavigate();

    // Clock ticker
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(dayjs().format('HH:mm:ss - DD/MM/YYYY'));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const tabItems = [
        {
            key: 'checkin',
            label: (
                <span className={styles.tabLabel}>
                    <QrcodeOutlined /> Quét QR & Soát Vé
                </span>
            ),
            children: <QrCheckIn />,
        },
        {
            key: 'pos',
            label: (
                <span className={styles.tabLabel}>
                    <ShoppingOutlined /> Bán Vé Tại Quầy (POS)
                </span>
            ),
            children: <PosTicket />,
        },
        {
            key: 'maintenance',
            label: (
                <span className={styles.tabLabel}>
                    <ToolOutlined /> Quản Lý Phòng & Ghế
                </span>
            ),
            children: <SeatMaintenance />,
        },
        {
            key: 'shift',
            label: (
                <span className={styles.tabLabel}>
                    <FundOutlined /> Báo Cáo Ca Làm Việc
                </span>
            ),
            children: <ShiftReport />,
        },
        {
            key: 'history',
            label: (
                <span className={styles.tabLabel}>
                    <HistoryOutlined /> Lịch Sử Giao Dịch
                </span>
            ),
            children: <TransactionHistory />,
        },
    ];

    return (
        <Layout className={styles.staffLayout}>
            {/* Top Navigation Bar */}
            <Header className={styles.staffHeader}>
                <div className={styles.brandSection}>
                    <Link to="/" className={styles.logoLink}>
                        <span className={styles.logoIcon}>🎬</span>
                        <span className={styles.logoText}>STREAMPHIM</span>
                    </Link>
                    <Tag color="red" className={styles.staffBadge}>
                        CỔNG NHÂN VIÊN / STAFF
                    </Tag>
                </div>

                <div className={styles.clockSection}>
                    <span className={styles.clockIcon}>🕒</span>
                    <span className={styles.clockText}>{currentTime}</span>
                </div>

                <div className={styles.userSection}>
                    <Space size="middle">
                        <Link to="/admin">
                            <Button ghost icon={<SettingOutlined />} size="middle">
                                Trang Quản Trị
                            </Button>
                        </Link>
                        <Link to="/">
                            <Button ghost icon={<HomeOutlined />} size="middle">
                                Trang Chủ
                            </Button>
                        </Link>
                    </Space>
                </div>
            </Header>

            {/* Main Tabs Workspace */}
            <Content className={styles.staffContent}>
                <div className={styles.workspaceWrapper}>
                    <Tabs
                        activeKey={activeTab}
                        onChange={(key) => setActiveTab(key)}
                        items={tabItems}
                        className={styles.staffTabs}
                        size="large"
                    />
                </div>
            </Content>
        </Layout>
    );
};

export default Staff;
