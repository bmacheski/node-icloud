var tough = require('tough-cookie')
  , CookieJar = tough.CookieJar;

module.exports.jar = function() {
  return new CookieJar();
};
