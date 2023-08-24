//DB NAMES
const phiziousersCollection = "phiziousers";
const patientSessionDataCollection = "patientSessionData";
const deviceHealthDataCollection = "deviceHealthData";
const deviceLocaationDataCollection = "deviceLocaationData";
const devicePackageDataCollection = "devicePackageData";
const ReportDataCollection = "ReportData";
const DeviceDataCollection = "DeviceData";
const CalbrationDataCollection = "Calb";
//DB MODELS
const PhizioUserModel = {
    phizioname:String,
    phiziopassword:String,
	app_version:String,
    phizioemail:String,
    phiziophone:String,
    phizioprofilepicurl:String,
    clinicname:String,
    cliniclogo:String,
    phiziodob:String,
    experience:String,
    specialization:String,
    degree:String,
    gender:String,
    address:String,
    type:Number,
    packagetype:Number,
    packageid:String,
	patientlimit:Number,
    //list of patients phiziotherapist has,
    phiziopatients : [
            {
                patientid:String,
                patientname:String,
                numofsessions:String,
                dateofjoin:String,
		        heldon:String,
                patientage:String,
                patientgender:String,
                patientcasedes:String,
                status:String,
                patientphone:String,
                patientemail:String,
                patientcondition:String,
                patienthistory:String,
                patientinjured:String,
                patientprofilepicurl:String
            }
    ]
};


const PatientSessionDataModel = {
    phizioemail:String,
    patientid:String,
    sessiondetails:[{
        heldon:String, //{type: String, trim: true, index: false, unique: false, sparse: false},
        maxangle:String,
        minangle:String,
        maxemg:String,
        sessiontime:String,
        numofreps:String,
        anglecorrected:String,
        holdtime:String,
		holdangle:String,
		velocity:String, 
		avgmaxemg:String, 
		consistency:String, 
		smoothness:String, 
		controlled:String, 
		rom_avg_max:String, 
		rom_avg_min:String,
        activetime:String,
        mmtgrade:String,
        painstatus:String,
        patientstatus:String,
        bodypart:String,
        painscale:String,
        muscletone:String,
        exercisename:String,
        commentsession:String,
        therapistname:String,
        symptoms:String,
        orientation:String,        
        repsselected:Number,
        musclename:String,
        bodyorientation:String,
        sessiontype:String,
        minangleselected:String,
        maxangleselected:String,
        maxemgselected:String,
        sessioncolor:Number,
        emgdata:String,
        romdata:String,
		activity_list:[{
			engagement:Number,
			timestamp:String
		}]
    }
    ]
};


const DeviceStatusModel = {
    uid:String,
    mac:String,
    firmware_version:String,
    hardware_version:String,
    serial_version:String,
    atiny_version:String,
    status:Boolean,
    packageid:String,
    health:[{
        time_stamp:String,
        health_info:{u_lsm_ini:Number,l_lsm_ini:Number,gain_amplifier:Number,atiny_init_status:Number,adc_status:Number,
        u_lsm_regi:Number,l_lsm_regi:Number,device_state:Number,usb_state:Number,gain_amplifier_write_status:Number,
        ble_status:Number,charger_staus:Number,pow_btn_status:Number,main_ldo_status:Number,over_current_protection_status:Number,
        u_lesm_read:Number,l_lsm_read:Number,atiny_read_status:Number,u_mag_ini:Number,l_mag_ini:Number,u_mag_read:Number,l_mag_read:Number}
    }],
    phizioemails:[{
        time_stamp:String,
        phizioemail:String
    }]
};


const DeviceLocationModel = {
    uid:String,
    time_stamp:String,
    latitude:Number,
    longitude:Number
};



const DevicePackageModel = {
	packageid: String,
	packagetype: Number
};


const ReportDataModel = {
    phizioemail:String,
    patientid:String,
    sessiondetails:[{
        heldon:String, 
        date:String
    }
    ],
    overalldetails:[{
        bodypart:String, 
        date:String,
		download_status:Boolean
    }
    ]
};

const DeviceStatus = {
    macId: String,
    uuId: String,
    model: String,
    lot: String,
    status: String,
    devicemodel: String
}


const CalbirationStaus = {
    email_id:   String,
    date_stamp: String,
    time_stamp: String,
    deviceMacc: String
}


exports.ReportDataModel = ReportDataModel;
exports.ReportDataCollection = ReportDataCollection;

exports.PhizioUserModel = PhizioUserModel;
exports.PatientSessionDataModel = PatientSessionDataModel;
exports.DeviceStatusModel = DeviceStatusModel;
exports.DeviceLocationModel = DeviceLocationModel;
exports.DevicePackageModel = DevicePackageModel;
exports.phiziousersCollection = phiziousersCollection;
exports.patientSessionDataCollection = patientSessionDataCollection;
exports.deviceHealthDataCollection = deviceHealthDataCollection;
exports.deviceLocaationDataCollection = deviceLocaationDataCollection;
exports.devicePackageDataCollection = devicePackageDataCollection;


exports.deviceStatusDataCollection = DeviceDataCollection;
exports.deviceStatusDataModel = DeviceStatus;

exports.calbrattionStatusDataCollection = CalbrationDataCollection;
exports.calbrationStatusModel = CalbirationStaus;
