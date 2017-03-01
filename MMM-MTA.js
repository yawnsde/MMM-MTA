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
		minimumDelay: 0,

		initialLoadDelay: 0, // 0 seconds delay
		retryDelay: 2500,

		apiBase: "https://traintime.lirr.org/api/Departure",

		showCustomHeader: true,

		stationTable: {
			"LIC": "Long Island City",
			"HPA": "Hunterspoint Avenue",
			"NYK": "Penn Station",
			"WDD": "Woodside",
			"FHL": "Forest Hills",
			"KGN": "Kew Gardens",
			"ATL": "Atlantic Terminal",
			"NAV": "Nostrand Avenue",
			"ENY": "East New York",
			"JAM": "Jamaica",
			"SSM": "Mets-Willets Point",
			"FLS": "Flushing-Main Street",
			"MHL": "Murray Hill",
			"BDY": "Broadway",
			"ADL": "Auburndale",
			"BSD": "Bayside",
			"DGL": "Douglaston",
			"LNK": "Little Neck",
			"GNK": "Great Neck",
			"MHT": "Manhasset",
			"PDM": "Plandome",
			"PWS": "Port Washington",
			"HOL": "Hollis",
			"QVG": "Queens Village",
			"BRT": "Belmont Park",
			"BRS": "Bellerose",
			"FPK": "Floral Park",
			"SMR": "Stewart Manor",
			"NBD": "Nassau Boulevard",
			"GCY": "Garden City",
			"CLP": "Country Life Press",
			"HEM": "Hempstead",
			"NHP": "New Hyde Park",
			"MAV": "Merillon Avenue",
			"MIN": "Mineola",
			"EWN": "East Williston",
			"ABT": "Albertson",
			"RSN": "Roslyn",
			"GVL": "Greenvale",
			"GHD": "Glen Head",
			"SCF": "Sea Cliff",
			"GST": "Glen Street",
			"GCV": "Glen Cove",
			"LVL": "Locust Valley",
			"OBY": "Oyster Bay",
			"CPL": "Carle Place",
			"WBY": "Westbury",
			"HVL": "Hicksville",
			"SYT": "Syosset",
			"CSH": "Cold Spring Harbor",
			"HUN": "Huntington",
			"GWN": "Greenlawn",
			"NPT": "Northport",
			"KPK": "Kings Park",
			"STN": "Smithtown",
			"SJM": "St. James",
			"BK": "Stony Brook",
			"PJN": "Port Jefferson",
			"BPG": "Bethpage",
			"FMD": "Farmingdale",
			"PLN": "Pinelawn",
			"WYD": "Wyandanch",
			"DPK": "Deer Park",
			"BWD": "Brentwood",
			"CI": "Central Islip",
			"RON": "Ronkonkoma",
			"MFD": "Medford",
			"YPK": "Yaphank",
			"RHD": "Riverhead",
			"MAK": "Mattituck",
			"SHD": "Southold",
			"GPT": "Greenport",
			"SAB": "St. Albans",
			"LMR": "Locust Manor",
			"LTN": "Laurelton",
			"ROS": "Rosedale",
			"VSM": "Valley Stream",
			"WWD": "Westwood",
			"MVN": "Malverne",
			"LVW": "Lakeview",
			"HGN": "Hempstead Gardens",
			"WHD": "West Hempstead",
			"GBN": "Gibson",
			"HWT": "Hewlett",
			"WMR": "Woodmere",
			"CHT": "Cedarhurst",
			"LCE": "Lawrence",
			"IWD": "Inwood",
			"FRY": "Far Rockaway",
			"LYN": "Lynbrook",
			"CAV": "Centre Avenue",
			"ERY": "East Rockaway",
			"ODE": "Oceanside",
			"IPK": "Island Park",
			"LBH": "Long Beach",
			"RVC": "Rockville Centre",
			"BWN": "Baldwin",
			"FPT": "Freeport",
			"MRK": "Merrick",
			"BMR": "Bellmore",
			"WGH": "Wantagh",
			"SFD": "Seaford",
			"MQA": "Massapequa",
			"MPK": "Massapequa Park",
			"AVL": "Amityville",
			"CPG": "Copiague",
			"LHT": "Lindenhurst",
			"BTA": "Babylon",
			"BSR": "Bay Shore",
			"ISP": "Islip",
			"GRV": "Great River",
			"ODL": "Oakdale",
			"SVL": "Sayville",
			"PD": "Patchogue",
			"BPT": "Bellport",
			"MSY": "Mastic-Shirley",
			"SPK": "Speonk",
			"WHN": "Westhampton",
			"HBY": "Hampton Bays",
			"SHN": "Southampton",
			"BHN": "Bridgehampton",
			"EHN": "East Hampton",
			"AGT": "Amagansett",
			"MTK": "Montauk",
			"HAR": "HAROLD Interlocking",
			"BOL": "Boland's Landing",
			"HIL": "Hillside Facility"
		},
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
		if (this.config.showCustomHeader) {
			return this.data.header + " (" + this.config.stationTable[this.config.sStation] + ")";
		}

		return this.data.header;
	},	

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

			var scheduledCalc = moment(t.SCHED, "MM-DD-YYYY HH:mm:ss");
			var actualCalc = moment(t.ETA, "MM-DD-YYYY HH:mm:ss");
			var delayMinutes = actualCalc.diff(scheduledCalc, 'minutes');

			var scheduledAMPM = ( (scheduledCalc.hour() > 12 ) ? 'PM' : 'AM'  );
			var actualAMPM = 'PM'; //( (actualCalc.hour() > 12 ) ? 'PM' : 'AM'  );
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
	}

});
