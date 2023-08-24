var express = require('express');
var router = express.Router();
var apiController = require('../controllers/apiController')
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('API ROUTER');
});

router.post('/login/phizio', apiController.login_phizio);
router.post('/get/phizio/package/type', apiController.get_phizio_package_type);
router.post('/update/phizio/package/type', apiController.update_phizio_package_type);
router.post('/phizio/update/patientStatus', apiController.phizio_update_patientStatus);
router.post('/phizio/updatepatientdetails', apiController.phizio_updatepatientdetails);
router.post('/phizio/addpatient', apiController.phizio_addpatient);
router.post('/phizio/deletepatient', apiController.phizio_deletepatient);
router.post('/forgot/password', apiController.forgot_password);
router.post('/phizioprofile/update/password', apiController.phizioprofile_update_password);
router.post('/confirm/email', apiController.confirm_email);
router.post('/signup/phizio', apiController.signup_phizio);
router.post('/phizio/update/patientProfilePic', apiController.phizio_update_patientProfilePic);
router.post('/phizioprofile/update', apiController.phizioprofile_update);
router.post('/phizio/profilepic/upload', apiController.phizio_profilepic_upload);
router.post('/phizio/cliniclogo/upload', apiController.clinic_logo_upload);
router.post('/patient/generate/report', apiController.patient_generate_report);
router.post('/patient/entireEmgData', apiController.patient_entireEmgData);
router.post('/phizio/patient/deletepatient/sesssion', apiController.phizio_patient_deletepatient_sesssion);
router.post('/phizio/patient/updateMmtGrade', apiController.phizio_patient_updateMmtGrade);
router.post('/phizio/patient/updateCommentSection', apiController.phizio_patient_updateCommentSection);
router.post('/sync/data', apiController.sync_data_on_server);
router.post('/firmware/log', apiController.firmware_error_log);
router.post('/firmware/update/check', apiController.firmware_update_check_and_send);
router.post('/update/phizio/type', apiController.update_phizio_type);
router.post('/phizio/device/mobileToken',apiController.saveMobileToken);
router.post('/sceduled/session/not/saved',apiController.sceduledSessionNotSaved);
router.post('/getheldon',apiController.getheldon);
router.post('/getsessiondetails',apiController.getsessiondetails);
router.post('/getoveralletails',apiController.getoveralldetails);
router.post('/patient/generate/report_v2', apiController.patient_generate_report_v2);
router.post('/patient/generate/report_testing', apiController.patient_generate_report_testing);
router.post('/patient/generate/report_history', apiController.patient_report_history);
router.post('/patient/generate/report_today', apiController.patient_generate_report_today);
router.post('/patient/generate/report_today_arr', apiController.patient_generate_report_today_arry);
router.post('/patient/generate/report_month', apiController.patient_generate_report_month);
router.post('/getsession_report_count',apiController.getsession_report_count);
router.post('/getsession_report_count_month',apiController.getsession_report_count_month);
router.post('/view_report_Summary',apiController.view_report_Summary);
router.post('/print_value',apiController.print_value);


router.post('/phizioprofile/update/app_version', apiController.phizioprofile_update_app_version);
router.post('/getsession_number_count',apiController.getsession_number_count);
router.post('/phizio/phizio_report_download_count', apiController.phizio_report_download_count);
router.post('/get/phizio/patientlimit', apiController.get_phizio_patient_limit);
router.post('/update/phizio/patientlimit', apiController.update_phizio_patient_limit);
router.post('/generateinvoice/patient', apiController.invoice_generation);
router.post('/phizio/calbirations', apiController.phizio_cal);
router.post('/normative',apiController.phizio_normative);
router.post('/normative-referance',apiController.phizio_normative_ref);
router.post('/normative-rom',apiController.phizio_normative_rom);
router.post('/normative_referance_comp',apiController.phizio_normative_ref_comp);
router.post('/normative_data_camp',apiController.normative_data_camp);
router.post('/current_data',apiController.current_data);
router.post('/view_data_value',apiController.view_data_value);
router.post('/view_data_value_last',apiController.view_data_value_last);
router.post('/view_data_value_report',apiController.view_data_value_report);
router.post('/view_data_value_goal',apiController.view_data_value_goal);
router.post('/recommanded_assigment_effected_side',apiController.recommanded_assigment_effected_side);
router.post('/recommanded_assigment_non_effected_side',apiController.recommanded_assigment_non_effected_side);
router.post('/recommanded_assigment_bilateral',apiController.recommanded_assigment_bilateral);
router.post('/session_summary_health',apiController.session_summary_health);
router.post('/testing_last',apiController.testing_last);
router.post('/buy_printer_api',apiController.buy_printer_api);
router.post('/buy_report_api',apiController.buy_report_api);
router.post('/buy_printer_api_data',apiController.buy_printer_api_data);
router.post('/reports_sub',apiController.reports_sub);
router.post('/reports_sub_update',apiController.reports_sub_update);
router.post('/reports_sub_update_values',apiController.reports_sub_update_values);
router.post('/login_force_update',apiController.login_force_update);
router.post('/session_count_status',apiController.session_count_status);

router.post('/report_count_update',apiController.report_count_update);
router.post('/session_summary_opt',apiController.session_summary_opt);

router.post('/premium_pop',apiController.premium_pop);
router.post('/premium_pop_status_update',apiController.premium_pop_status_update);

// Sale Team Api 

router.post('/device_records',apiController.device_records);
router.post('/user_report_count',apiController.user_report_count);
router.post('/user_name_password',apiController.user_name_password);
router.post('/report_all_user',apiController.report_all_user);
router.post('/max_exeises',apiController.max_exeises);



//Device health status related apis
router.post('/insert/pheezee/device',apiController.insert_or_update_pheezee_device_details);
router.post('/insert/pheezee/health/status',apiController.insert_pheezee_health_status);
router.post('/update/device/email/used',apiController.insert_phizio_email_which_used_the_device);
router.post('/get/device/status',apiController.get_device_status);
router.post('/get/device/details/uid',apiController.get_device_details_uid);
router.post('/get/device/details/mac',apiController.get_device_details_mac);
router.post('/update/device/status',apiController.update_device_status);


//Device Location
router.post('/update/device/location',apiController.update_device_location);


//Device package id related
router.post('/create/newdevice/package', apiController.create_new_device_package);

//Not used
router.post('/phizio/getprofilepicture', apiController.phizio_getprofilepicture);
router.post('/phizio/testing/generate/sessions', apiController.phizio_testing_generate_sessions);


router.post('/delete-phiziouser', apiController.delete_phiziouser);

// router.post('/get-warranty-details', apiController.get_warranty_details);
// router.post('/get-serial-number', apiController.get_serial_number);

// router.post('/addcustomerdetails', apiController.addCustomerDetails);


module.exports = router;
