# node-icloud

A node iCloud module.

## API

### playSound()

Play sound on iPhone.

### showDevices(callback)

Show all devices associated with the current iCloud account.

## Usage

``` js

var iCloud = require('node-cloud');
var device = new iCloud('foobar@icloud.com', 'password');

device.playSound();

device.showDevices(function(devices) {
  console.log(devices);  // => [{ name: 'Brian’s MacBook Pro', deviceId: foobar123xyz' }]
});


```
