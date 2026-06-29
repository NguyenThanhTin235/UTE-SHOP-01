# Danh sách Chức năng theo Vai trò (Role-Based Function List) - UTEShop

Tài liệu này được cập nhật dựa trên thực tế mã nguồn (Source Code), liệt kê các chức năng chi tiết cho từng tác nhân (Role) trong hệ thống thương mại điện tử UTEShop.

---

## 1. Khách vãng lai (Guest)
*Tác nhân chưa đăng nhập hệ thống.*

| STT | Chức năng | Mô tả chi tiết | Code Reference |
| :-- | :--- | :--- | :--- |
| 1 | **Xem Trang chủ** | Xem Banner, Deals, danh mục nổi bật và sản phẩm hot. | `Home.jsx` |
| 2 | **Tìm kiếm & Lọc sản phẩm** | Tìm theo từ khóa, xem danh sách sản phẩm. | `Search.jsx` |
| 3 | **Xem Chi tiết sản phẩm** | Xem ảnh, giá, mô tả, đánh giá từ người khác. | `ProductDetail.jsx` |
| 4 | **Xem thông tin tĩnh** | Đọc chính sách hệ thống, FAQ. | `PolicyDetail.jsx` |
| 5 | **Đọc Blog** | Xem các bài viết blog từ Admin. | `Blog.jsx`, `BlogDetail.jsx` |
| 6 | **Quản lý Giỏ hàng (Local)** | Thêm sản phẩm vào giỏ hàng chưa đăng nhập. | `Cart.jsx` |
| 7 | **Đăng ký / Đăng nhập** | Đăng ký, đăng nhập, Quên mật khẩu, Xác thực OTP. | `Login.jsx`, `Register.jsx`, `VerifyOTP.jsx`, `ForgotPassword.jsx` |

---

## 2. Khách hàng (Customer)
*Người dùng đã đăng nhập, thực hiện mua sắm.*

| STT | Chức năng | Mô tả chi tiết | Code Reference |
| :-- | :--- | :--- | :--- |
| 1 | **Quản lý Giỏ hàng** | Thêm, sửa số lượng, áp dụng mã giảm giá. | `Cart.jsx` |
| 2 | **Đặt hàng & Thanh toán** | Đặt hàng, thanh toán qua VNPay hoặc COD. | `Checkout.jsx`, `VNPayReturn.jsx`, `OrderSuccess.jsx` |
| 3 | **Theo dõi Lịch sử đơn hàng** | Xem danh sách đơn hàng, xem chi tiết và hành trình giao hàng. | `OrderHistory.jsx`, `OrderDetail.jsx` |
| 4 | **Hủy đơn hàng** | Yêu cầu hủy đơn hàng. | `CancelOrder.jsx` |
| 5 | **Quản lý Danh sách yêu thích** | Lưu các sản phẩm vào Wishlist. | `Wishlist.jsx` |
| 6 | **Xem Sản phẩm vừa xem** | Theo dõi lịch sử xem sản phẩm gần đây. | `RecentlyViewed.jsx` |
| 7 | **Đánh giá Sản phẩm** | Viết đánh giá cho sản phẩm đã mua, xem lại lịch sử đánh giá cá nhân. | `Reviews.jsx` |
| 8 | **Quản lý Hồ sơ & Sổ địa chỉ** | Cập nhật thông tin cá nhân, quản lý danh sách địa chỉ nhận hàng. | `DashboardProfile.jsx`, `AddressBook.jsx` |
| 9 | **Quản lý Bảo mật** | Cập nhật mật khẩu, cài đặt bảo mật. | `DashboardSecurity.jsx`, `SecuritySettings.jsx` |
| 10 | **Ví Xu (Coins)** | Xem số dư xu thưởng và lịch sử giao dịch xu. | `Coins.jsx` |
| 11 | **Thống kê Cá nhân** | Xem biểu đồ thống kê chi tiêu, tổng số đơn hàng đã đặt. | `UserStatistics.jsx` |
| 12 | **Xem Thông báo** | Nhận và xem thông báo từ hệ thống. | `Notifications.jsx` |
| 13 | **Nâng cấp Tài khoản** | Yêu cầu nâng cấp tài khoản lên Seller hoặc Shipper. | `RoleUpgrade.jsx` |
| 14 | **Xem Khuyến mãi** | Xem danh sách các mã giảm giá, chiến dịch. | `Promotions.jsx` |
| 15 | **Trợ lý AI & Chat** | Tương tác Chatbot AI hỗ trợ mua sắm, tư vấn sản phẩm. | `CustomerAIChat.jsx` |

---

## 3. Nhà bán hàng (Seller)
*Chủ gian hàng, quản lý kinh doanh trên sàn.*

| STT | Chức năng | Mô tả chi tiết | Code Reference |
| :-- | :--- | :--- | :--- |
| 1 | **Xem Tổng quan (Dashboard)** | Xem số liệu tổng quan về gian hàng. | `SellerDashboardOverview.jsx` |
| 2 | **Quản lý Sản phẩm** | Thêm mới, chỉnh sửa, xóa sản phẩm của shop. | `SellerProducts.jsx`, `SellerAddProduct.jsx` |
| 3 | **Quản lý Đơn hàng** | Xác nhận đơn hàng, chuyển giao cho ĐVVC, xem chi tiết đơn. | `SellerOrders.jsx`, `SellerOrderDetail.jsx` |
| 4 | **Xử lý Hủy/Hoàn trả** | Tiếp nhận và xử lý yêu cầu hủy, hoàn trả từ khách hàng. | `SellerCancellations.jsx` |
| 5 | **Quản lý Ví Seller** | Xem số dư, tạo lệnh rút tiền (Withdrawal). | `SellerWallet.jsx` |
| 6 | **Phân tích & Thống kê** | Xem biểu đồ doanh thu, số lượng đơn hàng, đánh giá. | `SellerAnalytics.jsx` |
| 7 | **Quản lý Đánh giá** | Xem phản hồi từ khách hàng, phản hồi lại đánh giá. | `SellerReviews.jsx` |
| 8 | **Nhắn tin Khách hàng** | Chat trực tiếp với khách hàng (Hỗ trợ, chốt đơn). | `SellerMessages.jsx` |
| 9 | **Cấu hình Shop** | Cập nhật thông tin gian hàng, tài khoản ngân hàng. | `SellerSettings.jsx` |

---

## 4. Nhân viên giao hàng (Shipper)
*Người đảm nhận vai trò vận chuyển hàng hóa.*

| STT | Chức năng | Mô tả chi tiết | Code Reference |
| :-- | :--- | :--- | :--- |
| 1 | **Xem Tổng quan (Dashboard)** | Xem số lượng đơn cần giao, đã giao. | `ShipperDashboardOverview.jsx` |
| 2 | **Quản lý Giao hàng** | Cập nhật trạng thái đơn hàng (Đang giao, Đã giao thành công, Thất bại). | `ShipperOrders.jsx`, `ShipperOrderDetail.jsx` |
| 3 | **Thống kê Vận chuyển** | Xem hiệu suất giao hàng, tỷ lệ giao thành công. | `ShipperStatistics.jsx` |
| 4 | **Quản lý Hồ sơ Shipper** | Cập nhật thông tin phương tiện, tài xế. | `ShipperProfile.jsx` |

---

## 5. Nhân viên Quản lý (Manager)
*Nhân sự chuyên trách kiểm duyệt hàng hóa và vi phạm nội dung.*

| STT | Chức năng | Mô tả chi tiết | Code Reference |
| :-- | :--- | :--- | :--- |
| 1 | **Theo dõi Thống kê** | Xem báo cáo hoạt động liên quan đến quản lý. | `ManagerStatistics.jsx` |
| 2 | **Kiểm duyệt Shop** | Duyệt hoặc từ chối yêu cầu mở gian hàng. | `ShopApprovalTab.jsx`, `ManagerShopDetail.jsx` |
| 3 | **Kiểm duyệt Sản phẩm** | Kiểm duyệt sản phẩm đăng bán. | `ProductApprovalTab.jsx`, `ManagerProductDetail.jsx` |
| 4 | **Xử lý Vi phạm** | Đình chỉ (Suspend) gian hàng/sản phẩm có vi phạm. | `ViolationsTab.jsx`, `ManagerViolationDetail.jsx` |
| 5 | **Theo dõi Đơn hàng** | Xem chi tiết, theo dõi danh sách tất cả các đơn hàng. | `ManagerOrdersTab.jsx`, `ManagerOrderDetail.jsx` |

---

## 6. Quản trị viên (Admin)
*Quyền cao nhất, quản lý tài chính, người dùng và vận hành toàn sàn.*

| STT | Chức năng | Mô tả chi tiết | Code Reference |
| :-- | :--- | :--- | :--- |
| 1 | **Tổng quan Hệ thống** | Xem báo cáo tài chính toàn sàn, số lượng users. | `AdminDashboardOverview.jsx` |
| 2 | **Duyệt Rút tiền** | Duyệt lệnh yêu cầu rút tiền của các Seller. | `WithdrawalApprovalTab.jsx` |
| 3 | **Duyệt Nâng cấp Role** | Duyệt hồ sơ nâng cấp thành Seller hoặc Shipper. | `RoleUpgradesTab.jsx` |
| 4 | **Quản lý Người dùng** | Cấm (Ban), mở khóa tài khoản, xem danh sách. | `UserManagementTab.jsx` |
| 5 | **Phân quyền (RBAC)** | Phân quyền Manager, cài đặt quyền hệ thống. | `RBACTab.jsx` |
| 6 | **Quản lý Bài viết (Blog)** | Viết, chỉnh sửa, xóa bài viết tin tức/blog. | `BlogManagementTab.jsx`, `BlogEditor.jsx` |
| 7 | **Quản lý Khuyến mãi** | Tạo chiến dịch lớn, mã giảm giá chung, mã hệ thống. | `PromotionsTab.jsx`, `CampaignEditor.jsx`, `CouponEditor.jsx` |
| 8 | **Hỗ trợ Người dùng** | Trả lời, hỗ trợ khiếu nại (Ticket/Dispute). | `UserSupportTab.jsx` |
| 9 | **Cấu hình ĐVVC** | Quản lý, cấu hình phí cho các Đơn vị vận chuyển (Logistics). | `LogisticsPartnersTab.jsx` |
| 10 | **Cấu hình Nền tảng** | Cấu hình phí sàn (Platform fee), tỷ lệ xu. | `PlatformSettingsTab.jsx` |
| 11 | **Cấu hình Tài chính** | Cấu hình cổng thanh toán, tài khoản hệ thống. | `FinanceSettingsTab.jsx` |
| 12 | **Cấu hình Giao diện** | Tùy biến trang chủ, cấu hình danh mục. | `UIConfigTab.jsx` |
| 13 | **Nhật ký Hệ thống (Audit)**| Xem lại Security Logs, ghi nhận hành động quản trị. | `SecurityLogsTab.jsx` |
