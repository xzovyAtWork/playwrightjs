class Device{
	constructor(name, feedbackValue = "FB", commandValue ="OC"){
		this.name = name;
		this.feedbackValue = name + `_${feedbackValue}`;
		this.commandValue = name + `_${commandValue}`;
	}
}

export const devices = {
	fill: new Device("LCV01"),
	drain: new Device("LCV02"),

	rh1: new Device("NT01", "SAH"),
	rh2: new Device("NT02", "SAH"),
	saTemp: new Device("TT01", "SAT"),
	maTemp: new Device("TT02", "MAT"),
	
	faceDamper: new Device("ND01", "FB", "CMD"),
	bypassDamper: new Device("ND02", "FB", "CMD"),
	
	whl: new Device("LH01_HL"),
	wol: new Device("LN01_NL"),
	wll: new Device("LL01_LL"),
	
	leak: new Device("WS01", "WD"),
	
	sump: new Device("EP01", "STS", "SS"),
	conductivity: new Device("CT01_CON"),
	bleed: new Device("CCV01", undefined, "OC"),
	
	sf1: new Device("SF01", "STS"),
	sf2: new Device("SF02", "STS"),
	sf3: new Device("SF03", "STS"),
	sf4: new Device("SF04", "STS"),
	sf5: new Device("SF05", "STS"),
	sf6: new Device("SF06", "STS"),
	
	vfd: new Device ("SC01", "FB", "SPD"),
	vfdEnable: new Device("SC01", undefined, "SS"),
	vfdFault: new Device("SC01", "FLT"),
	vfdHOA: new Device("SC01", "STS"),
	
	airflow: new Device("FT01", "SAF"),
	
	primary: new Device("QS01", "PA"),
	secondary: new Device("QS02", "PA"),
}
