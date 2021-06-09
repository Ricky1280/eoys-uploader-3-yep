// console.log("jest config loaded")
module.exports = {
  setupFiles: ["dotenv/config"],
  testMatch: [
    "<rootDir>/tests/*.test.js"
  ]
}