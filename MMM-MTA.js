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
		units: config.units,
		animationSpeed: 1000,
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
		return ["font-awesome.css"];
	},

	start: function() {
		Log.info('Starting module: ' + this.name);
		this.loaded = false;
		this.scheduleUpdate(this.config.initialLoadDelay);

		this.updateTimer = null;

		var self = this;
		setInterval(function() {
			self.updateDom();
		}, this.config.animationSpeed);

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

		if (!this.tides.length) {
			wrapper.innerHTML = "No data";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		var currentDate = this.tides[0].date;

		var table = document.createElement("table");
		table.className = "small";

		var row = document.createElement("tr");
		table.appendChild(row);
		var dayHeader = document.createElement("th");
		dayHeader.className = "day";
		dayHeader.innerHTML = "&nbsp;";
		row.appendChild(dayHeader);

		for (var f = 0; f < 4; f++)
		{
			var tideSymbol =  document.createElement("span");
			tideSymbol.className = ( (this.tides[f].type == "Low") ? this.config.lowtideSymbol : this.config.hightideSymbol );
			var extremeHeader = document.createElement("th");
			extremeHeader.className = "thin light";
			extremeHeader.setAttribute("style", "text-align: center");
			extremeHeader.appendChild(tideSymbol);
			row.appendChild(extremeHeader);
		}

		var row = document.createElement("tr");
		table.appendChild(row);
		var dayCell = document.createElement("td");
		dayCell.className = "day";
		dayCell.innerHTML = this.tides[0].day;
		row.appendChild(dayCell);


		for (var i in this.tides) {

			var currentTide = this.tides[i];

			if (currentDate != currentTide.date) {
				var row = document.createElement("tr");
				table.appendChild(row);
				currentDate = currentTide.date;

				var dayCell = document.createElement("td");
				dayCell.className = "day";
				dayCell.innerHTML = currentTide.day;
				row.appendChild(dayCell);

			}

			var tideExtremeCell = document.createElement("td");
			tideExtremeCell.style.paddingLeft = "10px";
			tideExtremeCell.innerHTML = currentTide.time;

			if ( moment().unix() > currentTide.dt ) {
				tideExtremeCell.className = "dimmed light small";
			}
			row.appendChild(tideExtremeCell);
		}
		wrapper.appendChild(table);

		return wrapper;
	},

	/* updateTrains
	 * Requests new data
	 * Calls processTrains on succesfull response.
	 */
	updateTrains: function() {
		var url = this.config.apiBase + this.getParams();
		var self = this;
		var retry = true;

		var myRequest = new XMLHttpRequest();
		myRequest.open("GET", url, true);
		myRequest.onreadystatechange = function() {
			if (this.readyState === 4) {
				if (this.status === 200) {
					self.processTides(JSON.parse(this.response));
				} else if (this.status === 400) {
					self.config.mtaAPIKey = "";
					self.updateDom(self.config.animationSpeed);

					Log.error(self.name + ": Incorrect API KEY.");
					retry = false;
				} else {
					Log.error(self.name + ": Could not load data.");
				}

				if (retry) {
					self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
				}
			}
		};
		myRequest.send();
	},

	/* getParams
	 * Generates an url with api parameters based on the config.
	 *
	 * return String - URL params.
	 */
	getParams: function() {
		var params = "?loc=" + this.config.sStation;
		params += "&api_key=" + this.config.mtaAPIKey;

		return params;
	},

	/* processTrains(data)
	 * Uses the received data to set the various values.
	 *
	 */
	processTrains: function(data) {

		if (!data.TRAINS) {
			// Did not receive usable new data.
			// Maybe this needs a better check?
			return;
		}

		this.trains = [];

		for (var i in data.TRAINS) {
			var t = data.TRAINS[i];
			this.trains.push({

				schedule: t.SCHED,
				delay: "1", // to be continued
				date: moment(t.dt, "X").format("YYYY-MM-DD"),
				day: moment(t.dt, "X").format("ddd"),
				time: ((this.config.timeFormat === 24) ? moment(t.dt, "X").format("HH:mm") : moment(t.dt, "X").format("hh:mm a")),
				type: t.type
			});
		}

		this.loaded = true;
		this.updateDom(this.config.animationSpeed);
	},

	/* scheduleUpdate()
	 * Schedule next update.
	 *
	 * argument delay number - Milliseconds before next update. If empty, this.config.updateInterval is used.
	 */
	scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}

		var self = this;
		setTimeout(function() {
			self.updateTrains();
		}, nextLoad);
	},

});
