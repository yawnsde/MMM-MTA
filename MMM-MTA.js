/* global Module */

/* Magic Mirror
 * Module: MMM-MTA
 *
 * By Stefan Krause http://yawns.de
 * MIT Licensed.
 */

Module.register('MMM-MTA',{

	defaults: {
		mtaAPIKey: "",
		sStation: "",
		units: config.units,
		animationSpeed: 1000,
		refreshInterval: 1000 * 60, //refresh every minute
		updateInterval: 1000 * 3600, //update every hour
		timeFormat: config.timeFormat,
		lang: config.language,
		minimumDelay: 1,

		initialLoadDelay: 0, // 0 seconds delay
		retryDelay: 2500,

		apiBase: "https://traintime.lirr.org/api/Departure",

		stationTable: null
	},

	// Define required scripts.
	getScripts: function() {
		return ["moment.js"];
	},

	// Define requird styles
	getStyles: function() {
		return ["font-awesome.css", 'MMM-MTA.css'];
	},
	
	start: function() {
		Log.info('Starting module: ' + this.name);

		this.loadStationFile((response) => {
				this.config.stationTable = JSON.parse(response);
			});

		this.loaded = false;
		this.sendSocketNotification('CONFIG', this.config);
	},

	getDom: function() {
		var wrapper = document.createElement("div");

		if (this.config.mtaAPIKey === "") {
			wrapper.innerHTML = "Please set the correct <i>API KEY</i> in the config for module: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (this.config.sStation === "") {
			wrapper.innerHTML = "Please set the <i>sStaion</i> in the config for module: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (!this.loaded) {
			wrapper.innerHTML = this.translate('LOADING');
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (this.departures.length) {
			for (var i in this.departures) {
				var cD = this.departures[i];
				var divAlert = document.createElement("div");
				divAlert.className = "small thin light";
				divAlert.innerHTML = "Train " + cD.lineLabel + " from &quot;" + cD.sStation + "&quot; to &quot;" + cD.eStation + "&quot; is running " + cD.delay + " " + ((cD.delay == 1) ? "minute" : "minutes" ) + " late";
				wrapper.appendChild(divAlert);
			}
		}

		return wrapper;	},

// ##################################################################################	
// Override getHeader method
// ##################################################################################	
	getHeader: function() {
		return this.data.header;
	},	

	/* processDepartures(data)
	 * Uses the received data to set the various values.
	 *
	 */
	processDepartures: function(data) {

		if (this.config.stationTable == null) {
			// file with station names is not yet loaded
			this.config.loaded = false;
			return;
		}

		if (!data.TRAINS) {
			// Did not receive usable new data.
			// Maybe this needs a better check?
			return;
		}

		this.departures = [];

		for (var i in data.TRAINS) {

			var t = data.TRAINS[i];

			var scheduledCalc = moment(t.SCHED, "MM-DD-YYYY HH:mm:ss");
			var actualCalc = moment(t.ETA, "MM-DD-YYYY HH:mm:ss");
			var delayMinutes = actualCalc.diff(scheduledCalc, 'minutes');

			var scheduledAMPM = ( (scheduledCalc.hour() > 12 ) ? 'PM' : 'AM'  );
			var actualAMPM = ( (actualCalc.hour() > 12 ) ? 'PM' : 'AM'  );
			var direction = ( (actualAMPM == 'AM') ? 'W' : 'E' );
			var sStation = ( (actualAMPM == 'AM') ? this.config.stationTable[this.config.sStation] : this.config.stationTable[t.DEST] );
			var eStation = ( (actualAMPM == 'AM') ? this.config.stationTable[t.DEST] : this.config.stationTable[this.config.sStation] );


			// add trains with defined delay only, all others are left out
			if (delayMinutes >= this.config.minimumDelay && t.DIR == direction) {

				this.departures.push({
					time: t.SCHED,
					eta: t.ETA,
					delay: delayMinutes,
					lineLabel: t.TRAIN_ID,
					destination: t.DEST,
					scheduledAMPM: scheduledAMPM,
					actualAMPM: actualAMPM,
					sStation: sStation,
					eStation: eStation,
					direction: t.DIR
				});
			}
		}

		this.loaded = true;
		this.updateDom(this.config.animationSpeed);
	},

 	socketNotificationReceived: function(notification, payload) {
    		if (notification === "STARTED") {
				this.updateDom();
			}
			else if (notification === "DATA") {
				this.loaded = true;
				this.processDepartures(JSON.parse(payload));
				this.updateDom();
    		}
	},

	hours12: function(date) {
  		return (date.getHours() + 24) % 12 || 12;
	},

	loadStationFile: function(callback) {
		var xobj = new XMLHttpRequest();
		xobj.overrideMimeType("application/json");
		xobj.open("GET", this.file("station_list.json"), true);
		xobj.onreadystatechange = function () {
			if (xobj.readyState == 4 && xobj.status == "200") {
				callback(xobj.responseText);
			}
		};
		xobj.send(null);
	},	

});
