'use strict';

/**
 * Module dependencies.
 */

var superagent = require('superagent-defaults')()
  , config = require('./lib/config')
  , cookies = require('./lib/cookie')
  , cookieJar = cookies.jar();

/**
 * Set request defaults required for iCloud.
 */

superagent.set({ 'Origin': config.base_url });

/**
 * Expose `Device`.
 */

module.exports = Device;

/**
 * Initialize a new `Device`.
 * @param {[String]} username
 * @param {[String]} password
 * @param {[String]} device_name
 */

function Device(apple_id, password, display_name) {
  if (!(this instanceof Device)) return new Device(apple_id, password, display_name);
  this.apple_id = apple_id;
  this.password = password;
  this.display_name = display_name;
  this.devices = [];
  this.authenticated = false;
}

/**
 * Authenticate to iCloud.
 */

Device.prototype.authenticate = function(cb) {
  var self = this;

  superagent
    .post(config.login_path)
    .send({ 'apple_id': this.apple_id, 'password': this.password })
    .end(function(err, res) {
      if (err) {
        throw err('Authentication failure', err);
      } else {
        handleCookies(res);
        self.findMeUrl = res.body.webservices.findme.url;
        self.full_sound_path = res.body.webservices.findme.url + config.fmip_sound_path;
        self.authenticated = true;
        self.initClient(cb);
      }
    })
};

/**
 * Handles getting the device id needed to construct `playSound` url.
 * TODO: Handle refreshing of client as device location changes.
 */

Device.prototype.initClient = function(cb) {
  var self = this;
  var fullpath = this.findMeUrl + config.client_init_path;

  if (cookieJar) {
    self.cookies = cookieJar.getCookieStringSync(config.base_url);
  }

  superagent
    .post(fullpath)
    .set('cookie', self.cookies)
    .end(function(err, res) {
      if (err) {
        throw(err);
      }
      else {
        var content = res.body.content;

        addDevices(content);

        // If `device display name` was not given device ID is set to
        // first device in reponse.
        if (!self.display_name) {
          self.dsid = content[0].id;
        } else {
          var re = new RegExp(self.display_name, 'i');
          content.forEach(function(el, i) {
            if (content[i].name.match(re)) {
              self.dsid = content[i].id;
            }
          })
        }
        if (cb) cb();
      }
    })

    // Creates array of available devices from response.
    function addDevices(deviceArr) {
      deviceArr.forEach(function(el, i) {
        self.devices.push({
          name: deviceArr[i]['name'],
          deviceId: deviceArr[i]['id']
        })
      });
    }
};

/**
 * Sends request to device to play sound.
 * @param {[String]} subject
 */

Device.prototype.playSound = function(subject) {
  var self = this;
  var subject = subject || 'Find my iPhone';

  function soundAPI() {
    superagent
      .post(self.full_sound_path)
      .set('cookie', self.cookies)
      .send({ 'subject': subject, 'device': self.dsid })
      .end(function(err, res) {
        if (err)  {
          throw(err)
        } else {
          console.log('Playing iPhone alert..')
        }
      })
  }
  self.handler(soundAPI);
};

/**
 * Lists all current users devices.
 */

Device.prototype.showDevices = function(cb) {
  var self = this;
  function device() {
    cb(self.devices)
  }
  this.handler(device);
};

/**
 * Makes call based on authentication state.
 */

Device.prototype.handler = function(fn) {
  if (!this.authenticated) {
    this.authenticate(fn);
  } else {
    fn();
  }
}

/**
 * Handles cookies required for iCloud services to function
 * after authentication.
 * @param {[Object]} res
 */

var handleCookies = function(res) {
  function addCookie(cookie) {
    try {
      cookieJar.setCookieSync(cookie, config.base_url);
    } catch (err) {
      console.log(err);
    }
  }

  if (Array.isArray(res.headers['set-cookie'])) {
    res.headers['set-cookie'].forEach(addCookie);
  } else {
    addCookie(res.headers['set-cookie']);
  }
};
