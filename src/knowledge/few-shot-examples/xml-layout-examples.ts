/**
 * XML Layout Inflation Error Few-Shot Examples
 * Examples for Android XML layout errors
 */

import { FewShotExample } from '../FewShotExampleService';

export const XML_LAYOUT_EXAMPLES: FewShotExample[] = [
  {
    id: 'xml_unknown_attribute',
    errorType: 'XML_LAYOUT',
    error: `android.view.InflateException: Binary XML file line #12: Error inflating class TextView
Caused by: org.xmlpull.v1.XmlPullParserException: Binary XML file line #12: invalid attribute name: android:textFontWeight
    at com.example.app.MainActivity.onCreate(MainActivity.kt:25)`,
    diagnosis: {
      problem: 'Using invalid or unsupported XML attribute android:textFontWeight in TextView',
      rootCause: 'The attribute android:textFontWeight does not exist in Android SDK. The correct attribute is android:textStyle for bold/italic, or use a custom font family with variable weights. Error at activity_main.xml line 12',
      evidence: 'XmlPullParserException explicitly states "invalid attribute name: android:textFontWeight"',
      confidence: 0.95
    },
    solution: {
      summary: 'Remove invalid android:textFontWeight attribute and use correct font styling approach',
      specificFix: `File: app/src/main/res/layout/activity_main.xml at line 12

Option 1 - Use android:textStyle (for bold/italic):
Before:
\`\`\`xml
<TextView
    android:id="@+id/titleText"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    android:text="@string/title"
    android:textFontWeight="600"
    android:textSize="24sp" />
\`\`\`

After:
\`\`\`xml
<TextView
    android:id="@+id/titleText"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    android:text="@string/title"
    android:textStyle="bold"
    android:textSize="24sp" />
\`\`\`

Option 2 - Use custom font with specific weight:
\`\`\`xml
<TextView
    android:id="@+id/titleText"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    android:text="@string/title"
    android:fontFamily="@font/roboto_medium"
    android:textSize="24sp" />
\`\`\`

And add font file in res/font/roboto_medium.ttf

Option 3 - Use font family XML with weights (API 26+):
Create res/font/custom_font_family.xml:
\`\`\`xml
<?xml version="1.0" encoding="utf-8"?>
<font-family xmlns:android="http://schemas.android.com/apk/res/android">
    <font
        android:fontStyle="normal"
        android:fontWeight="400"
        android:font="@font/roboto_regular" />
    <font
        android:fontStyle="normal"
        android:fontWeight="600"
        android:font="@font/roboto_semibold" />
</font-family>
\`\`\`

Then use in TextView:
\`\`\`xml
<TextView
    android:fontFamily="@font/custom_font_family"
    android:textFontWeight="600"
    ... />
\`\`\``,
      fileIdentification: 'app/src/main/res/layout/activity_main.xml:12',
      codeExamples: [
        {
          before: `<TextView
    android:textFontWeight="600"
    android:textSize="24sp" />`,
          after: `<TextView
    android:textStyle="bold"
    android:textSize="24sp" />`
        }
      ],
      verificationSteps: [
        'Remove android:textFontWeight attribute',
        'Use android:textStyle="bold" for simple bold text',
        'Or use android:fontFamily with custom font for specific weights',
        'Clean and rebuild project',
        'Run app and verify layout inflates correctly'
      ]
    }
  },

  {
    id: 'xml_resource_not_found',
    errorType: 'XML_LAYOUT',
    error: `android.view.InflateException: Binary XML file line #8: Error inflating class ImageView
Caused by: android.content.res.Resources$NotFoundException: Drawable ic_profile with resource ID #0x7f070045
    at com.example.app.ProfileActivity.onCreate(ProfileActivity.kt:18)`,
    diagnosis: {
      problem: 'Referenced drawable resource ic_profile does not exist or cannot be found',
      rootCause: 'The layout XML at line 8 references @drawable/ic_profile but this file is missing from res/drawable folder, or there is a resource naming mismatch',
      evidence: 'Resources$NotFoundException for drawable with specific resource ID indicates missing or misnamed drawable file',
      confidence: 0.93
    },
    solution: {
      summary: 'Add missing drawable resource or fix resource reference',
      specificFix: `File: app/src/main/res/layout/activity_profile.xml at line 8

Step 1 - Check if drawable exists:
Look for these files:
- res/drawable/ic_profile.xml (vector drawable)
- res/drawable/ic_profile.png (bitmap)
- res/drawable-hdpi/ic_profile.png
- res/drawable-xxhdpi/ic_profile.png

Step 2 - If missing, add the drawable:
Option A - Add vector drawable (recommended):
Create res/drawable/ic_profile.xml:
\`\`\`xml
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FF000000"
        android:pathData="M12,12c2.21,0 4,-1.79 4,-4s-1.79,-4 -4,-4 -4,1.79 -4,4 1.79,4 4,4zM12,14c-2.67,0 -8,1.34 -8,4v2h16v-2c0,-2.66 -5.33,-4 -8,-4z"/>
</vector>
\`\`\`

Option B - Fix incorrect reference:
Before (line 8):
\`\`\`xml
<ImageView
    android:id="@+id/profileImage"
    android:layout_width="48dp"
    android:layout_height="48dp"
    android:src="@drawable/ic_profile"
    android:contentDescription="@string/profile_image" />
\`\`\`

If file is actually named ic_user_profile:
After:
\`\`\`xml
<ImageView
    android:id="@+id/profileImage"
    android:layout_width="48dp"
    android:layout_height="48dp"
    android:src="@drawable/ic_user_profile"
    android:contentDescription="@string/profile_image" />
\`\`\`

Option C - Use placeholder until asset is ready:
\`\`\`xml
<ImageView
    android:id="@+id/profileImage"
    android:layout_width="48dp"
    android:layout_height="48dp"
    android:src="@android:drawable/ic_menu_gallery"
    android:contentDescription="@string/profile_image" />
\`\`\``,
      fileIdentification: 'app/src/main/res/layout/activity_profile.xml:8',
      codeExamples: [
        {
          before: `<ImageView
    android:src="@drawable/ic_profile" />`,
          after: `<ImageView
    android:src="@drawable/ic_user_profile" />`
        }
      ],
      verificationSteps: [
        'Check res/drawable folders for the referenced file',
        'Add missing drawable file or fix reference name',
        'Ensure file name matches exactly (case-sensitive)',
        'Clean and rebuild project (Build > Clean Project)',
        'Verify resource appears in R.drawable class',
        'Run app and confirm layout inflates without errors'
      ]
    }
  }
];
