import React, { useState, useEffect } from 'react';
import AdminHeader from '../AdminHeader';
import './AdminStyles.css';

// Icons
const CalendarIcon = ({ color = "currentColor", size = 18 }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth="2"/>
        <line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2"/>
        <line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2"/>
        <line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2"/>
    </svg>
);

const DollarIcon = ({ color = "currentColor", size = 18 }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        <line x1="12" y1="1" x2="12" y2="23" stroke={color} strokeWidth="2"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke={color} strokeWidth="2"/>
    </svg>
);

const TrendingUpIcon = ({ color = "currentColor", size = 18 }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" stroke={color} strokeWidth="2" fill="none"/>
        <polyline points="17,6 23,6 23,12" stroke={color} strokeWidth="2" fill="none"/>
    </svg>
);

const ShoppingCartIcon = ({ color = "currentColor", size = 18 }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        <circle cx="9" cy="21" r="1" stroke={color} strokeWidth="2"/>
        <circle cx="20" cy="21" r="1" stroke={color} strokeWidth="2"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" stroke={color} strokeWidth="2"/>
    </svg>
);

const DownloadIcon = ({ color = "currentColor", size = 18 }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2"/>
        <polyline points="7,10 12,15 17,10" stroke={color} strokeWidth="2"/>
        <line x1="12" y1="15" x2="12" y2="3" stroke={color} strokeWidth="2"/>
    </svg>
);

function SalesReportPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dateRange, setDateRange] = useState('7'); // Default to last 7 days
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reportData, setReportData] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        completedOrders: 0,
        pendingOrders: 0,
        topProducts: [],
        dailySales: [],
        monthlySales: []
    });

    // Fetch orders data
    useEffect(() => {
        fetchOrdersData();
    }, [dateRange, startDate, endDate]);

    const fetchOrdersData = async () => {
        try {
            setLoading(true);
            
            // Get admin user token
            const adminUser = JSON.parse(localStorage.getItem('admin_user'));
            if (!adminUser || !adminUser.token) {
                throw new Error('No admin authentication found');
            }

            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/orders/admin/all`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${adminUser.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch orders data');
            }

            const ordersData = await response.json();
            setOrders(ordersData);
            generateReportData(ordersData);
            setError('');
        } catch (error) {
            console.error('Error fetching orders:', error);
            setError('Failed to load sales data');
        } finally {
            setLoading(false);
        }
    };

    const generateReportData = (ordersData) => {
        const filteredOrders = filterOrdersByDate(ordersData);
        
        // Define excluded statuses for revenue calculation
        const excludedStatuses = ['Attempted Delivery', 'Returned to Sender', 'Rejected', 'Cancelled'];
        
        // Filter out excluded statuses for revenue calculation
        const revenueOrders = filteredOrders.filter(order => 
            !excludedStatuses.includes(order.status_id?.status_name)
        );
        
        // Calculate basic metrics
        const totalRevenue = revenueOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
        const totalOrders = filteredOrders.length;
        const averageOrderValue = revenueOrders.length > 0 ? totalRevenue / revenueOrders.length : 0;
        const completedOrders = filteredOrders.filter(order => {
            const status = order.status_id?.status_name;
            return status === 'Completed' || status === 'Delivered' || status === 'delievered';
        }).length;
        const pendingOrders = filteredOrders.filter(order => 
            order.status_id?.status_name === 'Order Placed' || order.status_id?.status_name === 'Processing' || order.status_id?.status_name === 'In Transit'
        ).length;

        // Generate daily sales data using filtered orders
        const dailySales = generateDailySales(filteredOrders);
        
        // Generate monthly sales data using filtered orders
        const monthlySales = generateMonthlySales(filteredOrders);

        setReportData({
            totalRevenue,
            totalOrders,
            averageOrderValue,
            completedOrders,
            pendingOrders,
            topProducts: [], // Would need product data to implement
            dailySales,
            monthlySales
        });
    };

    const filterOrdersByDate = (ordersData) => {
        const now = new Date();
        let filterDate = new Date();

        if (dateRange === 'custom' && startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Include the entire end date
            return ordersData.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate >= start && orderDate <= end;
            });
        } else {
            // Predefined ranges
            switch (dateRange) {
                case '7':
                    filterDate.setDate(now.getDate() - 7);
                    break;
                case '30':
                    filterDate.setDate(now.getDate() - 30);
                    break;
                case '90':
                    filterDate.setDate(now.getDate() - 90);
                    break;
                case '365':
                    filterDate.setFullYear(now.getFullYear() - 1);
                    break;
                default:
                    filterDate.setDate(now.getDate() - 7);
            }
            
            return ordersData.filter(order => new Date(order.createdAt) >= filterDate);
        }
    };

    const generateDailySales = (filteredOrders) => {
        const dailyData = {};
        
        // Define excluded statuses for revenue calculation
        const excludedStatuses = ['Attempted Delivery', 'Returned to Sender', 'Rejected', 'Cancelled'];
        
        // Get date range from filtered orders
        if (filteredOrders.length === 0) {
            return [];
        }
        
        // Find the earliest and latest dates in filtered orders using local time
        const dates = filteredOrders.map(order => {
            const orderDate = new Date(order.createdAt);
            // Format date as YYYY-MM-DD in local timezone
            const year = orderDate.getFullYear();
            const month = String(orderDate.getMonth() + 1).padStart(2, '0');
            const day = String(orderDate.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        });
        
        const minDateStr = dates.reduce((min, date) => date < min ? date : min);
        const maxDateStr = dates.reduce((max, date) => date > max ? date : max);
        
        // Create array of all dates in the range using local time
        const minDate = new Date(minDateStr + 'T00:00:00');
        const maxDate = new Date(maxDateStr + 'T00:00:00');
        
        for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            dailyData[dateStr] = 0;
        }
        
        // Aggregate sales by date, excluding certain statuses, using local dates
        filteredOrders.forEach(order => {
            const orderStatus = order.status_id?.status_name;
            const orderAmount = order.total_amount || 0;
            
            if (!excludedStatuses.includes(orderStatus)) {
                const orderDate = new Date(order.createdAt);
                // Format date as YYYY-MM-DD in local timezone
                const year = orderDate.getFullYear();
                const month = String(orderDate.getMonth() + 1).padStart(2, '0');
                const day = String(orderDate.getDate()).padStart(2, '0');
                const orderDateStr = `${year}-${month}-${day}`;
                
                if (dailyData.hasOwnProperty(orderDateStr)) {
                    dailyData[orderDateStr] += orderAmount;
                }
            }
        });
        
        // Return all dates in range (including $0 days)
        const sortedDates = Object.keys(dailyData).sort();
        
        return sortedDates.map(date => ({
            date,
            amount: dailyData[date]
        }));
    };

    const generateMonthlySales = (filteredOrders) => {
        const monthlyData = {};
        
        // Define excluded statuses for revenue calculation
        const excludedStatuses = ['Attempted Delivery', 'Returned to Sender', 'Rejected', 'Cancelled'];
        
        if (filteredOrders.length === 0) {
            return [];
        }
        
        // Get unique months from filtered orders using local time
        const monthsSet = new Set();
        filteredOrders.forEach(order => {
            const orderDate = new Date(order.createdAt);
            const monthStr = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
            monthsSet.add(monthStr);
        });
        
        const months = Array.from(monthsSet).sort();
        
        // Initialize monthly data
        months.forEach(month => {
            monthlyData[month] = 0;
        });
        
        // Aggregate sales by month, excluding certain statuses, using local dates
        filteredOrders.forEach(order => {
            const orderStatus = order.status_id?.status_name;
            if (!excludedStatuses.includes(orderStatus)) {
                const orderDate = new Date(order.createdAt);
                const monthStr = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
                if (monthlyData.hasOwnProperty(monthStr)) {
                    monthlyData[monthStr] += order.total_amount || 0;
                }
            }
        });
        
        // Return all months in range
        return months.map(month => ({
            month,
            amount: monthlyData[month]
        }));
    };

    const exportToCSV = () => {
        const filteredOrders = filterOrdersByDate(orders);
        const csvContent = [
            ['Order ID', 'Date', 'Customer', 'Amount', 'Status'],
            ...filteredOrders.map(order => [
                order._id,
                new Date(order.createdAt).toLocaleDateString(),
                order.user_id?.full_name || order.user_id?.username || 'N/A',
                `$${(order.total_amount || 0).toFixed(2)}`,
                order.status_id?.status_name || 'N/A'
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Order Placed': return 'adminstatus-processing';
            case 'Processing': return 'adminstatus-processing';
            case 'In Transit': return 'adminstatus-in-transit';
            case 'Delivered': return 'adminstatus-delivered';
            case 'Cancelled': return 'adminstatus-cancelled';
            case 'Rejected': return 'adminstatus-declined';
            case 'Returned to Sender': return 'adminstatus-declined';
            case 'Attempted Delivery': return 'adminstatus-declined';
            default: return 'adminstatus-processing';
        }
    };

    if (loading) {
        return (
            <div className="add-product-page">
            <div style={{ position: 'sticky', top: 0, zIndex: 1000}}>
                <AdminHeader />
            </div>  
                <div className="manage-products-page">
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        Loading sales report...
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="add-product-page">
            <div style={{ position: 'sticky', top: 0, zIndex: 1000}}>
                <AdminHeader />
            </div>  
                <div className="manage-products-page">
                    <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div style={{ position: 'sticky', top: 0, zIndex: 1000}}>
                <AdminHeader />
            </div>  
            <div className="manage-products-page">
                <div className="title-row">
                    <h2>Sales Report</h2>
                    <button onClick={exportToCSV} className="add-new-btn">
                        <DownloadIcon size={18} color="white" />
                        Export CSV
                    </button>
                </div>
                <div>
                    <h3 className="card-title">Filtered Data</h3>
                </div>

                {/* Date Range Filters */}
                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                    marginBottom: '20px',
                    display: 'flex',
                    gap: '15px',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CalendarIcon />
                        <span style={{ fontWeight: 'bold' }}>Date Range:</span>
                    </div>
                    
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '4px',
                            border: '1px solid #ccc'
                        }}
                    >
                        <option value="7">Last 7 Days</option>
                        <option value="30">Last 30 Days</option>
                        <option value="90">Last 90 Days</option>
                        <option value="365">Last Year</option>
                        <option value="custom">Custom Range</option>
                    </select>

                    {dateRange === 'custom' && (
                        <>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc'
                                }}
                            />
                            <span>to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc'
                                }}
                            />
                        </>
                    )}
                </div>

                {/* Key Metrics Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '20px',
                    marginBottom: '30px'
                }}>
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ 
                                backgroundColor: '#28a745', 
                                padding: '15px', 
                                borderRadius: '8px',
                                color: 'white'
                            }}>
                                <DollarIcon size={24} color="white" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '24px', color: '#28a745' }}>
                                    {formatCurrency(reportData.totalRevenue)}
                                </h3>
                                <p style={{ margin: 0, color: '#666' }}>Total Revenue</p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ 
                                backgroundColor: '#007bff', 
                                padding: '15px', 
                                borderRadius: '8px',
                                color: 'white'
                            }}>
                                <ShoppingCartIcon size={24} color="white" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '24px', color: '#007bff' }}>
                                    {reportData.totalOrders}
                                </h3>
                                <p style={{ margin: 0, color: '#666' }}>Total Orders</p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ 
                                backgroundColor: '#17a2b8', 
                                padding: '15px', 
                                borderRadius: '8px',
                                color: 'white'
                            }}>
                                <TrendingUpIcon size={24} color="white" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '24px', color: '#17a2b8' }}>
                                    {formatCurrency(reportData.averageOrderValue)}
                                </h3>
                                <p style={{ margin: 0, color: '#666' }}>Average Order Value</p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div style={{ padding: '20px 0' }}>
                            <h4 style={{ margin: '0 0 15px 0' }}>Order Status</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span>Completed:</span>
                                <span style={{ fontWeight: 'bold', color: '#28a745' }}>{reportData.completedOrders}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Pending:</span>
                                <span style={{ fontWeight: 'bold', color: '#ffc107' }}>{reportData.pendingOrders}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="card-title">Sales Chart & Recent Orders</h3>
                </div>

                {/* Charts Section */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    marginBottom: '30px'
                }}>
                    {/* Daily Sales Chart */}
                    <div className="card">
                        <h3 className="card-title">Daily Sales (Selected Period)</h3>
                        <div style={{ height: '200px', display: 'flex', alignItems: 'end', gap: '10px', padding: '20px 0', overflowX: 'auto' }}>
                            {reportData.dailySales.map((day, index) => {
                                const maxAmount = Math.max(...reportData.dailySales.map(d => d.amount));
                                const height = maxAmount > 0 ? (day.amount / maxAmount) * 150 : 0;
                                return (
                                    <div key={index} style={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'center',
                                        flex: '0 0 auto',
                                        minWidth: '60px'
                                    }}>
                                        <div style={{
                                            backgroundColor: '#007bff',
                                            width: '50px',
                                            height: `${height}px`,
                                            borderRadius: '4px 4px 0 0',
                                            marginBottom: '5px',
                                            minHeight: '0px'
                                        }}></div>
                                        <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
                                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#999', textAlign: 'center' }}>
                                            ${day.amount.toFixed(0)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Monthly Sales Chart */}
                    <div className="card">
                        <h3 className="card-title">Monthly Sales (Selected Period)</h3>
                        <div style={{ height: '200px', display: 'flex', alignItems: 'end', gap: '10px', padding: '20px 0', overflowX: 'auto' }}>
                            {reportData.monthlySales.map((month, index) => {
                                const maxAmount = Math.max(...reportData.monthlySales.map(m => m.amount));
                                const height = maxAmount > 0 ? (month.amount / maxAmount) * 150 : 0;
                                return (
                                    <div key={index} style={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'center',
                                        flex: '0 0 auto',
                                        minWidth: '60px'
                                    }}>
                                        <div style={{
                                            backgroundColor: '#28a745',
                                            width: '50px',
                                            height: `${height}px`,
                                            borderRadius: '4px 4px 0 0',
                                            marginBottom: '5px',
                                            minHeight: '2px'
                                        }}></div>
                                        <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
                                            {new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'short' })}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#999', textAlign: 'center' }}>
                                            ${month.amount.toFixed(0)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Recent Orders Table */}
                <div className="card">
                    <h3 className="card-title">Recent Orders</h3>
                    <div>
                        <table className="my-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filterOrdersByDate(orders).slice(0, 10).map(order => (
                                    <tr key={order._id}>
                                        <td>{order._id?.slice(-8) || 'N/A'}</td>
                                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td>{order.user_id?.full_name || order.user_id?.username || 'N/A'}</td>
                                        <td>{formatCurrency(order.total_amount)}</td>
                                        <td className={getStatusClass(order.status_id?.status_name || 'Processing')}>
                                            {order.status_id?.status_name || 'Pending'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

export default SalesReportPage;
