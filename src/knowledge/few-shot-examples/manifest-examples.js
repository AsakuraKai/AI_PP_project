"use strict";
/**
 * Manifest Permission Few-Shot Examples (Chunk 9 - Priority 3)
 * 10 examples for manifest permission errors
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MANIFEST_PERMISSION_EXAMPLES = void 0;
exports.MANIFEST_PERMISSION_EXAMPLES = [
    {
        id: 'manifest_camera_permission',
        errorType: 'MANIFEST_PERMISSION',
        error: `java.lang.SecurityException: Permission denial: starting Intent { act=android.media.action.IMAGE_CAPTURE } from ProcessRecord
    Requires android.permission.CAMERA`,
        diagnosis: {
            problem: 'App trying to access camera without CAMERA permission declared in AndroidManifest.xml',
            rootCause: 'Missing <uses-permission> entry for CAMERA in manifest file',
            evidence: 'SecurityException explicitly states "Requires android.permission.CAMERA"',
            confidence: 0.95
        },
        solution: {
            summary: 'Add CAMERA permission to AndroidManifest.xml and request at runtime',
            specificFix: `File: app/src/main/AndroidManifest.xml

Add inside <manifest> tag, before <application>:
    <uses-permission android:name="android.permission.CAMERA" />

Then request at runtime (API 23+) in your Activity:
if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) 
    != PackageManager.PERMISSION_GRANTED) {
    ActivityCompat.requestPermissions(this, 
        arrayOf(Manifest.permission.CAMERA), 
        CAMERA_REQUEST_CODE)
}`,
            fileIdentification: 'app/src/main/AndroidManifest.xml',
            codeExamples: [
                {
                    before: `<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.app">
    
    <application
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name">`,
                    after: `<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.app">
    
    <uses-permission android:name="android.permission.CAMERA" />
    
    <application
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name">`
                }
            ],
            verificationSteps: [
                'Sync Gradle files',
                'Re-run app',
                'Verify camera permission dialog appears',
                'Check logcat for permission grant'
            ]
        }
    },
    {
        id: 'manifest_location_permission',
        errorType: 'MANIFEST_PERMISSION',
        error: `java.lang.SecurityException: "gps" location provider requires ACCESS_FINE_LOCATION permission.`,
        diagnosis: {
            problem: 'App trying to access GPS location without location permissions',
            rootCause: 'Missing ACCESS_FINE_LOCATION (and possibly ACCESS_COARSE_LOCATION) in manifest',
            evidence: 'SecurityException states location provider requires ACCESS_FINE_LOCATION',
            confidence: 0.95
        },
        solution: {
            summary: 'Add location permissions to AndroidManifest.xml (both FINE and COARSE recommended)',
            specificFix: `File: app/src/main/AndroidManifest.xml

Add inside <manifest> tag, before <application>:
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

Then request at runtime (API 23+):
ActivityCompat.requestPermissions(this, 
    arrayOf(
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION
    ), 
    LOCATION_REQUEST_CODE)`,
            fileIdentification: 'app/src/main/AndroidManifest.xml',
            codeExamples: [],
            verificationSteps: [
                'Sync Gradle',
                'Run app',
                'Verify location permission dialog',
                'Test GPS functionality'
            ]
        }
    },
    {
        id: 'manifest_storage_permission',
        errorType: 'MANIFEST_PERMISSION',
        error: `java.lang.SecurityException: Permission Denial: reading com.android.providers.media.MediaProvider requires android.permission.READ_EXTERNAL_STORAGE`,
        diagnosis: {
            problem: 'App trying to read external storage without permission',
            rootCause: 'Missing READ_EXTERNAL_STORAGE (and WRITE if writing) in manifest',
            evidence: 'SecurityException requires READ_EXTERNAL_STORAGE for MediaProvider',
            confidence: 0.95
        },
        solution: {
            summary: 'Add storage permissions to AndroidManifest.xml (READ and WRITE if needed)',
            specificFix: `File: app/src/main/AndroidManifest.xml

Add inside <manifest> tag:
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

Note: For Android 10+ (API 29), consider using scoped storage instead.
Request at runtime for API 23+.`,
            fileIdentification: 'app/src/main/AndroidManifest.xml',
            codeExamples: [],
            verificationSteps: [
                'Sync Gradle',
                'Request permission at runtime',
                'Test file read/write operations'
            ]
        }
    },
    {
        id: 'manifest_internet_permission',
        errorType: 'MANIFEST_PERMISSION',
        error: `java.net.SocketException: socket failed: EPERM (Operation not permitted)`,
        diagnosis: {
            problem: 'App trying to access network without INTERNET permission',
            rootCause: 'Missing INTERNET permission in AndroidManifest.xml',
            evidence: 'SocketException EPERM indicates permission denial for network operations',
            confidence: 0.9
        },
        solution: {
            summary: 'Add INTERNET permission to AndroidManifest.xml (normal permission, no runtime request needed)',
            specificFix: `File: app/src/main/AndroidManifest.xml

Add inside <manifest> tag:
    <uses-permission android:name="android.permission.INTERNET" />

Note: This is a normal permission (not dangerous), so no runtime request needed.
Permission is automatically granted at install time.`,
            fileIdentification: 'app/src/main/AndroidManifest.xml',
            codeExamples: [
                {
                    before: `<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.app">
    
    <application`,
                    after: `<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.app">
    
    <uses-permission android:name="android.permission.INTERNET" />
    
    <application`
                }
            ],
            verificationSteps: [
                'Sync Gradle',
                'Rebuild and run app',
                'Test network requests',
                'No runtime permission needed'
            ]
        }
    },
    {
        id: 'manifest_phone_state_permission',
        errorType: 'MANIFEST_PERMISSION',
        error: `java.lang.SecurityException: getDeviceId: The user 10XXX does not have READ_PHONE_STATE.`,
        diagnosis: {
            problem: 'App trying to access phone state (device ID, call status) without permission',
            rootCause: 'Missing READ_PHONE_STATE permission in manifest',
            evidence: 'SecurityException explicitly requires READ_PHONE_STATE',
            confidence: 0.95
        },
        solution: {
            summary: 'Add READ_PHONE_STATE permission to manifest and request at runtime',
            specificFix: `File: app/src/main/AndroidManifest.xml

Add inside <manifest> tag:
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />

Then request at runtime (dangerous permission, API 23+):
ActivityCompat.requestPermissions(this, 
    arrayOf(Manifest.permission.READ_PHONE_STATE), 
    PHONE_STATE_REQUEST_CODE)`,
            fileIdentification: 'app/src/main/AndroidManifest.xml',
            codeExamples: [],
            verificationSteps: [
                'Add permission to manifest',
                'Request at runtime',
                'Test phone state access'
            ]
        }
    },
    {
        id: 'manifest_bluetooth_permission',
        errorType: 'MANIFEST_PERMISSION',
        error: `java.lang.SecurityException: Need BLUETOOTH permission: Neither user 10XXX nor current process has android.permission.BLUETOOTH.`,
        diagnosis: {
            problem: 'App trying to use Bluetooth without required permissions',
            rootCause: 'Missing BLUETOOTH (and possibly BLUETOOTH_ADMIN) in manifest. For Android 12+, also need BLUETOOTH_CONNECT/SCAN',
            evidence: 'SecurityException requires BLUETOOTH permission',
            confidence: 0.95
        },
        solution: {
            summary: 'Add Bluetooth permissions to manifest (version-dependent)',
            specificFix: `File: app/src/main/AndroidManifest.xml

For Android 11 and below:
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />

For Android 12+ (API 31+), also add:
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN" />

Request at runtime for API 31+:
ActivityCompat.requestPermissions(this, 
    arrayOf(
        Manifest.permission.BLUETOOTH_CONNECT,
        Manifest.permission.BLUETOOTH_SCAN
    ), 
    BLUETOOTH_REQUEST_CODE)`,
            fileIdentification: 'app/src/main/AndroidManifest.xml',
            codeExamples: [],
            verificationSteps: [
                'Add appropriate permissions for target SDK',
                'Request runtime permissions if API 31+',
                'Test Bluetooth functionality'
            ]
        }
    },
    {
        id: 'manifest_contacts_permission',
        errorType: 'MANIFEST_PERMISSION',
        error: `java.lang.SecurityException: Permission Denial: reading com.android.providers.contacts.ContactsProvider2 requires android.permission.READ_CONTACTS`,
        diagnosis: {
            problem: 'App trying to read contacts without permission',
            rootCause: 'Missing READ_CONTACTS (and WRITE_CONTACTS if modifying) in manifest',
            evidence: 'SecurityException requires READ_CONTACTS for ContactsProvider',
            confidence: 0.95
        },
        solution: {
            summary: 'Add contacts permissions to manifest and request at runtime',
            specificFix: `File: app/src/main/AndroidManifest.xml

Add inside <manifest> tag:
    <uses-permission android:name="android.permission.READ_CONTACTS" />
    <uses-permission android:name="android.permission.WRITE_CONTACTS" /> <!-- If writing -->

Request at runtime (dangerous permission):
ActivityCompat.requestPermissions(this, 
    arrayOf(Manifest.permission.READ_CONTACTS), 
    CONTACTS_REQUEST_CODE)`,
            fileIdentification: 'app/src/main/AndroidManifest.xml',
            codeExamples: [],
            verificationSteps: [
                'Add to manifest',
                'Request runtime permission',
                'Query contacts provider'
            ]
        }
    },
    {
        id: 'manifest_calendar_permission',
        errorType: 'MANIFEST_PERMISSION',
        error: `java.lang.SecurityException: Permission Denial: opening provider com.android.providers.calendar.CalendarProvider2 requires android.permission.READ_CALENDAR`,
        diagnosis: {
            problem: 'App trying to access calendar without permission',
            rootCause: 'Missing READ_CALENDAR (and WRITE_CALENDAR if modifying) in manifest',
            evidence: 'SecurityException requires READ_CALENDAR for CalendarProvider',
            confidence: 0.95
        },
        solution: {
            summary: 'Add calendar permissions to manifest and request at runtime',
            specificFix: `File: app/src/main/AndroidManifest.xml

Add inside <manifest> tag:
    <uses-permission android:name="android.permission.READ_CALENDAR" />
    <uses-permission android:name="android.permission.WRITE_CALENDAR" /> <!-- If writing -->

Request at runtime:
ActivityCompat.requestPermissions(this, 
    arrayOf(Manifest.permission.READ_CALENDAR), 
    CALENDAR_REQUEST_CODE)`,
            fileIdentification: 'app/src/main/AndroidManifest.xml',
            codeExamples: [],
            verificationSteps: [
                'Add to manifest',
                'Request runtime permission',
                'Access calendar provider'
            ]
        }
    },
    {
        id: 'manifest_microphone_permission',
        errorType: 'MANIFEST_PERMISSION',
        error: `java.lang.SecurityException: Permission Denial: starting AudioRecord from pid=XXXX, uid=XXXX requires android.permission.RECORD_AUDIO`,
        diagnosis: {
            problem: 'App trying to record audio without permission',
            rootCause: 'Missing RECORD_AUDIO permission in manifest',
            evidence: 'SecurityException requires RECORD_AUDIO for AudioRecord',
            confidence: 0.95
        },
        solution: {
            summary: 'Add RECORD_AUDIO permission to manifest and request at runtime',
            specificFix: `File: app/src/main/AndroidManifest.xml

Add inside <manifest> tag:
    <uses-permission android:name="android.permission.RECORD_AUDIO" />

Request at runtime (dangerous permission):
ActivityCompat.requestPermissions(this, 
    arrayOf(Manifest.permission.RECORD_AUDIO), 
    AUDIO_REQUEST_CODE)`,
            fileIdentification: 'app/src/main/AndroidManifest.xml',
            codeExamples: [],
            verificationSteps: [
                'Add to manifest',
                'Request runtime permission',
                'Test audio recording'
            ]
        }
    },
    {
        id: 'manifest_sms_permission',
        errorType: 'MANIFEST_PERMISSION',
        error: `java.lang.SecurityException: Sending SMS message: uid 10XXX does not have android.permission.SEND_SMS.`,
        diagnosis: {
            problem: 'App trying to send SMS without permission',
            rootCause: 'Missing SEND_SMS (and possibly READ_SMS, RECEIVE_SMS) in manifest',
            evidence: 'SecurityException requires SEND_SMS',
            confidence: 0.95
        },
        solution: {
            summary: 'Add SMS permissions to manifest and request at runtime',
            specificFix: `File: app/src/main/AndroidManifest.xml

Add inside <manifest> tag:
    <uses-permission android:name="android.permission.SEND_SMS" />
    <uses-permission android:name="android.permission.READ_SMS" /> <!-- If reading -->
    <uses-permission android:name="android.permission.RECEIVE_SMS" /> <!-- If receiving -->

Request at runtime (dangerous permissions):
ActivityCompat.requestPermissions(this, 
    arrayOf(Manifest.permission.SEND_SMS), 
    SMS_REQUEST_CODE)`,
            fileIdentification: 'app/src/main/AndroidManifest.xml',
            codeExamples: [],
            verificationSteps: [
                'Add to manifest',
                'Request runtime permissions',
                'Test SMS functionality'
            ]
        }
    }
];
//# sourceMappingURL=manifest-examples.js.map