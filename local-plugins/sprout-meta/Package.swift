// swift-tools-version: 5.9
import PackageDescription

// Local Capacitor plugin — wraps the official Facebook iOS SDK (SPM) so Meta can
// attribute App Store install campaigns. Kept in-repo rather than using a
// third-party plugin so we control the SDK lifecycle (nothing initialises before
// the ATT decision) and so numeric event values aren't dropped.
let package = Package(
    name: "SproutMeta",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "SproutMeta",
            targets: ["SproutMetaPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.4.1"),
        .package(url: "https://github.com/facebook/facebook-ios-sdk.git", from: "17.0.0")
    ],
    targets: [
        .target(
            name: "SproutMetaPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "FacebookCore", package: "facebook-ios-sdk")
            ],
            path: "ios/Sources/SproutMetaPlugin")
    ]
)
