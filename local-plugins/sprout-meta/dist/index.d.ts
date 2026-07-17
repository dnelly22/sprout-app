export interface SproutMetaPlugin {
  /**
   * Boot the Meta SDK and report the install/app-open. Call once, AFTER the ATT
   * decision. `advertiserTracking` must be true only when ATT was authorised.
   */
  initialize(options: { advertiserTracking: boolean }): Promise<void>;
  /** Update advertiser-tracking consent (mirrors the ATT status). */
  setAdvertiserTrackingEnabled(options: { enabled: boolean }): Promise<void>;
  /** Log an app event. Numeric params (e.g. `_valueToSum`) keep their type. */
  logEvent(options: { event: string; params?: Record<string, unknown> }): Promise<void>;
}

export declare const SproutMeta: SproutMetaPlugin;
