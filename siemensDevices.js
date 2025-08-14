const devices = {

	fill: "LCV01",
	drain: "LCV02",
	
	rh1: "NT01_SAH",
	rh2: "NT02_SAH",
	saTemp: "TT01_SAT",
	maTemp: "TT02_MAT",

	faceDamper: "ND01",
	bypassDamper: "ND02",

	whl: "LH01_HL",
	wol: "LN01_NL",
	wll: "LL01_LL",

	leak: "WS01",

	sump: "EP01",
	conductivity: "CT01",
	bleed: "CCV01",

	sf1: "SF01",
	sf2: "SF02",
	sf3: "SF03",
	sf4: "SF04",
	sf5: "SF05",
	sf6: "SF06",

	vfd: "SC01",
	vdfEnable: vfd + "_SS",
	vdfFault: vfd + "_FLT",
	vdfHOA: vfd + "_STS",
	vdfFb: vfd + "_FB",

	airflow: "FT01",

	primary: "QS01",
	secondayr: "QS02",


}

export default devices