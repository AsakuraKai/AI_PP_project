/**
 * AndroidDocsSearchTool - Offline Android SDK documentation search
 * 
 * Provides:
 * - Indexed search of common Android APIs
 * - Search by API class/method name
 * - Search by error message keywords
 * - Return relevant documentation snippets
 * 
 * Design Philosophy:
 * - Offline-first - no internet required
 * - Curated documentation for most common APIs
 * - Context-aware search based on error type
 * - Fast in-memory lookup
 * 
 * Note: This is a lightweight implementation with curated docs.
 * For production, could integrate with full Android SDK docs.
 * 
 * @example
 * const tool = new AndroidDocsSearchTool();
 * await tool.initialize();
 * const results = tool.search('Activity');
 * const lifecycle = tool.searchByTopic('lifecycle');
 */

export interface DocEntry {
  name: string;
  type: 'class' | 'method' | 'concept' | 'permission';
  category: 'core' | 'ui' | 'data' | 'compose' | 'lifecycle' | 'permission';
  description: string;
  commonErrors?: string[];
  relatedAPIs?: string[];
}

export interface SearchResult {
  entry: DocEntry;
  relevance: number;
  matchType: 'exact' | 'partial' | 'related';
}

export class AndroidDocsSearchTool {
  private docsIndex: Map<string, DocEntry> = new Map();
  private keywordIndex: Map<string, Set<string>> = new Map(); // keyword -> doc names
  private initialized: boolean = false;

  /**
   * Initialize the documentation index
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Core Android APIs
    this.addDoc({
      name: 'Activity',
      type: 'class',
      category: 'core',
      description: 'android.app.Activity - Base class for activities. An activity represents a single screen with a user interface. Activities are launched, paused, resumed, and destroyed as users navigate through your app.',
      commonErrors: ['lifecycle', 'onCreate not called', 'finish', 'leaked window'],
      relatedAPIs: ['Fragment', 'Intent', 'Bundle', 'onCreate', 'onResume', 'onPause'],
    });

    this.addDoc({
      name: 'Fragment',
      type: 'class',
      category: 'ui',
      description: 'androidx.fragment.app.Fragment - A reusable portion of your app\'s UI. Fragments have their own lifecycle and receive their own input events.',
      commonErrors: ['fragment not attached', 'transaction committed after state loss', 'view lifecycle'],
      relatedAPIs: ['Activity', 'FragmentManager', 'FragmentTransaction', 'onCreateView', 'onViewCreated'],
    });

    this.addDoc({
      name: 'onCreate',
      type: 'method',
      category: 'lifecycle',
      description: 'Called when the activity is starting. This is where most initialization should go: calling setContentView() to inflate the layout, binding views, initializing data.',
      commonErrors: ['lateinit not initialized', 'view binding', 'null pointer'],
      relatedAPIs: ['Activity', 'setContentView', 'findViewById', 'Bundle', 'savedInstanceState'],
    });

    this.addDoc({
      name: 'lateinit',
      type: 'concept',
      category: 'core',
      description: 'Kotlin lateinit modifier allows you to declare non-null properties that will be initialized later (not in constructor). You must initialize before first use or you\'ll get UninitializedPropertyAccessException.',
      commonErrors: ['UninitializedPropertyAccessException', 'lateinit property has not been initialized'],
      relatedAPIs: ['isInitialized', 'by lazy'],
    });

    this.addDoc({
      name: 'ViewModel',
      type: 'class',
      category: 'lifecycle',
      description: 'androidx.lifecycle.ViewModel - Stores and manages UI-related data in a lifecycle-conscious way. Survives configuration changes like screen rotations.',
      commonErrors: ['ViewModelProvider', 'factory', 'cleared too early'],
      relatedAPIs: ['LiveData', 'ViewModelProvider', 'ViewModelFactory', 'onCleared'],
    });

    this.addDoc({
      name: 'LiveData',
      type: 'class',
      category: 'data',
      description: 'androidx.lifecycle.LiveData - Observable data holder class that is lifecycle-aware. Updates UI components only when they are in active lifecycle state.',
      commonErrors: ['observe on background thread', 'setValue vs postValue', 'observer not removed'],
      relatedAPIs: ['ViewModel', 'MutableLiveData', 'observe', 'setValue', 'postValue'],
    });

    // Jetpack Compose APIs
    this.addDoc({
      name: 'remember',
      type: 'method',
      category: 'compose',
      description: '@Composable function that remembers values across recompositions. Use remember to store objects that are expensive to create or that maintain state.',
      commonErrors: ['reading state without remember', 'recomposition loop', 'state lost'],
      relatedAPIs: ['mutableStateOf', 'rememberSaveable', 'derivedStateOf', 'State'],
    });

    this.addDoc({
      name: 'LaunchedEffect',
      type: 'method',
      category: 'compose',
      description: '@Composable coroutine launcher that runs when keys change. Use for side effects like API calls. Cancelled when the composable leaves composition.',
      commonErrors: ['infinite recomposition', 'coroutine leaked', 'key not provided'],
      relatedAPIs: ['rememberCoroutineScope', 'DisposableEffect', 'SideEffect', 'CoroutineScope'],
    });

    // Permissions
    this.addDoc({
      name: 'CAMERA',
      type: 'permission',
      category: 'permission',
      description: 'android.permission.CAMERA - Required to access device camera. This is a dangerous permission requiring runtime request on Android 6.0+.',
      commonErrors: ['Permission denial', 'SecurityException'],
      relatedAPIs: ['ActivityCompat.requestPermissions', 'checkSelfPermission', 'onRequestPermissionsResult'],
    });

    this.addDoc({
      name: 'INTERNET',
      type: 'permission',
      category: 'permission',
      description: 'android.permission.INTERNET - Required for network access. This is a normal permission (auto-granted at install). Must be declared in manifest.',
      commonErrors: ['NetworkOnMainThreadException', 'UnknownHostException', 'Connection refused'],
      relatedAPIs: ['HttpURLConnection', 'OkHttp', 'Retrofit'],
    });

    this.addDoc({
      name: 'findViewById',
      type: 'method',
      category: 'ui',
      description: 'Finds a view by its ID. Returns null if no view with that ID exists. Deprecated in favor of View Binding or Jetpack Compose.',
      commonErrors: ['NullPointerException', 'ClassCastException', 'view not found'],
      relatedAPIs: ['View', 'ViewBinding', 'setContentView', 'inflate'],
    });

    this.addDoc({
      name: 'RecyclerView',
      type: 'class',
      category: 'ui',
      description: 'androidx.recyclerview.widget.RecyclerView - Flexible view for displaying large data sets. More efficient than ListView, supports ViewHolder pattern.',
      commonErrors: ['no adapter attached', 'no layout manager', 'IllegalStateException', 'IndexOutOfBoundsException'],
      relatedAPIs: ['Adapter', 'ViewHolder', 'LayoutManager', 'DiffUtil', 'notifyDataSetChanged'],
    });

    this.addDoc({
      name: 'Context',
      type: 'class',
      category: 'core',
      description: 'android.content.Context - Interface to global application environment. Provides access to resources, databases, preferences, and system services.',
      commonErrors: ['leaked activity context', 'UI context required', 'context null'],
      relatedAPIs: ['Activity', 'Application', 'getApplicationContext', 'getResources', 'getSystemService'],
    });

    this.addDoc({
      name: 'Intent',
      type: 'class',
      category: 'core',
      description: 'android.content.Intent - Abstract description of an operation to be performed. Used to start activities, services, and deliver broadcasts.',
      commonErrors: ['ActivityNotFoundException', 'no activity found to handle intent', 'extras not found'],
      relatedAPIs: ['Activity', 'startActivity', 'startActivityForResult', 'putExtra', 'getExtras'],
    });

    // Build keyword index
    this.buildKeywordIndex();
    
    this.initialized = true;
  }

  /**
   * Add a documentation entry
   */
  private addDoc(entry: DocEntry): void {
    this.docsIndex.set(entry.name.toLowerCase(), entry);
  }

  /**
   * Build keyword index for faster searching
   */
  private buildKeywordIndex(): void {
    for (const [name, entry] of this.docsIndex.entries()) {
      // Index by name parts
      const nameParts = name.split(/(?=[A-Z])/).map(p => p.toLowerCase());
      for (const part of nameParts) {
        if (part.length > 2) {
          this.addKeyword(part, name);
        }
      }

      // Index by common errors
      if (entry.commonErrors) {
        for (const error of entry.commonErrors) {
          const errorWords = error.toLowerCase().split(/\s+/);
          for (const word of errorWords) {
            if (word.length > 3) {
              this.addKeyword(word, name);
            }
          }
        }
      }

      // Index by category
      this.addKeyword(entry.category, name);
    }
  }

  /**
   * Add keyword to index
   */
  private addKeyword(keyword: string, docName: string): void {
    if (!this.keywordIndex.has(keyword)) {
      this.keywordIndex.set(keyword, new Set());
    }
    this.keywordIndex.get(keyword)!.add(docName);
  }

  /**
   * Search documentation by query
   */
  search(query: string, limit: number = 5): SearchResult[] {
    if (!this.initialized) {
      throw new Error('AndroidDocsSearchTool not initialized. Call initialize() first.');
    }

    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

    // Exact match
    if (this.docsIndex.has(queryLower)) {
      results.push({
        entry: this.docsIndex.get(queryLower)!,
        relevance: 1.0,
        matchType: 'exact',
      });
    }

    // Partial matches
    for (const [name, entry] of this.docsIndex.entries()) {
      if (name.includes(queryLower) && name !== queryLower) {
        results.push({
          entry,
          relevance: 0.8,
          matchType: 'partial',
        });
      }
    }

    // Keyword matches
    const keywordMatches = new Map<string, number>(); // doc name -> match count
    for (const word of queryWords) {
      const matchingDocs = this.keywordIndex.get(word);
      if (matchingDocs) {
        for (const docName of matchingDocs) {
          keywordMatches.set(docName, (keywordMatches.get(docName) || 0) + 1);
        }
      }
    }

    // Add keyword matches not already in results
    const existingNames = new Set(results.map(r => r.entry.name.toLowerCase()));
    for (const [docName, matchCount] of keywordMatches.entries()) {
      if (!existingNames.has(docName)) {
        const entry = this.docsIndex.get(docName);
        if (entry) {
          results.push({
            entry,
            relevance: Math.min(0.6 + matchCount * 0.1, 0.9),
            matchType: 'related',
          });
        }
      }
    }

    // Sort by relevance and limit
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  /**
   * Search by topic/category
   */
  searchByTopic(topic: string): DocEntry[] {
    if (!this.initialized) {
      throw new Error('AndroidDocsSearchTool not initialized. Call initialize() first.');
    }

    const results: DocEntry[] = [];
    const topicLower = topic.toLowerCase();

    for (const entry of this.docsIndex.values()) {
      if (entry.category === topicLower) {
        results.push(entry);
      }
    }

    return results;
  }

  /**
   * Search by error message
   */
  searchByError(errorMessage: string): SearchResult[] {
    if (!this.initialized) {
      throw new Error('AndroidDocsSearchTool not initialized. Call initialize() first.');
    }

    const results: SearchResult[] = [];
    const errorLower = errorMessage.toLowerCase();

    for (const entry of this.docsIndex.values()) {
      if (entry.commonErrors) {
        for (const commonError of entry.commonErrors) {
          if (errorLower.includes(commonError.toLowerCase()) || 
              commonError.toLowerCase().includes(errorLower)) {
            results.push({
              entry,
              relevance: 0.9,
              matchType: 'exact',
            });
            break;
          }
        }
      }
    }

    return results;
  }

  /**
   * Get all available categories
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    for (const entry of this.docsIndex.values()) {
      categories.add(entry.category);
    }
    return Array.from(categories).sort();
  }

  /**
   * Get documentation entry by name
   */
  getDoc(name: string): DocEntry | null {
    return this.docsIndex.get(name.toLowerCase()) || null;
  }

  /**
   * Get all documentation entries
   */
  getAllDocs(): DocEntry[] {
    return Array.from(this.docsIndex.values());
  }
}
