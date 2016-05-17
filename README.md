# node-icloud

A node iCloud module.

## API

### playSound()

Play sound on iPhone.

### showDevices(callback)

Show all devices associated with the current iCloud account.

## Usage

``` js

var iCloud = require("node-cloud");
var device = iCloud("foobar@icloud.com", "password", "Brian's iPhone");

device.playSound();

device.showDevices(function(devices) {
  console.log(devices);
  // [{ name: "Brian’s MacBook Pro", deviceId: "foobar123xyz" },
  //  { name: "Brian's iPhone": deviceId: "foobaz123xyz" }]
});

```
