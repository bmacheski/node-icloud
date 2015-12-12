'use strict';

var superagent    = require('superagent-defaults')()
  , config        = require('./lib/config')
  , cookies       = require('./lib/cookie')
  , cookieJar     = cookies.jar();

superagent.set('Origin', config.base_url);

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
  }
}

var updateDefaults = function() {
  var cookies = cookieJar.getCookieStringSync(config.base_url);
  superagent.set('cookie', cookies)
}

var superagentPost = function(path, data, cb) {
  superagent
    .post(path)
    .send(data)
    .end(cb)
}

function Device(apple_id, password, display_name) {
  if (!(this instanceof Device)) return new Device(apple_id, password, display_name);
  this.userData = { 'apple_id': apple_id, 'password': password };
  this.display_name = display_name;
  this.devices = [];
  this.authenticate();
}

Device.prototype.authenticate = function() {
  var self = this;

  superagentPost(config.login_path, self.userData,
    function(err, res) {
      if (err) {
          console.log('Authentication failure. ' + err);
      } else {
          handleCookies(res);
          self.findMeUrl = res.body.webservices.findme.url;
          self.initClient();
        }
    })
}

Device.prototype.initClient = function() {
  var self = this;

  updateDefaults();

  superagent
    .post(self.findMeUrl + config.client_init_path)
    .end(function(err, res) {
      if (err) {
        console.log('Authentication failure. ' + err);
      } else {
        var content = res.body.content;
        addDevices(content);

        // If a `device display name` was not given device ID
        // is set to first device in reponse.
        if (!self.display_name) {
          self.dsid = content[0].id;

        } else {
          var re = new RegExp(self.display_name, 'i');
          content.forEach(function(e, i) {
            if (content[i].name.match(re)) {
              self.dsid = content[i].id;
            }
          })
        }
      }
    })

    // Creates array of available devices from response.
    function addDevices(deviceArr) {
      deviceArr.forEach(function(e, i) {
        self.devices.push({
          name: deviceArr[i]['name'],
          deviceId: deviceArr[i]['id']
        })
      })
    }
}

Device.prototype.playSound = function(subject) {
  var self = this;
  var subject = subject || 'Find my iPhone';

  superagentPost(self.findMeUrl + config.fmip_sound_path, self.userData,
    function(err, res) {
      if (err) {
        console.log(err)
      } else {
        console.log('Playing iPhone alert..')
      }
    })
}

Device.prototype.showDevices = function() {
  return this.devices;
}

module.exports = Device;
