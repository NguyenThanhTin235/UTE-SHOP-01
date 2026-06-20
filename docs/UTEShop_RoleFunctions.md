# Danh sách Chức năng theo Vai trò (Role-Based Function List) - UTEShop

Tài liệu này liệt kê các chức năng chi tiết cho từng tác nhân (Role) trong hệ thống thương mại điện tử UTEShop. Danh sách này đã được đồng bộ chuẩn xác với cấu trúc giao diện Frontend và Biểu đồ Usecase.

---

## 1. Khách vãng lai (Guest)
*Tác nhân chưa đăng nhập hệ thống, chỉ có thể xem và lưu tạm dữ liệu.*

| STT | Chức năng | Mô tả chi tiết |
| :-- | :--- | :--- |
| 1 | **Xem Trang chủ** | Xem Banner, Deals, danh mục nổi bật và sản phẩm hot. |
| 2 | **Tìm kiếm & Lọc sản phẩm** | Tìm theo từ khóa, lọc theo giá, màu, thương hiệu, danh mục. |
| 3 | **Xem Chi tiết sản phẩm** | Xem ảnh, giá, mô tả, thuộc tính (size/color) và đánh giá của khách mua trước. |
| 4 | **Đọc Blog & Thông tin tĩnh** | Đọc tin tức, bài viết, FAQ, chính sách giao hàng/hoàn trả của sàn. |
| 5 | **Quản lý Giỏ hàng (Local)** | Thêm sản phẩm vào giỏ hàng (lưu tạm ở trình duyệt/local storage). |
| 6 | **Đăng ký / Đăng nhập** | Tạo tài khoản hoặc đăng nhập qua OTP Email để xác thực danh tính. |

---

## 2. Khách hàng (Customer)
*Người dùng đã đăng nhập, có quyền mua sắm và tương tác sâu với hệ thống.*

| STT | Chức năng | Mô tả chi tiết |
| :-- | :--- | :--- |
| 1 | **Quản lý Giỏ hàng** | Thêm/sửa/xóa sản phẩm, đồng bộ giỏ hàng với máy chủ. |
| 2 | **Đặt hàng & Thanh toán** | Nhập địa chỉ, áp dụng khuyến mãi, thanh toán (VNPay/COD). |
| 3 | **Theo dõi Lịch sử đơn hàng** | Tra cứu trạng thái đơn hàng (Chờ xác nhận, Đang giao, Hoàn thành...). |
| 4 | **Hủy đơn hàng** | Hủy đơn khi chưa được giao hoặc yêu cầu hoàn trả khi có sự cố. |
| 5 | **Quản lý Yêu thích & Vừa xem** | Lưu lại (Wishlist) hoặc xem lại danh sách sản phẩm đã duyệt qua. |
| 6 | **Đánh giá Sản phẩm** | Viết đánh giá, bình chọn số sao và tải hình ảnh thực tế lên. |
| 7 | **Quản lý Hồ sơ & Bảo mật** | Cập nhật thông tin cá nhân, sổ địa chỉ và thiết lập bảo mật. |
| 8 | **Quản lý Ví Xu (Coins)** | Tích lũy Xu từ việc mua hàng/đánh giá và dùng Xu để giảm giá. |
| 9 | **Thống kê Cá nhân** | Xem thống kê số tiền đã chi tiêu, số lượng đơn hàng đã đặt. |
| 10 | **Xem Thông báo & Khuyến mãi** | Nhận thông báo hệ thống và tra cứu các mã giảm giá, voucher. |
| 11 | **Nâng cấp Tài khoản** | Gửi yêu cầu và nộp hồ sơ để trở thành Seller hoặc Shipper. |
| 12 | **Trợ lý AI & Chat** | Nhắn tin trực tiếp với AI để tư vấn sản phẩm, giải đáp thắc mắc mua hàng. |

---

## 3. Nhà bán hàng (Seller)
*Chủ gian hàng, quản lý kinh doanh trên sàn.*

| STT | Chức năng | Mô tả chi tiết |
| :-- | :--- | :--- |
| 1 | **Xem Tổng quan Shop** | Xem Dashboard báo cáo nhanh về doanh thu và lượng đơn hàng. |
| 2 | **Quản lý Sản phẩm** | Đăng sản phẩm mới, cập nhật tồn kho, hình ảnh và giá bán. |
| 3 | **Quản lý Đơn hàng** | Xác nhận đơn, chuẩn bị hàng và đẩy đơn vị vận chuyển. |
| 4 | **Xử lý Hủy/Hoàn trả** | Tiếp nhận và phê duyệt/từ chối các yêu cầu hoàn trả của khách hàng. |
| 5 | **Quản lý Ví Seller** | Theo dõi số dư, dòng tiền và tạo các lệnh rút tiền doanh thu. |
| 6 | **Phân tích & Thống kê** | Xem báo cáo chi tiết về hiệu suất kinh doanh (biểu đồ doanh thu). |
| 7 | **Quản lý Đánh giá** | Xem nhận xét của khách và phản hồi lại các đánh giá đó. |
| 8 | **Nhắn tin Khách hàng** | Hỗ trợ, tư vấn khách hàng qua hệ thống nhắn tin nội bộ. |
| 9 | **Cấu hình Shop** | Cập nhật logo, tên gian hàng, tài khoản ngân hàng và các thiết lập. |

---

## 4. Nhân viên Giao hàng (Shipper)
*Người vận chuyển đơn hàng đến tay người mua.*

| STT | Chức năng | Mô tả chi tiết |
| :-- | :--- | :--- |
| 1 | **Xem Tổng quan Shipper** | Dashboard theo dõi các đơn hàng đang giao và thành tích. |
| 2 | **Quản lý Giao hàng** | Nhận đơn, cập nhật trạng thái lấy hàng, đang giao và giao thành công. |
| 3 | **Thống kê Vận chuyển** | Xem báo cáo số lượng đơn giao thành công, tỷ lệ hoàn/hủy. |
| 4 | **Quản lý Hồ sơ Shipper** | Cập nhật thông tin phương tiện, khu vực hoạt động. |

---

## 5. Nhân viên Quản lý (Manager)
*Nhân sự kiểm duyệt nội dung và hỗ trợ vận hành sàn.*

| STT | Chức năng | Mô tả chi tiết |
| :-- | :--- | :--- |
| 1 | **Xem Thống kê Hệ thống** | Báo cáo cơ bản về tình hình hoạt động của các gian hàng và sản phẩm. |
| 2 | **Kiểm duyệt Shop & SP** | Duyệt hồ sơ đăng ký bán hàng, kiểm duyệt nội dung sản phẩm mới. |
| 3 | **Xử lý Vi phạm** | Ẩn sản phẩm sai phạm, tạm đình chỉ (Suspend) gian hàng có rủi ro. |
| 4 | **Theo dõi Đơn hàng** | Tra cứu trạng thái mọi đơn hàng để giải quyết các sự cố vận hành. |

---

## 6. Quản trị viên (Admin)
*Quyền cao nhất, quản lý tài chính và cấu hình cốt lõi.*

| STT | Chức năng | Mô tả chi tiết |
| :-- | :--- | :--- |
| 1 | **Thống kê Quản trị viên** | Dashboard tổng quan toàn hệ thống về doanh thu, GMV, tăng trưởng. |
| 2 | **Duyệt Rút tiền** | Kiểm tra đối soát và phê duyệt các lệnh rút tiền từ Seller. |
| 3 | **Duyệt Nâng cấp Role** | Chấp thuận yêu cầu chuyển đổi tài khoản thành Seller/Shipper. |
| 4 | **Quản lý Người dùng** | Cấm/Mở khóa tài khoản, xem danh sách toàn bộ khách hàng. |
| 5 | **Phân quyền (RBAC)** | Phân bổ quyền hạn (Permissions) cho các Role hoặc Manager cụ thể. |
| 6 | **Quản lý Blog** | Viết bài, xuất bản các bản tin tức, cập nhật chính sách. |
| 7 | **Quản lý Khuyến mãi** | Tạo Coupon, cấu hình Campaign giảm giá cho toàn sàn. |
| 8 | **Hỗ trợ Người dùng** | Trả lời Ticket hỗ trợ, giải quyết các khiếu nại (Dispute). |
| 9 | **Cấu hình Nền tảng & TC** | Thiết lập phí sàn, hệ số quy đổi Xu, cấu hình thanh toán. |
| 10 | **Cấu hình Giao diện & ĐVVC** | Thay đổi giao diện trang chủ (Banner, Danh mục) và Bật/Tắt đối tác Giao hàng. |
| 11 | **Nhật ký Hệ thống (Audit Log)** | Truy vết mọi thay đổi quan trọng trên hệ thống (Bảo mật). |
