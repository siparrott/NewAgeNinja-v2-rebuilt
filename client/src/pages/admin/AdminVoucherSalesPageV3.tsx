import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "../../components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy,
  Package,
  Tag,
  TrendingUp,
  Euro,
  ShoppingCart,
  Gift,
  Percent,
  Calendar,
  Eye,
  Download,
  Settings,
  ArrowRight,
  CheckCircle,
  Users,
  BarChart3,
  Home,
  UserPlus,
  Mail,
  Camera,
  FileText,
  Folder,
  Image,
  MessageSquare,
  Calendar as CalendarIcon,
  CreditCard,
  PieChart,
  Globe,
  Palette
} from "lucide-react";

// Types
type VoucherProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  validityMonths: number;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
};

type DiscountCoupon = {
  id: string;
  code: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  createdAt: string;
};

type VoucherSale = {
  id: string;
  voucherCode: string;
  productId: string;
  purchaserName: string;
  purchaserEmail: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
};

export default function AdminVoucherSalesPageV3() {
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedProduct, setSelectedProduct] = useState<VoucherProduct | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<DiscountCoupon | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // API calls
  const { data: voucherProducts, isLoading: isLoadingProducts } = useQuery<VoucherProduct[]>({
    queryKey: ['/api/vouchers/products'],
  });

  const { data: discountCoupons, isLoading: isLoadingCoupons } = useQuery<DiscountCoupon[]>({
    queryKey: ['/api/vouchers/coupons'],
  });

  const { data: voucherSales, isLoading: isLoadingSales } = useQuery<VoucherSale[]>({
    queryKey: ['/api/vouchers/sales'],
  });

  // Calculate statistics
  const stats = {
    totalRevenue: voucherSales?.reduce((sum, sale) => sum + Number(sale.finalAmount), 0) || 0,
    totalSales: voucherSales?.length || 0,
    activeProducts: voucherProducts?.filter(p => p.isActive).length || 0,
    activeCoupons: discountCoupons?.filter(c => c.isActive).length || 0,
    avgOrderValue: voucherSales?.length ? (voucherSales.reduce((sum, sale) => sum + Number(sale.finalAmount), 0) / voucherSales.length) : 0,
    totalDiscountGiven: voucherSales?.reduce((sum, sale) => sum + Number(sale.discountAmount), 0) || 0
  };

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setIsProductDialogOpen(true);
  };

  const handleCreateCoupon = () => {
    setSelectedCoupon(null);
    setIsCouponDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Voucher & Sales Management</h1>
              <p className="text-gray-600 mt-1">Manage voucher products, discount codes, and track sales performance</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Voucher Management">
              <button
                onClick={() => setActiveView("dashboard")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeView === "dashboard"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </div>
              </button>
              <button
                onClick={() => setActiveView("products")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeView === "products"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Products ({stats.activeProducts})
                </div>
              </button>
              <button
                onClick={() => setActiveView("coupons")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeView === "coupons"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center">
                  <Tag className="h-4 w-4 mr-2" />
                  Coupons ({stats.activeCoupons})
                </div>
              </button>
              <button
                onClick={() => setActiveView("sales")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeView === "sales"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Sales ({stats.totalSales})
                </div>
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeView === "dashboard" && (
              <DashboardView 
                stats={stats} 
                onCreateProduct={handleCreateProduct}
                onCreateCoupon={handleCreateCoupon}
                recentSales={voucherSales?.slice(0, 5) || []}
              />
            )}
            {activeView === "products" && (
              <ProductsView 
                products={voucherProducts || []} 
                isLoading={isLoadingProducts}
                onCreateProduct={handleCreateProduct}
                onEditProduct={(product) => {
                  setSelectedProduct(product);
                  setIsProductDialogOpen(true);
                }}
              />
            )}
            {activeView === "coupons" && (
              <CouponsView 
                coupons={discountCoupons || []} 
                isLoading={isLoadingCoupons}
                onCreateCoupon={handleCreateCoupon}
                onEditCoupon={(coupon) => {
                  setSelectedCoupon(coupon);
                  setIsCouponDialogOpen(true);
                }}
              />
            )}
            {activeView === "sales" && (
              <SalesView 
                sales={voucherSales || []} 
                isLoading={isLoadingSales}
              />
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ProductDialog 
        open={isProductDialogOpen}
        onOpenChange={setIsProductDialogOpen}
        product={selectedProduct}
      />
      <CouponDialog 
        open={isCouponDialogOpen}
        onOpenChange={setIsCouponDialogOpen}
        coupon={selectedCoupon}
      />
    </AdminLayout>
  );
}

// Dashboard View Component
const DashboardView: React.FC<{
  stats: any;
  onCreateProduct: () => void;
  onCreateCoupon: () => void;
  recentSales: VoucherSale[];
}> = ({ stats, onCreateProduct, onCreateCoupon, recentSales }) => {
  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Total Revenue</CardTitle>
            <Euro className="h-4 w-4 text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-blue-100">From {stats.totalSales} sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProducts}</div>
            <p className="text-xs text-muted-foreground">Available for sale</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCoupons}</div>
            <p className="text-xs text-muted-foreground">Currently valid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.avgOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per voucher sale</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors cursor-pointer" onClick={onCreateProduct}>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Create New Voucher Product</CardTitle>
            <CardDescription>
              Set up a new photography voucher package for customers to purchase
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={onCreateProduct} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create Voucher Product
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed border-gray-300 hover:border-purple-500 transition-colors cursor-pointer" onClick={onCreateCoupon}>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Tag className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle>Create Discount Coupon</CardTitle>
            <CardDescription>
              Generate promotional codes for special offers and campaigns
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={onCreateCoupon} variant="secondary" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create Discount Coupon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>Latest voucher purchases from customers</CardDescription>
        </CardHeader>
        <CardContent>
          {recentSales.length > 0 ? (
            <div className="space-y-4">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Gift className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{sale.purchaserName}</p>
                      <p className="text-sm text-gray-500">{sale.voucherCode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">€{Number(sale.finalAmount).toFixed(2)}</p>
                    <p className="text-sm text-gray-500">{new Date(sale.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No sales yet. Create voucher products to start selling.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Products View Component
const ProductsView: React.FC<{
  products: VoucherProduct[];
  isLoading: boolean;
  onCreateProduct: () => void;
  onEditProduct: (product: VoucherProduct) => void;
}> = ({ products, isLoading, onCreateProduct, onEditProduct }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Product Catalog</h2>
          <p className="text-gray-600">Manage your photography voucher offerings</p>
        </div>
        <Button onClick={onCreateProduct}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">
                        {product.validityMonths} months
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">€{product.price}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">{product.description}</p>
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditProduct(product)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No voucher products yet</h3>
            <p className="text-gray-600 mb-6">Create your first voucher product to start selling photography packages</p>
            <Button onClick={onCreateProduct}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Product
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Coupons View Component  
const CouponsView: React.FC<{
  coupons: DiscountCoupon[];
  isLoading: boolean;
  onCreateCoupon: () => void;
  onEditCoupon: (coupon: DiscountCoupon) => void;
}> = ({ coupons, isLoading, onCreateCoupon, onEditCoupon }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Copied: ${text}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Coupon Management</h2>
          <p className="text-gray-600">Create and manage promotional discount codes</p>
        </div>
        <Button onClick={onCreateCoupon}>
          <Plus className="h-4 w-4 mr-2" />
          Add Coupon
        </Button>
      </div>

      {coupons.length > 0 ? (
        <div className="space-y-4">
          {coupons.map((coupon) => (
            <Card key={coupon.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <code className="bg-gray-100 px-3 py-1 rounded text-lg font-mono font-bold">
                        {coupon.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(coupon.code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle className="text-lg">{coupon.name}</CardTitle>
                    <CardDescription>{coupon.description}</CardDescription>
                  </div>
                  <div className="text-right">
                    <Badge variant={coupon.isActive ? "default" : "secondary"} className="mb-2">
                      {coupon.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <div className="text-sm text-gray-600">
                      Used: {coupon.usageCount} / {coupon.usageLimit || "∞"}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm mb-4">
                  <div className="flex items-center space-x-1">
                    <Percent className="h-4 w-4 text-gray-400" />
                    <span>
                      {coupon.discountType === 'percentage' 
                        ? `${coupon.discountValue}% off`
                        : `€${coupon.discountValue} off`
                      }
                    </span>
                  </div>
                  {coupon.minOrderAmount && (
                    <div className="flex items-center space-x-1">
                      <Euro className="h-4 w-4 text-gray-400" />
                      <span>Min: €{coupon.minOrderAmount}</span>
                    </div>
                  )}
                  {coupon.endDate && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Expires: {new Date(coupon.endDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditCoupon(coupon)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No discount coupons yet</h3>
            <p className="text-gray-600 mb-6">Create promotional codes to offer discounts to your customers</p>
            <Button onClick={onCreateCoupon}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Coupon
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Sales View Component
const SalesView: React.FC<{
  sales: VoucherSale[];
  isLoading: boolean;
}> = ({ sales, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Sales History</h2>
          <p className="text-gray-600">Track all voucher sales and customer orders</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Sales
        </Button>
      </div>

      {sales.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Voucher Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Original Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Final Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">
                          {sale.voucherCode}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{sale.purchaserName}</div>
                          <div className="text-sm text-gray-500">{sale.purchaserEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{Number(sale.originalAmount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        -€{Number(sale.discountAmount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        €{Number(sale.finalAmount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={sale.status === 'active' ? 'default' : 'secondary'}>
                          {sale.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sales yet</h3>
            <p className="text-gray-600">Voucher sales will appear here once customers start purchasing</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Product Dialog Component
const ProductDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: VoucherProduct | null;
}> = ({ open, onOpenChange, product }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Edit Voucher Product' : 'Create New Voucher Product'}
          </DialogTitle>
          <DialogDescription>
            {product 
              ? 'Update the details of this voucher product'
              : 'Create a new voucher product that customers can purchase'
            }
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input 
                id="name" 
                placeholder="e.g., Family Photo Session Voucher"
                defaultValue={product?.name || ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (€)</Label>
              <Input 
                id="price" 
                type="number" 
                placeholder="199.00"
                defaultValue={product?.price || ''}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Describe what's included in this voucher package..."
              rows={3}
              defaultValue={product?.description || ''}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validity">Validity (Months)</Label>
              <Input 
                id="validity" 
                type="number" 
                placeholder="12"
                defaultValue={product?.validityMonths || ''}
              />
            </div>
            <div className="space-y-2 flex items-center space-x-2 pt-6">
              <Switch 
                id="active" 
                defaultChecked={product?.isActive ?? true}
              />
              <Label htmlFor="active">Active for sale</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => {
            alert(product ? "Product updated successfully" : "Product created successfully");
            onOpenChange(false);
          }}>
            {product ? 'Update Product' : 'Create Product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Coupon Dialog Component
const CouponDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: DiscountCoupon | null;
}> = ({ open, onOpenChange, coupon }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {coupon ? 'Edit Discount Coupon' : 'Create New Discount Coupon'}
          </DialogTitle>
          <DialogDescription>
            {coupon 
              ? 'Update the details of this discount coupon'
              : 'Create a new discount coupon for promotional campaigns'
            }
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Coupon Code</Label>
              <Input 
                id="code" 
                placeholder="e.g., WELCOME15"
                defaultValue={coupon?.code || ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon-name">Coupon Name</Label>
              <Input 
                id="coupon-name" 
                placeholder="e.g., Welcome Discount"
                defaultValue={coupon?.name || ''}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="coupon-description">Description</Label>
            <Textarea 
              id="coupon-description" 
              placeholder="Describe this discount offer..."
              rows={2}
              defaultValue={coupon?.description || ''}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount-type">Discount Type</Label>
              <Select defaultValue={coupon?.discountType || 'percentage'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed_amount">Fixed Amount (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount-value">Discount Value</Label>
              <Input 
                id="discount-value" 
                type="number" 
                placeholder="15"
                defaultValue={coupon?.discountValue || ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min-order">Min Order (€)</Label>
              <Input 
                id="min-order" 
                type="number" 
                placeholder="100"
                defaultValue={coupon?.minOrderAmount || ''}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="usage-limit">Usage Limit</Label>
              <Input 
                id="usage-limit" 
                type="number" 
                placeholder="100"
                defaultValue={coupon?.usageLimit || ''}
              />
            </div>
            <div className="space-y-2 flex items-center space-x-2 pt-6">
              <Switch 
                id="coupon-active" 
                defaultChecked={coupon?.isActive ?? true}
              />
              <Label htmlFor="coupon-active">Active</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => {
            alert(coupon ? "Coupon updated successfully" : "Coupon created successfully");
            onOpenChange(false);
          }}>
            {coupon ? 'Update Coupon' : 'Create Coupon'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};