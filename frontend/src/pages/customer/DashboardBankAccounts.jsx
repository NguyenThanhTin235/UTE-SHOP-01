import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { logout } from '../../redux/authSlice';
import toast from 'react-hot-toast';
import axios from 'axios';

const DashboardBankAccounts = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [bankAccounts, setBankAccounts] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  
  // Bank Account Form States
  const [isEditing, setIsEditing] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const fetchBankAccounts = async () => {
    if (user?.role !== 'seller' && user?.role !== 'vendor') return;
    setLoadingBanks(true);
    try {
      const res = await axios.get('http://localhost:5000/api/seller/wallet/bank-accounts', {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setBankAccounts(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch bank accounts:', error);
      toast.error('Failed to load bank accounts');
    } finally {
      setLoadingBanks(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'seller' && user.role !== 'vendor') {
      navigate('/');
      return;
    }
    fetchBankAccounts();
  }, [user, navigate]);

  const resetBankForm = () => {
    setIsEditing(false);
    setEditingAccountId(null);
    setBankName('');
    setAccountName('');
    setAccountNumber('');
    setIsDefault(false);
  };

  const startEditBank = (acc) => {
    setIsEditing(true);
    setEditingAccountId(acc._id);
    setBankName(acc.bank_name);
    setAccountName(acc.account_name);
    setAccountNumber(acc.account_number);
    setIsDefault(acc.is_default);
  };

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    if (!bankName || !accountName || !accountNumber) {
      toast.error('Vui lòng điền đầy đủ thông tin tài khoản');
      return;
    }
    try {
      if (isEditing) {
        const res = await axios.put(`http://localhost:5000/api/seller/wallet/bank-accounts/${editingAccountId}`, {
          bank_name: bankName,
          account_name: accountName,
          account_number: accountNumber,
          is_default: isDefault
        }, {
          headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
        });
        if (res.data.success) {
          toast.success('Cập nhật tài khoản ngân hàng thành công');
          resetBankForm();
          fetchBankAccounts();
        }
      } else {
        const res = await axios.post('http://localhost:5000/api/seller/wallet/bank-accounts', {
          bank_name: bankName,
          account_name: accountName,
          account_number: accountNumber,
          is_default: isDefault
        }, {
          headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
        });
        if (res.data.success) {
          toast.success('Thêm tài khoản ngân hàng thành công');
          resetBankForm();
          fetchBankAccounts();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteBank = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản ngân hàng này?')) return;
    try {
      const res = await axios.delete(`http://localhost:5000/api/seller/wallet/bank-accounts/${id}`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
      });
      if (res.data.success) {
        toast.success('Xóa tài khoản ngân hàng thành công');
        fetchBankAccounts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa tài khoản ngân hàng');
    }
  };

  const handleSetDefaultBank = async (id) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/seller/wallet/bank-accounts/${id}/default`, {}, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
      });
      if (res.data.success) {
        toast.success('Đã đặt làm tài khoản mặc định');
        fetchBankAccounts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const avatarSrc = user?.avatarUrl ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:5000${user.avatarUrl}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=004ac6&color=fff`;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="h-20 bg-white border-b border-[#c3c6d7]/30 flex items-center px-4 md:px-10 sticky top-0 z-40 shadow-sm">
        <button onClick={() => navigate('/seller')} className="flex items-center gap-2 text-[#434655] hover:text-primary transition-colors font-bold cursor-pointer">
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Dashboard
        </button>
      </header>
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-10 py-8 md:py-12 flex flex-col md:flex-row gap-8 items-start">
        {/* SideNavBar */}
        <aside className="w-full md:w-72 flex flex-col gap-4 md:sticky md:top-24 flex-shrink-0">
          {/* User Info Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#c3c6d7]/30 mb-2 text-left">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-primary flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0">
                <img src={avatarSrc} alt={user?.fullName || 'Avatar'} className="w-full h-full object-cover" />
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-[#131b2e] tracking-tight truncate">{user?.fullName || 'User'}</h3>
                <p className="text-sm text-[#434655]">{user?.tier || 'Standard Member'}</p>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1 text-left">
            <Link to="/seller/profile" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-primary transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">person</span>
              <span>Personal Profile</span>
            </Link>
            <Link to="/seller/bank-accounts" className="flex items-center px-4 py-3 space-x-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
              <span>Bank Accounts</span>
            </Link>
            {user?.role === 'shipper' && (
              <Link to="/shipper/info" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-primary transition-all font-medium rounded-xl">
                <span className="material-symbols-outlined">local_shipping</span>
                <span>Shipper Information</span>
              </Link>
            )}
            <Link to="/seller/security" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-primary transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">security</span>
              <span>Security Settings</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 w-full">
          <div className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] overflow-hidden border border-[#c3c6d7]/30">
            <div className="p-8 border-b border-[#c3c6d7]/30 text-left">
              <h1 className="text-3xl font-bold text-[#131b2e] tracking-tight">Bank Accounts</h1>
              <p className="text-sm text-[#434655] mt-2">Manage bank accounts used for receiving withdrawals from your wallet.</p>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Bank Accounts List */}
                <div className="lg:col-span-6 flex flex-col gap-4 text-left">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#434655] mb-2">Registered Accounts</h3>
                  {loadingBanks ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs text-[#434655] font-bold">Loading bank accounts...</p>
                    </div>
                  ) : bankAccounts.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {bankAccounts.map(acc => (
                        <div 
                          key={acc._id} 
                          className={`p-5 rounded-2xl border ${acc.is_default ? 'border-primary/30 bg-primary/5' : 'border-[#c3c6d7]/50 bg-[#F8FAFC]'} flex flex-col justify-between`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-sm font-black text-slate-800">{acc.bank_name}</span>
                              <p className="font-mono text-base font-black text-slate-900 mt-2 tracking-wide select-all">
                                {acc.account_number}
                              </p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                                {acc.account_name}
                              </p>
                            </div>
                            {acc.is_default && (
                              <span className="bg-primary text-white text-[8px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider">
                                Default
                              </span>
                            )}
                          </div>

                          <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-[#c3c6d7]/20">
                            {!acc.is_default && (
                              <button 
                                onClick={() => handleSetDefaultBank(acc._id)}
                                className="text-[10px] font-bold text-primary uppercase tracking-wider hover:underline cursor-pointer"
                              >
                                Set Default
                              </button>
                            )}
                            <button 
                              onClick={() => startEditBank(acc)}
                              className="text-[10px] font-bold text-slate-600 hover:text-primary uppercase tracking-wider hover:underline cursor-pointer flex items-center gap-0.5"
                            >
                              <span className="material-symbols-outlined text-xs">edit</span>
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteBank(acc._id)}
                              className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer flex items-center gap-0.5"
                            >
                              <span className="material-symbols-outlined text-xs">delete</span>
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center border-2 border-dashed border-[#c3c6d7]/60 rounded-2xl bg-[#F8FAFC]">
                      <span className="material-symbols-outlined text-[#c3c6d7] text-4xl mb-2">account_balance</span>
                      <p className="text-sm text-[#434655] font-bold">No bank accounts registered yet.</p>
                    </div>
                  )}
                </div>

                {/* Form to Add / Edit Bank Account */}
                <div className="lg:col-span-6 bg-[#F8FAFC] p-6 rounded-2xl border border-[#c3c6d7]/30 text-left">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#434655] mb-4">
                    {isEditing ? 'Edit Bank Account' : 'Add Bank Account'}
                  </h3>
                  <form onSubmit={handleBankSubmit} className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">Bank Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Vietcombank, Techcombank, ACB"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full bg-white border border-[#c3c6d7] rounded-lg p-2.5 text-sm font-bold focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        required
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">Account Holder Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g., NGUYEN VAN A"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                        className="w-full bg-white border border-[#c3c6d7] rounded-lg p-2.5 text-sm font-bold focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all uppercase"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">Account Number</label>
                      <input 
                        type="text" 
                        placeholder="e.g., 0123456789"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-white border border-[#c3c6d7] rounded-lg p-2.5 text-sm font-bold focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-2 py-2">
                      <input 
                        id="is-default-checkbox"
                        type="checkbox" 
                        checked={isDefault}
                        onChange={(e) => setIsDefault(e.target.checked)}
                        className="w-4 h-4 border-[#c3c6d7] rounded text-primary focus:ring-primary cursor-pointer"
                      />
                      <label htmlFor="is-default-checkbox" className="text-xs font-bold text-[#434655] cursor-pointer select-none">
                        Set as default bank account
                      </label>
                    </div>

                    <div className="flex gap-3 pt-2">
                      {isEditing && (
                        <button 
                          type="button" 
                          onClick={resetBankForm}
                          className="flex-1 bg-white border border-[#c3c6d7] hover:bg-slate-50 text-[#434655] py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                      <button 
                        type="submit"
                        className="flex-1 bg-primary hover:brightness-110 text-white py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-primary/10"
                      >
                        {isEditing ? 'Save Changes' : 'Register Account'}
                      </button>
                    </div>
                  </form>
                </div>

              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardBankAccounts;
