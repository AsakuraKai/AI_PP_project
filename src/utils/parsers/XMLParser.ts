/**
 * XMLParser - Parse Android XML layout and manifest errors
 * 
 * Handles XML-specific errors including:
 * - Inflation errors (InflateException)
 * - Missing view ID errors (findViewById returns null)
 * - Attribute errors (missing required attributes)
 * - Namespace errors (xmlns declarations)
 * - Tag mismatch errors (unclosed tags)
 * - Resource reference errors (@+id, @string, etc.)
 * - Duplicate ID errors
 * - Invalid attribute value errors
 * 
 * Design Philosophy:
 * - XML-specific pattern matching
 * - Extract line numbers from stack traces
 * - Identify file names from error messages
 * - Provide actionable fix suggestions
 * 
 * @example
 * const parser = new XMLParser();
 * const error = parser.parse(errorText);
 * if (error?.type === 'xml_inflation') {
 *   console.log(`Inflation error at ${error.filePath}:${error.line}`);
 * }
 */

import { ParsedError } from '../../types';

/**
 * XML-specific error types
 */
export type XMLErrorType =
  | 'xml_inflation'
  | 'xml_missing_id'
  | 'xml_attribute_error'
  | 'xml_namespace_error'
  | 'xml_tag_mismatch'
  | 'xml_resource_not_found'
  | 'xml_duplicate_id'
  | 'xml_invalid_attribute_value';

/**
 * Parser for Android XML layout and manifest errors
 */
export class XMLParser {
  /**
   * Parse XML error text into structured format
   * 
   * @param errorText - Raw error message with stack trace
   * @returns Parsed error object or null if not XML error
   */
  parse(errorText: string): ParsedError | null {
    if (!errorText) return null;

    // Try each parser in order of specificity (most specific first)
    return (
      this.parseAttributeError(errorText) ||  // Check attribute error before inflation
      this.parseInflationError(errorText) ||
      this.parseMissingIdError(errorText) ||
      this.parseNamespaceError(errorText) ||
      this.parseTagMismatchError(errorText) ||
      this.parseResourceNotFoundError(errorText) ||
      this.parseDuplicateIdError(errorText) ||
      this.parseInvalidAttributeValueError(errorText) ||
      null
    );
  }

  /**
   * Quick check if error is XML-related
   * 
   * @param errorText - Error message to check
   * @returns True if appears to be XML error
   */
  static isXMLError(errorText: string): boolean {
    if (!errorText) return false;

    const xmlKeywords = [
      'InflateException',
      'Binary XML file',
      'layout file',
      '.xml',
      'findViewById',
      'xmlns:android',
      'android:',
      'Resource not found',
      '@+id/',
      '@string/',
      'android.view.LayoutInflater'
    ];

    return xmlKeywords.some(keyword => errorText.includes(keyword));
  }

  /**
   * Parse XML inflation errors
   * 
   * Example:
   * ```
   * android.view.InflateException: Binary XML file line #42: 
   * Error inflating class com.example.CustomView
   * ```
   */
  private parseInflationError(errorText: string): ParsedError | null {
    // Match: Binary XML file line #XX
    const binaryXMLMatch = errorText.match(/Binary XML file line #(\d+)/i);
    
    if (binaryXMLMatch) {
      const line = parseInt(binaryXMLMatch[1]);
      
      // Extract file path if present
      const fileMatch = errorText.match(/in ([a-zA-Z0-9_\/\-]+\.xml)/i);
      const filePath = fileMatch ? fileMatch[1] : 'unknown.xml';
      
      // Extract class name being inflated
      const classMatch = errorText.match(/Error inflating class ([a-zA-Z0-9_.]+)/i);
      const className = classMatch ? classMatch[1] : undefined;
      
      return {
        type: 'xml_inflation',
        message: errorText.trim(),
        filePath,
        line,
        language: 'xml',
        framework: 'android',
        metadata: {
          className,
          errorType: 'inflation'
        }
      };
    }

    // Alternative pattern: InflateException without line number
    if (errorText.includes('InflateException')) {
      const fileMatch = errorText.match(/([a-zA-Z0-9_\/\-]+\.xml)/i);
      const classMatch = errorText.match(/Error inflating class ([a-zA-Z0-9_.]+)/i);
      
      return {
        type: 'xml_inflation',
        message: errorText.trim(),
        filePath: fileMatch ? fileMatch[1] : 'unknown.xml',
        line: 0,
        language: 'xml',
        framework: 'android',
        metadata: {
          className: classMatch ? classMatch[1] : undefined,
          errorType: 'inflation'
        }
      };
    }

    return null;
  }

  /**
   * Parse missing view ID errors (findViewById returns null)
   * 
   * Example:
   * ```
   * java.lang.NullPointerException: Attempt to invoke virtual method
   * 'void android.widget.TextView.setText(CharSequence)' on a null object reference
   * at MainActivity.kt:23 (after findViewById)
   * ```
   */
  private parseMissingIdError(errorText: string): ParsedError | null {
    const hasNullPointer = errorText.includes('NullPointerException');
    const hasViewMethod = /android\.(widget|view)\./.test(errorText);
    const hasFindViewById = errorText.includes('findViewById');
    
    if (hasNullPointer && (hasViewMethod || hasFindViewById)) {
      // Extract file and line - look for .kt or .java files
      const stackMatch = errorText.match(/at\s+[a-zA-Z0-9_.]+\(([a-zA-Z0-9_]+\.(kt|java)):(\d+)\)/);
      
      // Extract view ID if present
      const idMatch = errorText.match(/R\.id\.([a-zA-Z0-9_]+)/);
      
      // Extract view class
      const viewMatch = errorText.match(/android\.(widget|view)\.([a-zA-Z0-9_]+)/);
      
      return {
        type: 'xml_missing_id',
        message: errorText.trim(),
        filePath: stackMatch ? stackMatch[1] : 'unknown',
        line: stackMatch ? parseInt(stackMatch[3]) : 0,
        language: 'xml',
        framework: 'android',
        metadata: {
          viewId: idMatch ? idMatch[1] : undefined,
          viewClass: viewMatch ? viewMatch[2] : undefined,
          errorType: 'missing_id'
        }
      };
    }

    return null;
  }

  /**
   * Parse attribute errors (missing or invalid required attributes)
   * AX002: Missing required attributes like layout_width
   * 
   * Example:
   * ```
   * Error parsing XML: attribute layout_width not specified
   * You must supply a layout_width attribute
   * in activity_main.xml at line 15
   * ```
   */
  private parseAttributeError(errorText: string): ParsedError | null {
    // Pattern 1: "You must supply a X attribute" (most specific for AX002)
    const mustSupplyMatch = errorText.match(/You must supply (?:a|an) ([a-zA-Z0-9_:]+) attribute/i);
    if (mustSupplyMatch) {
      // Extract line from "Binary XML file line #X" format
      const lineMatch = errorText.match(/Binary XML file line #(\d+)/i);
      const fileMatch = errorText.match(/([a-zA-Z0-9_\/\-]+\.xml)/i);
      
      return {
        type: 'xml_missing_attribute',
        message: errorText.trim(),
        filePath: fileMatch ? fileMatch[1] : 'unknown.xml',
        line: lineMatch ? parseInt(lineMatch[1]) : 0,
        language: 'xml',
        framework: 'android',
        metadata: {
          attributeName: mustSupplyMatch[1],
          errorType: 'missing_required_attribute'
        }
      };
    }

    // Pattern 2: "attribute X not specified" or "missing"
    const attrMatch = errorText.match(/attribute\s+([a-zA-Z0-9_:]+)\s+(not specified|missing|required)/i);
    if (attrMatch) {
      const attributeName = attrMatch[1];
      
      // Extract file and line
      const fileMatch = errorText.match(/in ([a-zA-Z0-9_\/\-]+\.xml)/i);
      const lineMatch = errorText.match(/at line (\d+)/i) || errorText.match(/line (\d+)/i);
      
      return {
        type: 'xml_attribute_error',
        message: errorText.trim(),
        filePath: fileMatch ? fileMatch[1] : 'unknown.xml',
        line: lineMatch ? parseInt(lineMatch[1]) : 0,
        language: 'xml',
        framework: 'android',
        metadata: {
          attributeName,
          errorType: 'missing_attribute'
        }
      };
    }

    return null;
  }

  /**
   * Parse namespace errors (missing xmlns declarations)
   * 
   * Example:
   * ```
   * Error: No resource identifier found for attribute 'layout_width' 
   * in package 'android'
   * Missing xmlns:android namespace declaration
   * ```
   */
  private parseNamespaceError(errorText: string): ParsedError | null {
    const hasNamespaceKeyword = /xmlns|namespace/i.test(errorText);
    const hasNoResource = errorText.includes('No resource identifier found');
    const hasMissingDeclaration = errorText.includes('Missing');
    
    if ((hasNamespaceKeyword && hasMissingDeclaration) || 
        (hasNoResource && errorText.includes('android'))) {
      
      const fileMatch = errorText.match(/in ([a-zA-Z0-9_\/\-]+\.xml)/i) ||
                       errorText.match(/([a-zA-Z0-9_\/\-]+\.xml)/i);
      const lineMatch = errorText.match(/at line (\d+)/i);
      
      // Extract attribute that failed
      const attrMatch = errorText.match(/attribute '([a-zA-Z0-9_:]+)'/i);
      
      return {
        type: 'xml_namespace_error',
        message: errorText.trim(),
        filePath: fileMatch ? fileMatch[1] : 'unknown.xml',
        line: lineMatch ? parseInt(lineMatch[1]) : 0,
        language: 'xml',
        framework: 'android',
        metadata: {
          attributeName: attrMatch ? attrMatch[1] : undefined,
          errorType: 'missing_namespace'
        }
      };
    }

    return null;
  }

  /**
   * Parse tag mismatch errors (unclosed or mismatched tags)
   * 
   * Example:
   * ```
   * XML parsing error: The element type "LinearLayout" must be 
   * terminated by the matching end-tag "</LinearLayout>"
   * in activity_main.xml at line 28
   * ```
   */
  private parseTagMismatchError(errorText: string): ParsedError | null {
    const tagMismatchPattern = /element type "([^"]+)" must be terminated/i;
    const unclosedPattern = /Unclosed tag: ([a-zA-Z0-9_]+)/i;
    
    const tagMatch = errorText.match(tagMismatchPattern) || errorText.match(unclosedPattern);
    
    if (tagMatch) {
      const tagName = tagMatch[1];
      
      const fileMatch = errorText.match(/in ([a-zA-Z0-9_\/\-]+\.xml)/i);
      const lineMatch = errorText.match(/at line (\d+)/i) || errorText.match(/line (\d+)/i);
      
      return {
        type: 'xml_tag_mismatch',
        message: errorText.trim(),
        filePath: fileMatch ? fileMatch[1] : 'unknown.xml',
        line: lineMatch ? parseInt(lineMatch[1]) : 0,
        language: 'xml',
        framework: 'android',
        metadata: {
          tagName,
          errorType: 'unclosed_tag'
        }
      };
    }

    return null;
  }

  /**
   * Parse resource not found errors (@+id, @string, etc.)
   * 
   * Example:
   * ```
   * android.content.res.Resources$NotFoundException: 
   * Resource ID #0x7f080123
   * or: String resource ID #0x7f0d0045
   * or: @string/app_name not found
   * ```
   */
  private parseResourceNotFoundError(errorText: string): ParsedError | null {
    const hasResourceNotFound = errorText.includes('NotFoundException') || 
                                errorText.includes('Resource') && errorText.includes('not found');
    
    if (hasResourceNotFound) {
      // Extract resource ID (hex)
      const hexMatch = errorText.match(/Resource ID #(0x[0-9a-fA-F]+)/i);
      
      // Extract resource name (@string/name, @+id/name, etc.)
      const nameMatch = errorText.match(/@(\+?)([a-zA-Z]+)\/([a-zA-Z0-9_]+)/);
      
      const fileMatch = errorText.match(/in ([a-zA-Z0-9_\/\-]+\.xml)/i);
      
      // Better stack trace parsing - find user code (not Android framework)
      // Look for stack frames with package names that look like app code
      const stackFrames = errorText.matchAll(/at\s+([a-zA-Z0-9_.]+)\(([a-zA-Z0-9_]+\.(kt|java)):(\d+)\)/g);
      let bestMatch = null;
      
      for (const match of stackFrames) {
        const packageName = match[1];
        const fileName = match[2];
        const lineNum = match[4];
        
        // Skip Android framework files
        if (!packageName.startsWith('android.') && 
            !packageName.startsWith('java.') &&
            !packageName.startsWith('androidx.')) {
          bestMatch = { fileName, lineNum };
          break; // First non-framework file is likely user code
        }
      }
      
      return {
        type: 'xml_resource_not_found',
        message: errorText.trim(),
        filePath: fileMatch ? fileMatch[1] : (bestMatch ? bestMatch.fileName : 'unknown'),
        line: bestMatch ? parseInt(bestMatch.lineNum) : 0,
        language: 'xml',
        framework: 'android',
        metadata: {
          resourceId: hexMatch ? hexMatch[1] : undefined,
          resourceType: nameMatch ? nameMatch[2] : undefined,
          resourceName: nameMatch ? nameMatch[3] : undefined,
          errorType: 'resource_not_found'
        }
      };
    }

    return null;
  }

  /**
   * Parse duplicate ID errors
   * 
   * Example:
   * ```
   * Error: Duplicate id @+id/button_submit, already defined earlier in this layout
   * in activity_main.xml at line 45
   * ```
   */
  private parseDuplicateIdError(errorText: string): ParsedError | null {
    const duplicateMatch = errorText.match(/Duplicate id @\+id\/([a-zA-Z0-9_]+)/i);
    
    if (duplicateMatch) {
      const idName = duplicateMatch[1];
      
      const fileMatch = errorText.match(/in ([a-zA-Z0-9_\/\-]+\.xml)/i);
      const lineMatch = errorText.match(/at line (\d+)/i) || errorText.match(/line (\d+)/i);
      
      return {
        type: 'xml_duplicate_id',
        message: errorText.trim(),
        filePath: fileMatch ? fileMatch[1] : 'unknown.xml',
        line: lineMatch ? parseInt(lineMatch[1]) : 0,
        language: 'xml',
        framework: 'android',
        metadata: {
          duplicateId: idName,
          errorType: 'duplicate_id'
        }
      };
    }

    return null;
  }

  /**
   * Parse invalid attribute value errors
   * 
   * Example:
   * ```
   * Error: "wrap_contentt" is not a valid value for attribute layout_width
   * in activity_main.xml at line 12
   * ```
   */
  private parseInvalidAttributeValueError(errorText: string): ParsedError | null {
    const invalidMatch = errorText.match(/"([^"]+)" is not a valid value for attribute ([a-zA-Z0-9_:]+)/i);
    
    if (invalidMatch) {
      const invalidValue = invalidMatch[1];
      const attributeName = invalidMatch[2];
      
      const fileMatch = errorText.match(/in ([a-zA-Z0-9_\/\-]+\.xml)/i);
      const lineMatch = errorText.match(/at line (\d+)/i) || errorText.match(/line (\d+)/i);
      
      return {
        type: 'xml_invalid_attribute_value',
        message: errorText.trim(),
        filePath: fileMatch ? fileMatch[1] : 'unknown.xml',
        line: lineMatch ? parseInt(lineMatch[1]) : 0,
        language: 'xml',
        framework: 'android',
        metadata: {
          attributeName,
          invalidValue,
          errorType: 'invalid_value'
        }
      };
    }

    return null;
  }
}
