// ---------- Domain types (mirror Supabase schema) ----------

export type ProductStatus = "draft" | "active" | "archived";
/**
 * All catalogue items are sold factory-sealed / new box packed. The data layer
 * (src/data/catalog.ts) normalises every variant to this single condition, so
 * no "used" / "open-box" / "refurbished" wording reaches the UI.
 */
export type ProductCondition = "new_box_packed";
export type OrderStatus =
  | "pending"
  | "payment_pending"
  | "payment_verification"
  | "confirmed"
  | "processing"
  | "packed"
  | "dispatched"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refund_requested"
  | "refunded";
export type PaymentStatus =
  | "unpaid"
  | "pending_verification"
  | "verified"
  | "rejected"
  | "refunded";
export type InstalmentStatus =
  | "submitted"
  | "under_review"
  | "additional_information_required"
  | "approved"
  | "rejected"
  | "advance_payment_pending"
  | "advance_payment_verified"
  | "agreement_pending"
  | "active"
  | "completed"
  | "cancelled";
export type UserRole =
  | "customer"
  | "super_admin"
  | "product_manager"
  | "order_manager"
  | "payment_verifier"
  | "instalment_reviewer"
  | "content_manager"
  | "finance_manager"
  | "support_staff";

export interface ProductVariant {
  sku: string;
  storage: string;
  ram: string;
  colors: string[];
  display: string;
  chipset: string;
  rear_camera: string;
  front_camera: string;
  battery: string;
  network: string;
  pta_status: string;
  condition: string;
  box_pack: string;
  listedPrice: number;
  buyNowPrice: number;
  instalmentTotal: number;
  monthly: number;
  priceEvidence: string;
  sourceUrl: string;
  confidence: string;
  priceCheckedDate: string;
  requiresVerification: boolean;
  notes: string;
  stock: number;
}

export interface Product {
  id: number;
  slug: string;
  brand: string;
  model: string;
  name: string;
  description: string;
  category: string;
  seo_title: string;
  seo_description: string;
  featured: boolean;
  new_arrival: boolean;
  bestseller: boolean;
  /** Representative product image file in /images/products/ (e.g. apple-iphone-15-pro.jpg). */
  image?: string;
  variants: ProductVariant[];
}

export interface Brand {
  name: string;
  slug: string;
}

export interface SiteSettings {
  storeName: string;
  tagline: string;
  domain: string;
  supportEmail: string;
  supportPhone: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  currency: string;
  currencySymbol: string;
  codEnabled: boolean;
  buyNowDiscountPercent: number;
  instalmentAdvancePercent: number;
  instalmentMarkupPercent: number;
  instalmentTenures: number[];
  shippingCharge: number;
  freeShippingThreshold: number;
  announcementText: string;
  primaryColor: string;
  secondaryColor: string;

  // ---- business / contact ----
  businessName: string;
  businessAddress: string;
  businessDescription: string;
  country: string;
  timezone: string;
  dateFormat: string;
  language: string;
  copyrightText: string;
  currencyFormat: string;

  // ---- SEO / browser ----
  browserTitle: string;
  defaultSeoDescription: string;

  // ---- behaviour ----
  announcementEnabled: boolean;
  maintenanceMode: boolean;

  // ---- assets ----
  faviconDataUrl: string;
  logoDataUrl: string;

  // ---- branding tokens ----
  theme: ThemeTokens;

  // ---- complex, JSON-backed groups ----
  homepageSections: HomepageSection[];
  paymentMethods: PaymentMethod[];
  socialLinks: SocialLinks;
  seoAnalytics: SeoAnalytics;
}

export interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export interface InstalmentPlan {
  advance: number;
  remaining: number;
  monthly: number;
  total: number;
  last: number;
}

// ---- Admin Control Centre domain models (persisted via settings) ----

export interface ThemeTokens {
  accentColor: string;
  backgroundColor: string;
  headerColor: string;
  footerColor: string;
  buttonColor: string;
  buttonHoverColor: string;
  textColor: string;
  linkColor: string;
  borderColor: string;
  fontFamily: string;
  headingFont: string;
  radiusScale: number;
}

export type HomepageSectionKind =
  | "hero"
  | "announcement"
  | "featuredBrands"
  | "latest"
  | "featuredIphones"
  | "samsung"
  | "jvIphones"
  | "bestSellers"
  | "newArrivals"
  | "specialOffers"
  | "buyNowPromo"
  | "instalmentPromo"
  | "testimonials"
  | "faq"
  | "newsletter"
  | "contact";

export interface HomepageSection {
  id: string;
  kind: HomepageSectionKind;
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  background?: string;
  imageUrl?: string;
  enabled: boolean;
  sort: number;
}

export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  enabled: boolean;
  customerDescription?: string;
  displayOrder: number;
  minAmount?: number;
  maxAmount?: number;
  type: "manual" | "online";
  testMode: boolean;
  liveMode: boolean;
  verified: boolean;
  // manual bank transfer details
  bankName?: string;
  accountTitle?: string;
  accountNumber?: string;
  iban?: string;
  branch?: string;
  instructions?: string;
}

export interface SocialLinks {
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
  other: Array<{ label: string; url: string }>;
}

export interface SeoAnalytics {
  browserTitle: string;
  defaultSeoDescription: string;
  googleAnalyticsId: string;
  googleSearchConsoleVerification: string;
  analyticsEnabled: boolean;
  canonicalBase: string;
  robotsTxt: string;
}

export interface SystemStatus {
  environment: "development" | "production";
  supabaseConfigured: boolean;
  analyticsConfigured: boolean;
  maintenanceMode: boolean;
  lastAuditAt?: string;
}
