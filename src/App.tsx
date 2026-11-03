import { Routes, Route } from "react-router-dom";
import { StorefrontLayout } from "@/layouts/StorefrontLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { useAuth } from "@/features/auth/AuthContext";
import { HomePage } from "@/pages/storefront/HomePage";
import { CatalogPage } from "@/pages/storefront/CatalogPage";
import { BrandPage } from "@/pages/storefront/BrandPage";
import { NewArrivalsPage } from "@/pages/storefront/NewArrivalsPage";
import { BestSellersPage } from "@/pages/storefront/BestSellersPage";
import { ProductDetailPage } from "@/pages/storefront/ProductDetailPage";
import { SearchResultsPage } from "@/pages/storefront/SearchResultsPage";
import { ComparePage } from "@/pages/storefront/ComparePage";
import { WishlistPage } from "@/pages/storefront/WishlistPage";
import { CartPage } from "@/pages/storefront/CartPage";
import { CheckoutPage } from "@/pages/storefront/CheckoutPage";
import { InstalmentInfoPage } from "@/pages/storefront/InstalmentInfoPage";
import { InstalmentApplyPage } from "@/pages/storefront/InstalmentApplyPage";
import { PaymentInstructionsPage } from "@/pages/storefront/PaymentInstructionsPage";
import { AboutPage } from "@/pages/storefront/AboutPage";
import { ContactPage } from "@/pages/storefront/ContactPage";
import { ContentPage } from "@/pages/storefront/ContentPage";
import { NotFoundPage } from "@/pages/storefront/NotFoundPage";
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from "@/pages/storefront/auth";
import { AccountLayout } from "@/layouts/AccountLayout";
import { AccountHome } from "@/pages/account/AccountHome";
import { AccountOrders } from "@/pages/account/AccountOrders";
import { AccountPayments } from "@/pages/account/AccountPayments";
import { AccountInstalments } from "@/pages/account/AccountInstalments";
import { AccountWishlist } from "@/pages/account/AccountWishlist";
import { AccountAddresses } from "@/pages/account/AccountAddresses";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { AdminProducts } from "@/pages/admin/AdminProducts";
import { AdminImport } from "@/pages/admin/AdminImport";
import { AdminOrders } from "@/pages/admin/AdminOrders";
import { AdminSettings } from "@/pages/admin/AdminSettings";
import { AdminAppearance } from "@/pages/admin/AdminAppearance";
import { AdminHomepage } from "@/pages/admin/AdminHomepage";
import { AdminPayments } from "@/pages/admin/AdminPayments";
import { AdminRoles } from "@/pages/admin/AdminRoles";
import { AdminSystem } from "@/pages/admin/AdminSystem";
import { AdminAudit } from "@/pages/admin/AdminAudit";
import { useSettings } from "@/features/settings/store";
import { BrandTheme } from "@/components/brand-theme";
import { ScrollToTop } from "@/components/scroll-to-top";

export default function App() {
  const { loading } = useAuth();
  const { settings } = useSettings();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-sm text-muted-foreground">Loading RAES TECH…</div>
      </div>
    );
  }

  return (
    <>
      <BrandTheme settings={settings} />
      <ScrollToTop />
      <Routes>
      {/* Storefront */}
      <Route element={<StorefrontLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/phones" element={<CatalogPage />} />
        <Route path="/brand/:brand" element={<BrandPage />} />
        <Route path="/new-arrivals" element={<NewArrivalsPage />} />
        <Route path="/best-sellers" element={<BestSellersPage />} />
        <Route path="/product/:slug" element={<ProductDetailPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/instalments" element={<InstalmentInfoPage />} />
        <Route path="/instalments/apply" element={<InstalmentApplyPage />} />
        <Route path="/payment-instructions" element={<PaymentInstructionsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/:slug" element={<ContentPage />} />
      </Route>

      {/* Customer account */}
      <Route
        element={
          <ProtectedRoute>
            <AccountLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/account" element={<AccountHome />} />
        <Route path="/account/orders" element={<AccountOrders />} />
        <Route path="/account/payments" element={<AccountPayments />} />
        <Route path="/account/instalments" element={<AccountInstalments />} />
        <Route path="/account/wishlist" element={<AccountWishlist />} />
        <Route path="/account/addresses" element={<AccountAddresses />} />
      </Route>

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="import" element={<AdminImport />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="appearance" element={<AdminAppearance />} />
        <Route path="homepage" element={<AdminHomepage />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="roles" element={<AdminRoles />} />
        <Route path="system" element={<AdminSystem />} />
        <Route path="audit" element={<AdminAudit />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
