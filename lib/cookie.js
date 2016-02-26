var tough = require('tough-cookie')
var CookieJar = tough.CookieJar

module.exports.jar = function () {
  return new CookieJar()
}
