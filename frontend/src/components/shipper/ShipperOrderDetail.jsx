import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import RouteMap from '../RouteMap';

const ShipperOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, status: null });
  const [imageFile, setImageFile] = useState(null);
  const [failedReason, setFailedReason] = useState('Khách không nghe máy');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fetchOrderDetail = useCallback(async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/shipper/orders/${id}/detail`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setOrderData(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load order detail');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const handleOpenModal = (status) => {
    setModalConfig({ isOpen: true, status });
    setImageFile(null);
    setNote('');
    setFailedReason('Khách không nghe máy');
  };

  const handleAcceptOrder = async () => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/shipper/orders/${id}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success('Order accepted successfully');
        fetchOrderDetail();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept order');
    }
  };

  const submitStatusUpdate = async () => {
    const { status } = modalConfig;
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

      const response = await axios.put(`http://localhost:5000/api/shipper/orders/${id}/status`, 
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
        setModalConfig({ isOpen: false, status: null });
        fetchOrderDetail(); // Refresh data to update timeline
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 max-w-[1280px] mx-auto w-full flex items-center justify-center min-h-[600px]">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-[#004ac6] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-bold">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!orderData || !orderData.order) {
    return (
      <div className="p-10 max-w-[1280px] mx-auto w-full flex items-center justify-center min-h-[600px]">
        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">error</span>
          <h2 className="text-2xl font-bold text-slate-800">Order not found</h2>
          <button 
            onClick={() => navigate('/shipper/orders')}
            className="mt-6 px-6 py-2.5 bg-[#004ac6] text-white rounded-xl font-bold hover:bg-[#003da6] transition-all"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const { order = {}, shippingAddress = {}, orderItems = [], statusHistory = [] } = orderData;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  // Build Timeline steps
  const defaultSteps = ['pending', 'confirmed', 'ready_to_ship', 'shipping', 'completed'];
  let steps = [...defaultSteps];
  if (order.status === 'failed') steps[4] = 'failed';
  if (order.status === 'canceled') steps = ['pending', 'canceled'];

  const getStepStatus = (stepName) => {
    const historyRecord = statusHistory.find(h => h.status === stepName);
    if (historyRecord) return { completed: true, time: historyRecord.createdAt, historyRecord };
    if (stepName === order.status) return { completed: true, time: new Date(), historyRecord: null }; // Fallback
    return { completed: false, time: null, historyRecord: null };
  };

  return (
    <div className="p-10 max-w-[1280px] mx-auto w-full space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/shipper/orders')}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-[#004ac6] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Order #{order.orderCode}
              <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full tracking-widest ${
                order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                order.status === 'failed' ? 'bg-red-100 text-red-700' :
                order.status === 'shipping' ? 'bg-blue-100 text-[#004ac6]' :
                'bg-slate-100 text-slate-700'
              }`}>
                {order.status}
              </span>
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Placed on {formatDate(order.createdAt)}</p>
          </div>
        </div>
        
        {/* Actions */}
        {order.status === 'ready_to_ship' && (
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={handleAcceptOrder}
              className="flex-1 md:flex-none px-6 py-3 bg-[#004ac6] text-white rounded-xl font-bold hover:bg-[#003da6] transition-colors shadow-lg shadow-[#004ac6]/30 cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">local_shipping</span> Accept Order
            </button>
          </div>
        )}
        {order.status === 'shipping' && (
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => handleOpenModal('failed')}
              className="flex-1 md:flex-none px-6 py-3 bg-red-50 text-red-700 rounded-xl font-bold hover:bg-red-100 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">cancel</span> Mark Failed
            </button>
            <button 
              onClick={() => handleOpenModal('completed')}
              className="flex-1 md:flex-none px-6 py-3 bg-[#004ac6] text-white rounded-xl font-bold hover:bg-[#003da6] transition-colors shadow-lg shadow-[#004ac6]/30 cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">check_circle</span> mark completed
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Timeline & Items */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Route Map (Only visible during shipping) */}
          {order.status === 'shipping' && (
            <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004ac6]">route</span>
                Delivery Route
              </h3>
              {order.shopId?.latitude && order.shopId?.longitude && shippingAddress?.latitude && shippingAddress?.longitude ? (
                <RouteMap 
                  shopLat={order.shopId.latitude}
                  shopLng={order.shopId.longitude}
                  customerLat={shippingAddress.latitude}
                  customerLng={shippingAddress.longitude}
                  shopName={order.shopId.name}
                  customerName={shippingAddress.recipientName || order.customerId?.fullName || 'Customer'}
                />
              ) : (
                <div className="bg-amber-50 p-4 rounded-xl flex items-start gap-3 border border-amber-100">
                  <span className="material-symbols-outlined text-amber-500">warning</span>
                  <div>
                    <p className="text-sm text-amber-800 font-bold mb-1">Cannot display route map</p>
                    <p className="text-xs text-amber-700">The customer's address or shop address is missing GPS coordinates (they were created before the map integration). The delivery map will be unavailable for this order.</p>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Timeline Section */}
          <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#004ac6] to-cyan-400"></div>
            <h3 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#004ac6]">schedule</span>
              Delivery Tracking
            </h3>
            
            <div className="relative">
              {/* Vertical line connector */}
              <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-100"></div>
              
              <div className="space-y-8 relative z-10">
                {steps.map((step) => {
                  const { completed, time, historyRecord } = getStepStatus(step);
                  let icon = 'radio_button_unchecked';
                  let colorClass = 'text-slate-300 bg-white border-slate-200';
                  let textClass = 'text-slate-500';
                  
                  if (completed) {
                    if (step === 'failed' || step === 'canceled') {
                      icon = 'cancel';
                      colorClass = 'text-red-500 bg-red-50 border-red-200';
                      textClass = 'text-red-700 font-bold';
                    } else if (step === 'completed') {
                      icon = 'check_circle';
                      colorClass = 'text-emerald-500 bg-emerald-50 border-emerald-200';
                      textClass = 'text-emerald-700 font-bold';
                    } else {
                      icon = 'check_circle';
                      colorClass = 'text-[#004ac6] bg-blue-50 border-blue-200';
                      textClass = 'text-slate-900 font-bold';
                    }
                  }

                  const labels = {
                    pending: 'Order Placed',
                    confirmed: 'Order Confirmed',
                    ready_to_ship: 'Ready for Pickup',
                    shipping: 'In Transit',
                    shipped: 'Handed to Shipper',
                    delivered: 'Successfully Delivered',
                    completed: 'Successfully Delivered',
                    failed: 'Delivery Failed',
                    canceled: 'Order Canceled'
                  };

                  return (
                    <div key={step} className="flex gap-6 items-start group">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${colorClass}`}>
                        <span className="material-symbols-outlined text-[16px]">{icon}</span>
                      </div>
                      <div className="flex-1 pb-6">
                        <div className={`text-sm uppercase tracking-wider mb-1 ${textClass}`}>
                          {labels[step]}
                        </div>
                        {time ? (
                          <div className="text-xs font-medium text-slate-500 bg-slate-50 inline-block px-2 py-1 rounded-md">
                            {formatDate(time)}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400">Pending...</div>
                        )}
                        {completed && historyRecord?.note && (
                          <div className="mt-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="font-bold">Note:</span> {historyRecord.note}
                          </div>
                        )}
                        {completed && historyRecord?.image_url && (
                          <div className="mt-3">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Proof of Delivery</p>
                            <a href={historyRecord.imageUrl} target="_blank" rel="noopener noreferrer">
                              <img src={historyRecord.imageUrl} alt="Proof" className="w-32 h-32 object-cover rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-zoom-in" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Order Items */}
          <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-600">inventory_2</span>
              Products ({orderItems.length})
            </h3>
            <div className="space-y-4">
              {orderItems.map((item, index) => (
                <div key={item._id || item.id || `item-${index}`} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
                  <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200/50">
                    <img src={item.imageUrl} alt={item.product?.name} className="w-full h-full object-cover mix-blend-multiply" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate mb-1" title={item.product?.name}>
                      {item.product?.name || 'Unknown Product'}
                    </h4>
                    {item.variant && (
                      <div className="text-xs font-medium text-slate-500 mb-2">
                        {Object.values(item.variant.attributes || {}).join(' - ')}
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-sm font-bold text-[#004ac6]">
                        {item.priceAtBuy?.toLocaleString('vi-VN')}₫ 
                        <span className="text-slate-400 text-xs font-medium ml-1">x{item.quantity}</span>
                      </div>
                      <div className="text-sm font-black text-slate-900">
                        {(item.priceAtBuy * item.quantity).toLocaleString('vi-VN')}₫
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right Column: Customer info & Summary */}
        <div className="space-y-8">
          
          {/* Customer & Address Card */}
          <section className="bg-gradient-to-br from-[#004ac6] to-[#002f87] rounded-3xl p-8 text-white shadow-lg shadow-[#004ac6]/20 relative overflow-hidden">
            {/* Decorative background shapes */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-400/20 rounded-full blur-xl"></div>
            
            <h3 className="text-lg font-bold text-white/90 mb-6 flex items-center gap-2 relative z-10">
              <span className="material-symbols-outlined">contact_mail</span>
              Delivery Details
            </h3>
            
            <div className="space-y-6 relative z-10">
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Recipient</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                    {(shippingAddress?.recipientName || order.customerId?.fullName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{shippingAddress?.recipientName || order.customerId?.fullName}</p>
                    <a href={`tel:${shippingAddress?.recipientPhone || order.customerId?.phone}`} className="text-sm text-cyan-300 hover:text-white transition-colors flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[14px]">call</span>
                      {shippingAddress?.recipientPhone || order.customerId?.phone || 'No phone'}
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2">Shipping Address</p>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-cyan-300 text-[18px] mt-0.5 shrink-0">location_on</span>
                  <p className="text-sm font-medium leading-relaxed">
                    {shippingAddress?.streetAddress ? (
                      <>{shippingAddress.streetAddress}<br/>{shippingAddress.city}</>
                    ) : (
                      <span className="italic text-white/50">Address not provided for this order</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2">Shop Address</p>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-300 text-[18px] mt-0.5 shrink-0">storefront</span>
                  <p className="text-sm font-medium leading-relaxed">
                    {order.shopId?.name}<br/>
                    <span className="text-white/70">{order.shopId?.address || 'Shop address not specified'}</span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Payment Summary */}
          <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-600">receipt_long</span>
              Payment Summary
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                <span>Subtotal</span>
                <span className="text-slate-900">{order.subtotalAmount?.toLocaleString('vi-VN')}₫</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                <span>Shipping Fee</span>
                <span className="text-slate-900">+{order.shippingFee?.toLocaleString('vi-VN')}₫</span>
              </div>
              {order.couponDiscount > 0 && (
                <div className="flex justify-between items-center text-sm font-medium text-emerald-600">
                  <span>Coupon Discount</span>
                  <span>-{order.couponDiscount?.toLocaleString('vi-VN')}₫</span>
                </div>
              )}
              {order.coinDiscount > 0 && (
                <div className="flex justify-between items-center text-sm font-medium text-amber-500">
                  <span>Coin Discount</span>
                  <span>-{order.coinDiscount?.toLocaleString('vi-VN')}₫</span>
                </div>
              )}
              
              <div className="h-px w-full bg-slate-100 my-4"></div>
              
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-slate-900">Total Final</span>
                <span className="text-2xl font-black text-[#004ac6]">
                  {order.totalFinal?.toLocaleString('vi-VN')}₫
                </span>
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400">payments</span>
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Payment Status</div>
                  <div className="text-sm font-bold text-slate-900 capitalize flex items-center gap-2">
                    {order.paymentStatus}
                    {order.paymentStatus === 'pending' ? (
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    ) : order.paymentStatus === 'success' ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>
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
                onClick={() => setModalConfig({ isOpen: false, status: null })}
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

export default ShipperOrderDetail;
