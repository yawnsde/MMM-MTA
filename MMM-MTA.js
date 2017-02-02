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

		initialLoadDelay: 0, // 0 seconds delay
		retryDelay: 2500,

		apiBase: "https://traintime.lirr.org/api/Departure",
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

		if (!this.departures.length) {
			wrapper.innerHTML = "No data";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		var table = document.createElement("table");
		table.id = "mtatable";
		table.className = "small thin light";
		
		var row = document.createElement("tr");

		var timeHeader = document.createElement("th");
		timeHeader.innerHTML = "Departure";
		timeHeader.className = "mtaheader";
		row.appendChild(timeHeader);
		var lineHeader = document.createElement("th");
		lineHeader.innerHTML = "Train ID";
		lineHeader.className = "mtaheader";
		lineHeader.colSpan = 2;
		row.appendChild(lineHeader);
		var destinationHeader = document.createElement("th");
		destinationHeader.innerHTML = "Destination";
		destinationHeader.className = "mtaheader";
		row.appendChild(destinationHeader);		
		table.appendChild(row);
		
		for (var i in this.departures) {
			var currentDeparture = this.departures[i];
			var row = document.createElement("tr");
			table.appendChild(row);
			
			var cellDeparture = document.createElement("td");
			cellDeparture.innerHTML = currentDeparture.time;
			cellDeparture.className = "timeinfo";
			if (currentDeparture.delay > 0) {
				var spanDelay = document.createElement("span");
				spanDelay.innerHTML = ' +' + currentDeparture.delay;
				spanDelay.className = "small delay";
				cellDeparture.appendChild(spanDelay);
			}
			row.appendChild(cellDeparture);

			var cellTransport = document.createElement("td");
			cellTransport.className = "timeinfo";
			var symbolTransportation = document.createElement("span");
			symbolTransportation.className = ""; //this.config.iconTable[currentDeparture.transportation];
			cellTransport.appendChild(symbolTransportation);
			row.appendChild(cellTransport);
			
			var cellLine = document.createElement("td");
			cellLine.innerHTML = currentDeparture.lineLabel;
			cellLine.className = "lineinfo";
			row.appendChild(cellLine);
			
			var cellDirection = document.createElement("td");
			cellDirection.innerHTML = currentDeparture.direction;
			cellDirection.className = "destinationinfo";
			row.appendChild(cellDirection);			
		}
		wrapper.appendChild(table);

		return wrapper;	},

	/* processDepartures(data)
	 * Uses the received data to set the various values.
	 *
	 */
	processDepartures: function(data) {

		if (!data.TRAINS) {
			// Did not receive usable new data.
			// Maybe this needs a better check?
			return;
		}

		this.departures = [];

		for (var i in data.TRAINS) {
			var t = data.TRAINS[i];
			this.departures.push({
				time: t.SCHED,
				eta: t.ETA,
				delay: 1, //(((t.time).indexOf('+') > 0) ? (t.time).substring(6,(t.time).length) : 0),
				lineLabel: t.TRAIN_ID,
				destination: t.DEST,
				direction: t.DIR,
			});
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
	}

});
