"use strict";
/**
 * Network Connectivity Few-Shot Examples (Chunk 9 - Completion)
 * 5 examples for network/repository connectivity errors
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NETWORK_CONNECTIVITY_EXAMPLES = void 0;
exports.NETWORK_CONNECTIVITY_EXAMPLES = [
    {
        id: 'network_maven_central_unavailable',
        errorType: 'NETWORK_CONNECTIVITY',
        error: `Could not GET 'https://repo.maven.apache.org/maven2/com/example/library/1.0.0/library-1.0.0.pom'.
Received status code 503 from server: Service Unavailable`,
        diagnosis: {
            problem: 'Maven Central repository temporarily unavailable during Gradle sync',
            rootCause: 'Network connectivity issue - Maven Central is down or experiencing high load',
            evidence: 'HTTP 503 Service Unavailable response from repo.maven.apache.org',
            confidence: 0.95
        },
        solution: {
            summary: 'Wait and retry Gradle sync, or temporarily use alternative repository mirrors',
            specificFix: `# Solution 1: Wait and retry (recommended)
./gradlew --refresh-dependencies
./gradlew clean build

# Solution 2: Add repository mirrors (temporary)
# File: build.gradle or settings.gradle
repositories {
    maven { url 'https://repo1.maven.org/maven2/' }  // Official mirror
    maven { url 'https://jcenter.bintray.com/' }     // Alternative
    mavenCentral()  // Keep as fallback
}

# Solution 3: Use offline mode if dependencies cached
./gradlew --offline build`,
            fileIdentification: 'Network issue, not a file problem',
            verificationSteps: [
                'Check Maven Central status: https://status.maven.org/',
                'Test connectivity: curl https://repo.maven.apache.org/maven2/',
                'Retry sync after 5-10 minutes',
                'If persists >1 hour, check firewall/proxy settings'
            ]
        },
        confidence: 0.95,
        tags: ['network', 'maven', 'repository', 'connectivity', '503']
    },
    {
        id: 'network_proxy_authentication',
        errorType: 'NETWORK_CONNECTIVITY',
        error: `Unable to tunnel through proxy. Proxy returns "HTTP/1.1 407 Proxy Authentication Required"`,
        diagnosis: {
            problem: 'Gradle cannot connect through corporate proxy - authentication required',
            rootCause: 'Proxy credentials not configured in gradle.properties',
            evidence: 'HTTP 407 Proxy Authentication Required response',
            confidence: 0.90
        },
        solution: {
            summary: 'Configure proxy settings with authentication in gradle.properties',
            specificFix: `# File: ~/.gradle/gradle.properties (user-level, recommended)
# OR: project/gradle.properties (project-level)

systemProp.http.proxyHost=proxy.company.com
systemProp.http.proxyPort=8080
systemProp.http.proxyUser=your_username
systemProp.http.proxyPassword=your_password
systemProp.http.nonProxyHosts=localhost|127.0.0.1

systemProp.https.proxyHost=proxy.company.com
systemProp.https.proxyPort=8080
systemProp.https.proxyUser=your_username
systemProp.https.proxyPassword=your_password
systemProp.https.nonProxyHosts=localhost|127.0.0.1

# Security tip: Use environment variables instead of storing passwords
systemProp.http.proxyUser=\${env.PROXY_USER}
systemProp.http.proxyPassword=\${env.PROXY_PASSWORD}`,
            fileIdentification: '~/.gradle/gradle.properties or project/gradle.properties',
            codeExamples: [
                {
                    before: `# Empty or no proxy configuration`,
                    after: `systemProp.http.proxyHost=proxy.company.com
systemProp.http.proxyPort=8080
systemProp.http.proxyUser=\${env.PROXY_USER}
systemProp.http.proxyPassword=\${env.PROXY_PASSWORD}`
                }
            ],
            verificationSteps: [
                'Set environment variables: export PROXY_USER=your_username',
                'Set environment variables: export PROXY_PASSWORD=your_password',
                'Test connection: ./gradlew --refresh-dependencies',
                'If fails, verify proxy settings with IT department'
            ]
        },
        confidence: 0.90,
        tags: ['network', 'proxy', 'authentication', '407', 'corporate']
    },
    {
        id: 'network_timeout',
        errorType: 'NETWORK_CONNECTIVITY',
        error: `Connect to repo.maven.apache.org:443 [repo.maven.apache.org/151.101.0.209] failed: Connection timed out`,
        diagnosis: {
            problem: 'Network connection timeout when downloading dependencies',
            rootCause: 'Slow/unstable network connection or firewall blocking Maven Central',
            evidence: 'Connection timed out error when connecting to port 443',
            confidence: 0.85
        },
        solution: {
            summary: 'Increase Gradle timeout settings and check firewall/network configuration',
            specificFix: `# File: gradle.properties
# Increase timeout for slow networks
org.gradle.daemon.idletimeout=600000
systemProp.org.gradle.internal.http.connectionTimeout=120000
systemProp.org.gradle.internal.http.socketTimeout=120000

# Retry configuration in build.gradle
allprojects {
    repositories {
        mavenCentral {
            // Add retry logic
            content {
                includeGroupByRegex ".*"
            }
        }
    }
    
    // Configure HTTP client
    gradle.projectsEvaluated {
        tasks.withType(JavaCompile) {
            options.fork = true
            options.forkOptions.memoryMaximumSize = "2g"
        }
    }
}

# Alternative: Download dependencies on better network, then use --offline
./gradlew --refresh-dependencies  # On good network
./gradlew --offline build         # On slow network`,
            fileIdentification: 'gradle.properties and build.gradle',
            verificationSteps: [
                'Test network: ping repo.maven.apache.org',
                'Check firewall allows port 443 outbound',
                'Try on different network (e.g., mobile hotspot) to isolate issue',
                'If corporate network, request IT to whitelist Maven Central'
            ]
        },
        confidence: 0.85,
        tags: ['network', 'timeout', 'firewall', 'slow-connection']
    },
    {
        id: 'network_ssl_certificate',
        errorType: 'NETWORK_CONNECTIVITY',
        error: `PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException: 
unable to find valid certification path to requested target`,
        diagnosis: {
            problem: 'SSL certificate validation failure when connecting to repository',
            rootCause: 'JDK trust store missing certificate for repository (common with corporate proxies)',
            evidence: 'PKIX path building failed - certificate chain cannot be validated',
            confidence: 0.90
        },
        solution: {
            summary: 'Import repository SSL certificate into JDK trust store',
            specificFix: `# Solution 1: Import certificate (recommended)
# Step 1: Download certificate
echo | openssl s_client -showcerts -servername repo.maven.apache.org -connect repo.maven.apache.org:443 2>/dev/null | openssl x509 -inform pem -outform der > maven-cert.der

# Step 2: Import to JDK
sudo keytool -import -alias maven-central -keystore \$JAVA_HOME/lib/security/cacerts -file maven-cert.der
# Default password: changeit

# Solution 2: Disable SSL verification (NOT recommended for production)
# File: gradle.properties
systemProp.javax.net.ssl.trustAll=true

# Or in build.gradle:
allprojects {
    repositories {
        mavenCentral {
            allowInsecureProtocol = false
        }
        maven {
            url = uri("http://insecure-repo.com")  // Use https instead!
            allowInsecureProtocol = true  // Only if absolutely necessary
        }
    }
}

# Solution 3: Corporate proxy - use company CA certificate
# Contact IT for corporate CA certificate, then import it
keytool -import -alias company-ca -keystore \$JAVA_HOME/lib/security/cacerts -file company-ca.crt`,
            fileIdentification: '\$JAVA_HOME/lib/security/cacerts (JDK trust store)',
            verificationSteps: [
                'Verify certificate imported: keytool -list -keystore \$JAVA_HOME/lib/security/cacerts -alias maven-central',
                'Test connection: ./gradlew --refresh-dependencies',
                'If corporate proxy, confirm company CA certificate installed',
                'Restart Gradle daemon: ./gradlew --stop'
            ]
        },
        confidence: 0.90,
        tags: ['network', 'ssl', 'certificate', 'pkix', 'trust-store']
    },
    {
        id: 'network_google_maven_unavailable',
        errorType: 'NETWORK_CONNECTIVITY',
        error: `Could not resolve all dependencies for configuration ':app:debugCompileClasspath'.
Could not resolve androidx.appcompat:appcompat:1.6.1.
Could not GET 'https://dl.google.com/dl/android/maven2/androidx/appcompat/appcompat/1.6.1/appcompat-1.6.1.pom'`,
        diagnosis: {
            problem: 'Cannot access Google Maven repository for AndroidX dependencies',
            rootCause: 'Google Maven repository unavailable or blocked by network/firewall',
            evidence: 'Failed to GET from dl.google.com/dl/android/maven2',
            confidence: 0.90
        },
        solution: {
            summary: 'Add alternative Google Maven mirrors and verify repository configuration',
            specificFix: `# File: settings.gradle (Gradle 6.8+) or build.gradle (older)

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        // Primary: Official Google Maven
        google()
        
        // Backup: Alternative mirrors (use if google() fails)
        maven { url 'https://maven.google.com/' }  // Alternative URL
        maven { url 'https://dl.google.com/dl/android/maven2/' }  // Direct URL
        
        // For AndroidX specifically
        maven { 
            url 'https://androidx.dev/storage/compose-compiler/repository/' 
            content {
                includeGroup "androidx.compose.compiler"
            }
        }
        
        mavenCentral()
    }
}

# If behind firewall, check google() is accessible:
# Test: curl -I https://dl.google.com/dl/android/maven2/

# Alternative: Use JitPack as emergency fallback (rebuilds from source)
maven { url 'https://jitpack.io' }

# Check repository order - google() should come BEFORE mavenCentral()`,
            fileIdentification: 'settings.gradle or build.gradle',
            codeExamples: [
                {
                    before: `repositories {
    mavenCentral()
    google()  // Wrong order!
}`,
                    after: `repositories {
    google()       // Correct order - check google() first
    mavenCentral() // Then mavenCentral()
}`
                }
            ],
            verificationSteps: [
                'Test Google Maven: curl https://dl.google.com/dl/android/maven2/',
                'Verify repository order: google() before mavenCentral()',
                'Check firewall allows dl.google.com',
                'If corporate: request IT to whitelist Google Maven',
                'Clear cache: ./gradlew --refresh-dependencies'
            ]
        },
        confidence: 0.90,
        tags: ['network', 'google-maven', 'androidx', 'repository', 'connectivity']
    }
];
//# sourceMappingURL=network-examples.js.map