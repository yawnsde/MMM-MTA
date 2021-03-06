# MMM-MTA
This an extension for the [MagicMirror](https://github.com/MichMich/MagicMirror) to show NY MTA train alerts and information
It requires a valid API KEY from the [vendor](http://datamine.mta.info/)

## Installation
Open a terminal session, navigate to your MagicMirror's `modules` folder and execute `git clone https://github.com/yawnsde/MMM-MTA.git`, a new folder called MMM-MTA will be created.

Activate the module by adding it to the config.js file as shown below.

## Using the module
````javascript
modules: [
{
  module: 'MMM-MTA',
  position: 'bottom_bar',
  config: {
    sStation: '',
    mtaAPIKey: '' //API KEY needs to be requested from datamine.mta.info
  },
}
````

## Configuration options

The following properties can be configured:

| **Option** | **Values** | **Description** |
| --- | --- | --- |
| `sStation` | **REQUIRED** | This code is used to define your starting point. Valid entries are 2 or 3 letter codes. All entries can be found in the station_list.json |
| `mtaAPIKey` | **REQUIRED** | This code needs to be requested from LIRR vendor, see above. |
| `minimumDelay` | OPTIONAL | Use this to define the minimum delay you want to check for. Default is 1 |

