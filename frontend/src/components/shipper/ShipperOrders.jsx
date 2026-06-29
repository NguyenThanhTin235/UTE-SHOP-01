import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

const ShipperOrders = () => {
  const { status: statusParam } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const validFilters = ['all', 'available', 'shipping', 'completed', 'failed'];
  const currentFilter = validFilters.includes(statusParam) ? statusParam : 'all';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, status: null, orderId: null });
  const [imageFile, setImageFile] = useState(null);
  const [failedReason, setFailedReason] = useState('Khách không nghe máy');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Pagination States
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  
  const [searchQuery, setSearchQuery] = useState('');

  const handlePageChange = (newPage) => {
    searchParams.set('page', newPage);
    setSearchParams(searchParams);
  };

  useEffect(() => {
    fetchOrders(currentFilter, currentPage);
  }, [currentFilter, currentPage]);

  const fetchOrders = async (filter, page) => {
    try {
      setLoading(true);
      const endpoint = filter === 'available'
        ? `http://localhost:5000/api/shipper/orders/available?page=${page}&limit=${limit}`
        : filter === 'all' 
        ? `http://localhost:5000/api/shipper/orders?page=${page}&limit=${limit}` 
        : `http://localhost:5000/api/shipper/orders/${filter}?page=${page}&limit=${limit}`;
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        setOrders(response.data.data.orders);
        setTotalPages(response.data.data.pagination.totalPages || 1);
      }
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (orderId, status) => {
    setModalConfig({ isOpen: true, status, orderId });
    setImageFile(null);
    setNote('');
    setFailedReason('Khách không nghe máy');
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/shipper/orders/${orderId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success('Order accepted successfully');
        fetchOrders(currentFilter, currentPage);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept order');
    }
  };

  const submitStatusUpdate = async () => {
    const { status, orderId } = modalConfig;
    if (status === 'completed' && !imageFile) {
      toast.error('Vui lòng cung cấp ảnh bằng chứng giao hàng!');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const formData = new FormData();
      formData.append('status', status);
      if (status === 'completed') {
        formData.append('image', imageFile);
      } else if (status === 'failed') {
        formData.append('reason', failedReason);
        formData.append('note', note);
      }

      const response = await axios.put(`http://localhost:5000/api/shipper/orders/${orderId}/status`, 
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );
      if (response.data.success) {
        toast.success(`Order marked as ${status}`);
        setModalConfig({ isOpen: false, status: null, orderId: null });
        fetchOrders(currentFilter, currentPage);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-[1280px] mx-auto w-full space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-900">
          {currentFilter === 'available' ? 'Available Orders' : 'My Assigned Orders'}
        </h2>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {['all', 'available', 'shipping', 'completed', 'failed'].map((status) => (
            <button
              key={status}
              onClick={() => navigate(status === 'all' ? '/shipper/orders' : `/shipper/orders/${status}`)}
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                currentFilter === status ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {status === 'shipping' ? 'In Transit' : status === 'available' ? 'Available' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md w-full">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search current page..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] outline-none transition-all shadow-sm"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-10 text-center">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center">
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">inbox</span>
            <h3 className="text-xl font-bold text-slate-700">No orders found</h3>
            <p className="text-slate-500 mt-2">There are no orders matching the selected filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="w-[30%] p-6">Order Code</th>
                  <th className="w-[25%] p-6">Customer</th>
                  <th className="w-[25%] p-6">Address</th>
                  <th className="w-[120px] p-6 text-center">Status</th>
                  <th className="w-[150px] md:w-[200px] p-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.filter(order => {
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  return (
                    (order.orderCode || order.order_code || '').toLowerCase().includes(query) ||
                    (order.customerId?.fullName || order.customer_id?.full_name || '').toLowerCase().includes(query) ||
                    (order.customerId?.phone || order.customer_id?.phone || '').includes(query) ||
                    (order.shopId?.address || order.shop_id?.address || '').toLowerCase().includes(query)
                  );
                }).map((order) => (
                  <tr key={order._id || order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td 
                      className="p-6 font-bold text-[#004ac6] cursor-pointer hover:underline"
                      onClick={() => navigate(`/shipper/order-detail/${order._id || order.id}`)}
                    >
                      #{order.orderCode || order.order_code}
                    </td>
                    <td className="p-6">
                      <div className="font-bold text-slate-900">{order.customerId?.fullName || order.customer_id?.full_name}</div>
                      <div className="text-sm text-slate-500">{order.customerId?.phone || order.customer_id?.phone}</div>
                    </td>
                    <td className="p-6">
                      <div className="text-sm text-slate-700 max-w-xs truncate" title={order.shopId?.address || order.shop_id?.address}>
                        {order.shopId?.address || order.shop_id?.address || 'No address provided'}
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                        order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        order.status === 'failed' ? 'bg-red-100 text-red-700' :
                        order.status === 'shipping' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center justify-end gap-2">
                      {order.status === 'ready_to_ship' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAcceptOrder(order._id || order.id); }}
                            className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold hover:bg-blue-100 transition-colors cursor-pointer shadow-sm"
                            title="Accept Order"
                          >
                            Accept
                          </button>
                      )}
                      {order.status === 'shipping' && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenModal(order._id || order.id, 'completed'); }}
                            className="bg-emerald-50 text-emerald-600 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-emerald-100 transition-colors cursor-pointer group shadow-sm"
                            title="Mark Completed"
                          >
                            <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform">check_circle</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenModal(order._id || order.id, 'failed'); }}
                            className="bg-red-50 text-red-600 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-red-100 transition-colors cursor-pointer group shadow-sm"
                            title="Mark Failed"
                          >
                            <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform">cancel</span>
                          </button>
                        </>
                      )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white">
                <p className="text-sm text-slate-500 font-medium">
                  Page <span className="font-bold text-slate-900">{currentPage}</span> of <span className="font-bold text-slate-900">{totalPages}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                      currentPage === 1 ? 'text-slate-300 bg-slate-50 cursor-not-allowed' : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>
                  <button 
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                      currentPage === totalPages ? 'text-slate-300 bg-slate-50 cursor-not-allowed' : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Update Status Modal */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in">
            <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
              {modalConfig.status === 'completed' ? (
                <><span className="material-symbols-outlined text-emerald-500">check_circle</span> mark as completed</>
              ) : (
                <><span className="material-symbols-outlined text-red-500">cancel</span> Mark as Failed</>
              )}
            </h3>
            
            {modalConfig.status === 'completed' && (
              <div className="space-y-4 mb-6">
                <label className="block text-sm font-bold text-slate-700">Proof of Delivery (Required) <span className="text-red-500">*</span></label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative overflow-hidden group">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setImageFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {imageFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-500 text-4xl">task_alt</span>
                      <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{imageFile.name}</p>
                      <p className="text-xs text-slate-500">Click to change photo</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-[#004ac6] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">add_a_photo</span>
                      </div>
                      <p className="text-sm font-bold text-slate-700">Upload Photo</p>
                      <p className="text-xs text-slate-500">JPG, PNG up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {modalConfig.status === 'failed' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Reason for Failure <span className="text-red-500">*</span></label>
                  <select 
                    value={failedReason}
                    onChange={(e) => setFailedReason(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-slate-700 font-medium"
                  >
                    <option value="Khách không nghe máy">Khách không nghe máy</option>
                    <option value="Sai địa chỉ / Không tìm thấy địa chỉ">Sai địa chỉ / Không tìm thấy địa chỉ</option>
                    <option value="Khách đổi ý / Từ chối nhận hàng">Khách đổi ý / Từ chối nhận hàng</option>
                    <option value="Hàng bị hỏng trong quá trình vận chuyển">Hàng bị hỏng trong quá trình vận chuyển</option>
                    <option value="Lý do khác">Lý do khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Additional Notes (Optional)</label>
                  <textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Enter additional details..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-slate-700 resize-none h-24"
                  ></textarea>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setModalConfig({ isOpen: false, status: null, orderId: null })}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={submitStatusUpdate}
                disabled={isSubmitting}
                className={`px-6 py-2.5 rounded-xl font-bold text-white transition-all flex items-center gap-2 cursor-pointer ${
                  modalConfig.status === 'completed' ? 'bg-[#004ac6] hover:bg-[#003da6]' : 'bg-red-500 hover:bg-red-600'
                } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Submitting...</>
                ) : (
                  <>Confirm Update</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipperOrders;
