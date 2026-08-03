// React Native has no Node "crypto" module. bcryptjs tries `require("crypto")`
// first (wrapped in its own try/catch) before falling back to the Web Crypto
// API (polyfilled by react-native-get-random-values, see index.js). Without
// this stub, Metro can't resolve "crypto" at all, and React Native's module
// loader reports that as a fatal redbox before bcryptjs's catch ever runs.
// Resolving to this empty module lets `require("crypto")` succeed, so
// `.randomBytes` is simply undefined and bcryptjs's own catch handles it.
module.exports = {};
