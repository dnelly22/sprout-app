/*
 * Apple In-App Purchase via RevenueCat — the iOS payment path.
 *
 * The web/PWA build keeps Stripe (see engine/plan.ts). The native iOS app must
 * use Apple IAP (App Store Guideline 3.1.1), so on iOS the paywall drives these
 * helpers instead. Everything here no-ops unless we're in the native app AND a
 * RevenueCat key is configured, so importing it is safe in the web bundle.
 *
 * Key comes from VITE_RC_IOS_KEY (RevenueCat public iOS SDK key, "appl_…").
 * Products/prices live in App Store Connect + RevenueCat; the app only needs
 * the entitlement id to decide access.
 */
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import type { PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { isNativeApp } from './native';

const RC_KEY = (import.meta.env.VITE_RC_IOS_KEY as string | undefined) || '';

/** The RevenueCat entitlement that unlocks Premium (create it with this exact id). */
export const ENTITLEMENT = 'premium';

/** IAP is active only in the native app with a configured RevenueCat key. */
export function iapEnabled(): boolean {
  return isNativeApp() && !!RC_KEY;
}

let configured = false;
/** Configure RevenueCat once, at native startup. Safe to call anywhere. */
export async function initIAP(): Promise<void> {
  if (!iapEnabled() || configured) return;
  try {
    if (import.meta.env.DEV) await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    await Purchases.configure({ apiKey: RC_KEY });
    configured = true;
  } catch { /* ignore — paywall stays locked if config fails */ }
}

const hasEntitlement = (info: { entitlements: { active: Record<string, unknown> } }) =>
  !!info?.entitlements?.active?.[ENTITLEMENT];

/** Does the signed-in Apple account currently hold the Premium entitlement? */
export async function iapIsPremium(): Promise<boolean> {
  if (!iapEnabled()) return false;
  try { const { customerInfo } = await Purchases.getCustomerInfo(); return hasEntitlement(customerInfo); }
  catch { return false; }
}

export interface IapPackage {
  id: string;
  priceString: string;            // localized, e.g. "$14.99"
  period: 'annual' | 'monthly' | 'other';
  pkg: PurchasesPackage;          // pass back to iapPurchase()
}

/** The purchasable packages from RevenueCat's current Offering. */
export async function iapPackages(): Promise<IapPackage[]> {
  if (!iapEnabled()) return [];
  try {
    const offerings = await Purchases.getOfferings();
    const pkgs = offerings.current?.availablePackages ?? [];
    return pkgs.map((p) => ({
      id: p.identifier,
      priceString: p.product.priceString,
      period: String(p.packageType) === 'ANNUAL' ? 'annual' : String(p.packageType) === 'MONTHLY' ? 'monthly' : 'other',
      pkg: p,
    }));
  } catch { return []; }
}

/** Run the Apple purchase sheet. Returns true if Premium is now active (false on cancel/error). */
export async function iapPurchase(pkg: PurchasesPackage): Promise<boolean> {
  if (!iapEnabled()) return false;
  try { const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg }); return hasEntitlement(customerInfo); }
  catch { return false; } // user-cancelled or failed
}

/** Apple "Restore Purchases" — required for subscription apps. */
export async function iapRestore(): Promise<boolean> {
  if (!iapEnabled()) return false;
  try { const { customerInfo } = await Purchases.restorePurchases(); return hasEntitlement(customerInfo); }
  catch { return false; }
}
