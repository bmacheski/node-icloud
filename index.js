'use strict';

/**
 * Module dependencies.
 */

var superagent    = require('superagent-defaults')()
  , config        = require('./lib/config')
  , cookies       = require('./lib/cookie')
  , cookieJar     = cookies.jar();

/**
 * Set request defaults required for iCloud.
 */

superagent.set({
  'Origin': config.base_url
});

/**
 * Expose `Device`.
 */

module.exports = Device;

/**
 * Initialize a new `Device`.
 * @param {[String]} username [iCloud username]
 * @param {[String]} password [iCloud password]
 * @param {[String]} device [iCloud device name]
 */

function Device(apple_id, password, device) {

  if (!(this instanceof Device)) return new Device(apple_id, password);
  this.apple_id = apple_id;
  this.password = password;
  this.device_name = device;
  this.devices = [];
  this.authenticate();
}

/**
 * Authenticate to iCloud.
 */

Device.prototype.authenticate = function() {
  var self = this;

  superagent
    .post(config.login_path)
    .send({
      'apple_id': this.apple_id,
      'password': this.password
    })
    .end(function(err, res, body) {
        if (err) {
          console.log("Authentication failure. " + err)
      } else {
          handleCookies(res);
          self.findMeUrl = res.body.webservices.findme.url;
          self.initClient();
        }
    })
}

/**
 * Handles getting the device id needed to construct `playSound` url.
 * TODO: Handle refreshing of client as device location changes.
 */

Device.prototype.initClient = function() {
  var self = this;
  var fullpath = this.findMeUrl + config.client_init_path;

  if (cookieJar) {
      self.cookies = cookieJar.getCookieStringSync(config.base_url);
  }

  superagent
    .post(fullpath)
    .set('cookie', self.cookies)
    .end(function(err, res, body) {
      if (err) {
        console.log(err)
      }
      else {
        addDevices(res.body.content)
        // Sets current device to first device in response.
        self.dsid = res.body.content[0].id;
      }
    })

    // Creates array of available devices from response
    function addDevices(deviceArr) {
      deviceArr.forEach(function(el, i) {
        self.devices.push({
          name: deviceArr[i]['name'],
          deviceId: deviceArr[i]['id']
        })
      })
    }
}

/**
 * Sends request to device to play sound.
 * @param {[String]} subject [sound message subject]
 */

Device.prototype.playSound = function(subject) {
  var self = this;

  var full_sound_path = this.findMeUrl + config.fmip_sound_path;
  var subject = subject || 'Find my iPhone';

  superagent
    .post(full_sound_path)
    .set('cookie', self.cookies)
    .send({
      'subject': subject,
      'device': this.dsid
    })
    .end(function(err, res) {
      if (err) {
        console.log(err)
      } else {
        console.log('Playing iPhone Alert..')
      }
    })
}

/**
 * Lists all current users devices.
 */

Device.prototype.showDevices = function() {
  console.log(this.devices);
}

/**
 * Handles cookies required for iCloud services to function
 * after authentication.
 * @param {[Object]} response [response res]
 */

var handleCookies = function(res) {

  function addCookie(cookie) {
    try {
      cookieJar.setCookieSync(cookie, config.base_url)
    } catch (err) {
      console.log(err)
    }
  }

  if (Array.isArray(res.headers['set-cookie'])) {
    res.headers['set-cookie'].forEach(addCookie)
  } else {
    addCookie(res.headers['set-cookie'])
  }
}
