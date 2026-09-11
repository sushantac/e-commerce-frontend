export type UserRole = "USER" | "ADMIN";

// ─── Auth Service (auth-service.yaml) ───────────────────────────────────

export interface User {
  id: number;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role?: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AccessTokenResponse {
  accessToken: string;
}

// ─── Product Service (product-service.yaml) ─────────────────────────────

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  categories: Category[];
}

export interface ProductRequest {
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  categoryIds?: number[];
}

export interface Paginated<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// ─── Cart Service (cart-service.yaml) ───────────────────────────────────

export interface CartItemDto {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CartSummary {
  id: number;
  items: CartItemDto[];
  subtotal: number;
  tax: number;
  total: number;
}

export interface AddCartItemRequest {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

// ─── Order Management API (order-service.yaml) ──────────────────────────

export type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface OrderItemDto {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderSummary {
  id: number;
  orderNumber: string;
  orderDate: string;
  status: OrderStatus;
  totalAmount: number;
  customerEmail: string;
}

export interface OrderDetail extends OrderSummary {
  items: OrderItemDto[];
}

export interface OrderRequest {
  customerId: number;
  items: OrderItemRequest[];
}

export interface OrderItemRequest {
  productId: number;
  quantity: number;
}

export interface CustomerDto {
  id: number;
  email: string;
  fullName: string;
  phoneNumber?: string;
  createdAt: string;
}

// ─── Admin Service (admin-service.yaml) ─────────────────────────────────

export interface DashboardResponse {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalProducts: number;
  recentOrders: AdminOrderSummary[];
}

export interface AdminOrderSummary {
  id: number;
  orderNumber: string;
  customerEmail: string;
  totalAmount: number;
  status: OrderStatus;
  orderDate: string;
}

export interface AdminOrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface AdminOrderDetail {
  id: number;
  orderNumber: string;
  customerEmail: string;
  totalAmount: number;
  status: OrderStatus;
  orderDate: string;
  items: AdminOrderItem[];
}

export interface AdminUserSummary {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  orderCount: number;
  createdAt: string;
}

export interface AdminUserDetail {
  id: number;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: UserRole;
  orderCount: number;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface AdminOrderStatusResponse {
  status: OrderStatus;
}

export interface PaginatedAdminOrders {
  content: AdminOrderSummary[];
  totalElements: number;
  totalPages: number;
}

export interface PaginatedAdminUsers {
  content: AdminUserSummary[];
  totalElements: number;
  totalPages: number;
}

// ─── Review Service (review-service.yaml) ───────────────────────────────

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Review {
  id: number;
  productId: number;
  userId: number;
  rating: number;
  title?: string;
  body?: string;
  verifiedPurchase: boolean;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewRequest {
  productId: number;
  rating: number;
  title?: string;
  body?: string;
}

export interface ReviewSummary {
  productId: number;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<string, number>;
}

export interface PaginatedReviews {
  content: Review[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}