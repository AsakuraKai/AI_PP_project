/**
 * Unit Tests for XMLParser
 * 
 * Tests cover:
 * - 8 XML error types
 * - File path extraction
 * - Line number extraction
 * - Metadata extraction
 * - Edge cases (null, empty, malformed)
 * - Static helper methods
 */

import { XMLParser } from '../../src/utils/parsers/XMLParser';

describe('XMLParser', () => {
  let parser: XMLParser;

  beforeEach(() => {
    parser = new XMLParser();
  });

  describe('parse()', () => {
    describe('Inflation Errors', () => {
      it('should parse binary XML file inflation error with line number', () => {
        const errorText = `
android.view.InflateException: Binary XML file line #42: Error inflating class com.example.CustomView
    at android.view.LayoutInflater.inflate(LayoutInflater.java:539)
    at android.view.LayoutInflater.inflate(LayoutInflater.java:423)
    at com.example.MainActivity.onCreate(MainActivity.kt:28)
        `.trim();

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('xml_inflation');
        expect(result?.line).toBe(42);
        expect(result?.language).toBe('xml');
        expect(result?.framework).toBe('android');
        expect(result?.metadata?.className).toBe('com.example.CustomView');
      });

      it('should parse inflation error with file path', () => {
        const errorText = `
android.view.InflateException: Binary XML file line #15 in res/layout/activity_main.xml: 
Error inflating class androidx.constraintlayout.widget.ConstraintLayout
        `.trim();

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('xml_inflation');
        expect(result?.filePath).toBe('res/layout/activity_main.xml');
        expect(result?.line).toBe(15);
        expect(result?.metadata?.className).toBe('androidx.constraintlayout.widget.ConstraintLayout');
      });

      it('should parse inflation error without line number', () => {
        const errorText = `
android.view.InflateException: Error inflating class com.google.android.material.button.MaterialButton
in fragment_home.xml
        `.trim();

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('xml_inflation');
        expect(result?.filePath).toBe('fragment_home.xml');
        expect(result?.line).toBe(0);
        expect(result?.metadata?.className).toBe('com.google.android.material.button.MaterialButton');
      });
    });

    describe('Missing ID Errors', () => {
      it('should parse findViewById null pointer exception', () => {
        const errorText = `
java.lang.NullPointerException: Attempt to invoke virtual method 
'void android.widget.TextView.setText(CharSequence)' on a null object reference
    at com.example.MainActivity.onCreate(MainActivity.kt:23)
    at android.app.Activity.performCreate(Activity.java:7224)
Call to findViewById(R.id.textView) returned null
        `.trim();

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('xml_missing_id');
        expect(result?.filePath).toBe('MainActivity.kt');
        expect(result?.line).toBe(23);
        expect(result?.metadata?.viewClass).toBe('TextView');
      });

      it('should extract view ID from error message', () => {
        const errorText = `
java.lang.NullPointerException: findViewById(R.id.button_submit) returned null
    at com.example.HomeFragment.onViewCreated(HomeFragment.kt:45)
        `.trim();

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('xml_missing_id');
        expect(result?.metadata?.viewId).toBe('button_submit');
      });

      it('should handle missing findViewById with Button', () => {
        const errorText = `
java.lang.NullPointerException: Attempt to invoke virtual method 
'void android.widget.Button.setOnClickListener(View.OnClickListener)' on a null object reference
    at com.example.LoginActivity.setupListeners(LoginActivity.kt:67)
        `.trim();

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('xml_missing_id');
        expect(result?.metadata?.viewClass).toBe('Button');
      });
    });

    describe('Attribute Errors', () => {
      it('should parse missing required attribute error', () => {
        const errorText = `
Error parsing XML: attribute layout_width not specified
in activity_main.xml at line 15
        `.trim();

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('xml_attribute_error');
        expect(result?.filePath).toBe('activity_main.xml');
        expect(result?.line).toBe(15);
        expect(result?.metadata?.attributeName).toBe('layout_width');
      });

      it('should parse "You must supply" attribute error', () => {
        const errorText = `
You must supply a layout_height attribute
in fragment_profile.xml
        `.trim();

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('xml_attribute_error');
        expect(result?.filePath).toBe('fragment_profile.xml');
        expect(result?.metadata?.attributeName).toBe('layout_height');
      });

      it('should parse missing android namespace attribute', () => {
        const errorText = `
Error: attribute android:text missing required in TextView
in res/layout/item_list.xml at line 23
        `.trim();

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('xml_attribute_error');
        expect(result?.metadata?.attributeName).toBe('android:text');
      });
    });

    describe('Namespace Errors', () => {
      it('should parse missing xmlns declaration', () => {
        const errorText = `
Error: No resource identifier found for attribute 'layout_width' in package 'android'
Missing xmlns:android namespace declaration
in activity_settings.xml at line 8
        `.trim();

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('xml_namespace_error');
        expect(result?.filePath).toBe('activity_settings.xml');
        expect(result?.line).toBe(8);
        expect(result?.metadata?.attributeName).toBe('layout_width');
      });

      it('should parse namespace error without explicit line', () => {
        const errorText = `
No resource identifier found for attribute 'layout_height' in package 'android'
in fragment_dashboard.xml
        `.trim();

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('xml_namespace_error');
        expect(result?.filePath).toBe('fragment_dashboard.xml');
      });
    });

    describe('Tag Mismatch Errors', () => {
      it('should parse unclosed tag error', () => {
        const errorText = `
XML parsing error: The element type "LinearLayout" must be terminated 
by the matching end-tag "</LinearLayout>"
in activity_main.xml at line 28
        `.trim();

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('xml_tag_mismatch');
        expect(result?.filePath).toBe('activity_main.xml');
        expect(result?.line).toBe(28);
        expect(result?.metadata?.tagName).toBe('LinearLayout');
      });

      it('should parse "Unclosed tag" variant', () => {
        const errorText = `
Unclosed tag: RelativeLayout
in fragment_settings.xml line 42
        `.trim();

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('xml_tag_mismatch');
        expect(result?.metadata?.tagName).toBe('RelativeLayout');
        expect(result?.line).toBe(42);
      });
    });

    describe('Resource Not Found Errors', () => {
      it('should parse resource not found with hex ID', () => {
        const errorText = `
android.content.res.Resources$NotFoundException: Resource ID #0x7f080123
    at android.content.res.Resources.getValue(Resources.java:1351)
    at android.content.res.Resources.loadXmlResourceParser(Resources.java:2832)
        `.trim();

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('xml_resource_not_found');
        expect(result?.metadata?.resourceId).toBe('0x7f080123');
      });

      it('should parse resource not found with string name', () => {
        const errorText = `
android.content.res.Resources$NotFoundException: String resource @string/app_name not found
in activity_main.xml at line 12
        `.trim();

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('xml_resource_not_found');
        expect(result?.metadata?.resourceType).toBe('string');
        expect(result?.metadata?.resourceName).toBe('app_name');
        expect(result?.filePath).toBe('activity_main.xml');
      });

      it('should parse drawable resource not found', () => {
        const errorText = `
Resource @drawable/ic_logo not found
    at com.example.MainActivity.onCreate(MainActivity.kt:34)
        `.trim();

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('xml_resource_not_found');
        expect(result?.metadata?.resourceType).toBe('drawable');
        expect(result?.metadata?.resourceName).toBe('ic_logo');
      });

      it('should parse @+id resource not found', () => {
        const errorText = `
Resource not found: @+id/button_login
in fragment_auth.xml
        `.trim();

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('xml_resource_not_found');
        expect(result?.metadata?.resourceType).toBe('id');
        expect(result?.metadata?.resourceName).toBe('button_login');
      });
    });

    describe('Duplicate ID Errors', () => {
      it('should parse duplicate ID error', () => {
        const errorText = `
Error: Duplicate id @+id/button_submit, already defined earlier in this layout
in activity_main.xml at line 45
        `.trim();

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('xml_duplicate_id');
        expect(result?.filePath).toBe('activity_main.xml');
        expect(result?.line).toBe(45);
        expect(result?.metadata?.duplicateId).toBe('button_submit');
      });

      it('should parse duplicate ID without line number', () => {
        const errorText = `
Duplicate id @+id/text_view_title in fragment_home.xml
        `.trim();

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('xml_duplicate_id');
        expect(result?.metadata?.duplicateId).toBe('text_view_title');
      });
    });

    describe('Invalid Attribute Value Errors', () => {
      it('should parse invalid attribute value error', () => {
        const errorText = `
Error: "wrap_contentt" is not a valid value for attribute layout_width
in activity_main.xml at line 12
        `.trim();

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('xml_invalid_attribute_value');
        expect(result?.filePath).toBe('activity_main.xml');
        expect(result?.line).toBe(12);
        expect(result?.metadata?.attributeName).toBe('layout_width');
        expect(result?.metadata?.invalidValue).toBe('wrap_contentt');
      });

      it('should parse invalid orientation value', () => {
        const errorText = `
"horizontall" is not a valid value for attribute android:orientation
in fragment_list.xml line 8
        `.trim();

        const result = parser.parse(errorText);

        expect(result).not.toBeNull();
        expect(result?.type).toBe('xml_invalid_attribute_value');
        expect(result?.metadata?.attributeName).toBe('android:orientation');
        expect(result?.metadata?.invalidValue).toBe('horizontall');
      });
    });

    describe('Edge Cases', () => {
      it('should return null for empty string', () => {
        const result = parser.parse('');
        expect(result).toBeNull();
      });

      it('should return null for non-XML error', () => {
        const errorText = 'TypeError: Cannot read property of undefined';
        const result = parser.parse(errorText);
        expect(result).toBeNull();
      });

      it('should return null for Kotlin error', () => {
        const errorText = 'kotlin.UninitializedPropertyAccessException: lateinit property user has not been initialized';
        const result = parser.parse(errorText);
        expect(result).toBeNull();
      });

      it('should handle very long error messages', () => {
        const longError = `
android.view.InflateException: Binary XML file line #10: Error inflating class TextView
${'Stack trace line\n'.repeat(1000)}
        `.trim();

        const result = parser.parse(longError);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('xml_inflation');
      });

      it('should handle multiline stack traces', () => {
        const errorText = `
android.view.InflateException: Binary XML file line #25: Error inflating class com.example.CustomView
    at android.view.LayoutInflater.createViewFromTag(LayoutInflater.java:782)
    at android.view.LayoutInflater.inflate(LayoutInflater.java:504)
    at android.view.LayoutInflater.inflate(LayoutInflater.java:414)
    at androidx.fragment.app.Fragment.onCreateView(Fragment.java:2513)
    at com.example.HomeFragment.onCreateView(HomeFragment.kt:28)
    at androidx.fragment.app.FragmentManager.moveToState(FragmentManager.java:1234)
        `.trim();

        const result = parser.parse(errorText);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('xml_inflation');
        expect(result?.line).toBe(25);
      });

      it('should handle error with multiple file references', () => {
        const errorText = `
Error parsing activity_main.xml: attribute layout_width not specified
Also check fragment_home.xml and item_list.xml
in activity_main.xml at line 15
        `.trim();

        const result = parser.parse(errorText);
        expect(result).not.toBeNull();
        expect(result?.filePath).toBe('activity_main.xml'); // First match
      });

      it('should default to unknown.xml if no file found', () => {
        const errorText = `
android.view.InflateException: Binary XML file line #42: Error inflating class CustomView
        `.trim();

        const result = parser.parse(errorText);
        expect(result).not.toBeNull();
        expect(result?.filePath).toBe('unknown.xml');
      });

      it('should default to line 0 if no line found', () => {
        const errorText = `
android.view.InflateException: Error inflating class CustomView
in activity_main.xml
        `.trim();

        const result = parser.parse(errorText);
        expect(result).not.toBeNull();
        expect(result?.line).toBe(0);
      });
    });

    describe('Real-World Examples', () => {
      it('should parse complex inflation error from production', () => {
        const errorText = `
android.view.InflateException: Binary XML file line #23: Binary XML file line #23: Error inflating class <unknown>
Caused by: android.view.InflateException: Binary XML file line #23: Error inflating class <unknown>
Caused by: java.lang.reflect.InvocationTargetException
    at java.lang.reflect.Constructor.newInstance0(Native Method)
    at java.lang.reflect.Constructor.newInstance(Constructor.java:334)
    at android.view.LayoutInflater.createView(LayoutInflater.java:647)
    at android.view.LayoutInflater.createViewFromTag(LayoutInflater.java:790)
    at android.view.LayoutInflater.createViewFromTag(LayoutInflater.java:730)
    at android.view.LayoutInflater.rInflate(LayoutInflater.java:863)
    at android.view.LayoutInflater.rInflateChildren(LayoutInflater.java:824)
    at android.view.LayoutInflater.inflate(LayoutInflater.java:515)
    at android.view.LayoutInflater.inflate(LayoutInflater.java:423)
    at com.example.app.MainActivity.onCreate(MainActivity.kt:42)
        `.trim();

        const result = parser.parse(errorText);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('xml_inflation');
        expect(result?.line).toBe(23);
      });

      it('should parse resource not found from production logs', () => {
        const errorText = `
android.content.res.Resources$NotFoundException: String resource ID #0x7f0d0045
    at android.content.res.Resources.getText(Resources.java:343)
    at android.support.v7.widget.ResourcesWrapper.getText(ResourcesWrapper.java:52)
    at android.content.Context.getString(Context.java:476)
    at com.example.app.fragments.SettingsFragment.updateUI(SettingsFragment.kt:123)
        `.trim();

        const result = parser.parse(errorText);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('xml_resource_not_found');
        expect(result?.metadata?.resourceId).toBe('0x7f0d0045');
        expect(result?.filePath).toBe('SettingsFragment.kt');
        expect(result?.line).toBe(123);
      });
    });
  });

  describe('isXMLError()', () => {
    it('should identify InflateException as XML error', () => {
      const errorText = 'android.view.InflateException: Error inflating class';
      expect(XMLParser.isXMLError(errorText)).toBe(true);
    });

    it('should identify Binary XML file as XML error', () => {
      const errorText = 'Binary XML file line #42: Error';
      expect(XMLParser.isXMLError(errorText)).toBe(true);
    });

    it('should identify findViewById as XML error', () => {
      const errorText = 'NullPointerException after findViewById(R.id.button)';
      expect(XMLParser.isXMLError(errorText)).toBe(true);
    });

    it('should identify .xml file references as XML error', () => {
      const errorText = 'Error in activity_main.xml at line 15';
      expect(XMLParser.isXMLError(errorText)).toBe(true);
    });

    it('should identify xmlns as XML error', () => {
      const errorText = 'Missing xmlns:android declaration';
      expect(XMLParser.isXMLError(errorText)).toBe(true);
    });

    it('should identify android: attributes as XML error', () => {
      const errorText = 'android:layout_width not specified';
      expect(XMLParser.isXMLError(errorText)).toBe(true);
    });

    it('should identify Resource not found as XML error', () => {
      const errorText = 'Resource not found: @string/app_name';
      expect(XMLParser.isXMLError(errorText)).toBe(true);
    });

    it('should identify @+id/ as XML error', () => {
      const errorText = 'Duplicate id @+id/button_submit';
      expect(XMLParser.isXMLError(errorText)).toBe(true);
    });

    it('should not identify Kotlin error as XML', () => {
      const errorText = 'kotlin.UninitializedPropertyAccessException';
      expect(XMLParser.isXMLError(errorText)).toBe(false);
    });

    it('should not identify Gradle error as XML', () => {
      const errorText = 'Execution failed for task :app:compileDebugKotlin';
      expect(XMLParser.isXMLError(errorText)).toBe(false);
    });

    it('should handle empty string', () => {
      expect(XMLParser.isXMLError('')).toBe(false);
    });

    it('should handle generic JavaScript error', () => {
      const errorText = 'TypeError: Cannot read property of undefined';
      expect(XMLParser.isXMLError(errorText)).toBe(false);
    });
  });
});
