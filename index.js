'use strict';

var superagent    = require('superagent-defaults')()
  , config        = require('./lib/config')
  , cookies       = require('./lib/cookie')
  , cookieJar     = cookies.jar();

superagent.set({
  'Origin': config.base_url
});

module.exports = Device;

function Device(apple_id, password, display_name) {
  if (!(this instanceof Device)) return new Device(apple_id, password, display_name);
  this.apple_id = apple_id;
  this.password = password;
  this.display_name = display_name;
  this.devices = [];
  this.authenticate();
}

Device.prototype.authenticate = function() {
  var self = this;

  superagent
    .post(config.login_path)
    .send({
      'apple_id': this.apple_id,
      'password': this.password
    })
    .end(function(err, res) {
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
  this.cookies = cookieJar.getCookieStringSync(config.base_url);

  superagent
    .post(self.findMeUrl + config.client_init_path)
    .set('cookie', self.cookies)
    .end(function(err, res) {
      if (err) {
        console.log(err)
      }
      else {
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

  superagent
    .post(self.findMeUrl + config.fmip_sound_path)
    .set('cookie', self.cookies)
    .send({
      'subject': subject,
      'device': this.dsid
    })
    .end(function(err, res) {
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
