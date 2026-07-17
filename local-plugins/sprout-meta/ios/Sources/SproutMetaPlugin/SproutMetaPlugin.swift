import Foundation
import Capacitor
import FBSDKCoreKit

/*
 * Meta (Facebook) app events for Sprout — iOS ad attribution.
 *
 * Deliberate design points:
 *  - The SDK does NOT auto-initialise. Info.plist sets FacebookAutoLogAppEventsEnabled
 *    and FacebookAdvertiserIDCollectionEnabled to false; we call `initialize()` only
 *    after the parent has answered the ATT prompt. So a decline means no advertiser
 *    data is ever collected.
 *  - Event parameters keep their NUMERIC types. Meta's `_valueToSum` (revenue) must
 *    be a number — stringifying it silently discards the value.
 */
@objc(SproutMetaPlugin)
public class SproutMetaPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SproutMetaPlugin"
    public let jsName = "SproutMeta"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "initialize", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setAdvertiserTrackingEnabled", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "logEvent", returnType: CAPPluginReturnPromise)
    ]

    private var started = false

    /// Boot the SDK and report the install/app-open. Call AFTER the ATT decision.
    /// `enabled` reflects ATT: true only when the user authorised tracking.
    @objc func initialize(_ call: CAPPluginCall) {
        let enabled = call.getBool("advertiserTracking") ?? false
        DispatchQueue.main.async {
            if !self.started {
                ApplicationDelegate.shared.initializeSDK()
                self.started = true
            }
            // Order matters: set consent before any event is flushed.
            Settings.shared.isAdvertiserTrackingEnabled = enabled
            Settings.shared.isAdvertiserIDCollectionEnabled = enabled
            Settings.shared.isAutoLogAppEventsEnabled = true
            // This is the call that actually reports the install / app-open to Meta.
            AppEvents.shared.activateApp()
            call.resolve()
        }
    }

    @objc func setAdvertiserTrackingEnabled(_ call: CAPPluginCall) {
        let enabled = call.getBool("enabled") ?? false
        DispatchQueue.main.async {
            Settings.shared.isAdvertiserTrackingEnabled = enabled
            Settings.shared.isAdvertiserIDCollectionEnabled = enabled
            call.resolve()
        }
    }

    /// Log an app event. Numbers stay numbers so `_valueToSum` carries revenue.
    @objc func logEvent(_ call: CAPPluginCall) {
        guard let event = call.getString("event") else {
            call.reject("Missing 'event'")
            return
        }
        let raw = call.getObject("params") ?? [:]
        var params: [AppEvents.ParameterName: Any] = [:]
        var valueToSum: Double?

        for (key, value) in raw {
            // `_valueToSum` is a top-level argument in the SDK, not a parameter.
            if key == "_valueToSum" {
                if let n = value as? NSNumber { valueToSum = n.doubleValue }
                else if let s = value as? String { valueToSum = Double(s) }
                continue
            }
            switch value {
            case let n as NSNumber: params[AppEvents.ParameterName(key)] = n
            case let s as String: params[AppEvents.ParameterName(key)] = s
            default: params[AppEvents.ParameterName(key)] = String(describing: value)
            }
        }

        DispatchQueue.main.async {
            let name = AppEvents.Name(event)
            if let sum = valueToSum {
                AppEvents.shared.logEvent(name, valueToSum: sum, parameters: params)
            } else if params.isEmpty {
                AppEvents.shared.logEvent(name)
            } else {
                AppEvents.shared.logEvent(name, parameters: params)
            }
            call.resolve()
        }
    }
}
