/**
 * Test Dataset - Real Kotlin NPE Errors
 * 
 * Collection of 10 real-world Kotlin error examples for testing RCA accuracy.
 * Each error includes:
 * - Raw error text
 * - Expected error type
 * - Expected root cause category
 * - Sample code context
 * 
 * Used in Chunk 1.5 for MVP testing and validation.
 */

export interface TestCase {
  id: string;
  name: string;
  errorText: string;
  expectedType: string;
  expectedRootCause: string;
  sampleCode: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const testDataset: TestCase[] = [
  // Test Case 1: Basic lateinit property
  {
    id: 'TC001',
    name: 'Lateinit Property Not Initialized',
    errorText: `kotlin.UninitializedPropertyAccessException: lateinit property user has not been initialized
    at com.example.MainActivity.onCreate(MainActivity.kt:45)
    at android.app.Activity.performCreate(Activity.java:8000)`,
    expectedType: 'lateinit',
    expectedRootCause: 'Property accessed before initialization',
    sampleCode: `class MainActivity : AppCompatActivity() {
    private lateinit var user: User
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val name = user.name // ERROR: user not initialized
    }
}`,
    difficulty: 'easy',
  },

  // Test Case 2: Nullable type without safe call
  {
    id: 'TC002',
    name: 'Null Pointer - Missing Safe Call',
    errorText: `NullPointerException: Attempt to invoke virtual method 'String.length()' on null object reference
    at com.example.UserRepository.validateName(UserRepository.kt:23)`,
    expectedType: 'npe',
    expectedRootCause: 'Nullable value accessed without null check',
    sampleCode: `class UserRepository {
    fun validateName(name: String?): Boolean {
        return name.length > 3 // ERROR: name could be null
    }
}`,
    difficulty: 'easy',
  },

  // Test Case 3: findViewById returns null
  {
    id: 'TC003',
    name: 'View Not Found - findViewById',
    errorText: `NullPointerException: Attempt to invoke virtual method 'void android.widget.TextView.setText()' on null
    at com.example.ProfileFragment.updateUI(ProfileFragment.kt:67)`,
    expectedType: 'npe',
    expectedRootCause: 'findViewById returned null - view ID not in layout',
    sampleCode: `class ProfileFragment : Fragment() {
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val textView = view.findViewById<TextView>(R.id.profile_name)
        textView.text = "Name" // ERROR: textView is null
    }
}`,
    difficulty: 'medium',
  },

  // Test Case 4: Lateinit in secondary constructor
  {
    id: 'TC004',
    name: 'Lateinit in Constructor Path',
    errorText: `kotlin.UninitializedPropertyAccessException: lateinit property database has not been initialized
    at com.example.DataManager.query(DataManager.kt:34)`,
    expectedType: 'lateinit',
    expectedRootCause: 'Different constructor paths - one does not initialize property',
    sampleCode: `class DataManager {
    private lateinit var database: Database
    
    constructor(context: Context) {
        database = Database.getInstance(context)
    }
    
    constructor() {
        // ERROR: database not initialized in this path
    }
    
    fun query() = database.query()
}`,
    difficulty: 'medium',
  },

  // Test Case 5: Bundle extras null
  {
    id: 'TC005',
    name: 'Intent Extras Null',
    errorText: `NullPointerException: Attempt to invoke virtual method 'String Bundle.getString()' on null
    at com.example.DetailActivity.onCreate(DetailActivity.kt:18)`,
    expectedType: 'npe',
    expectedRootCause: 'Intent extras bundle is null - not passed from previous activity',
    sampleCode: `class DetailActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val userId = intent.extras.getString("USER_ID") // ERROR: extras is null
    }
}`,
    difficulty: 'medium',
  },

  // Test Case 6: Array access out of bounds
  {
    id: 'TC006',
    name: 'List Index Out of Bounds',
    errorText: `IndexOutOfBoundsException: Index 5 out of bounds for length 3
    at com.example.ListAdapter.getItem(ListAdapter.kt:42)`,
    expectedType: 'npe',
    expectedRootCause: 'Accessing list element beyond size',
    sampleCode: `class ListAdapter(private val items: List<String>) {
    fun getItem(position: Int): String {
        return items[position] // ERROR: position >= items.size
    }
}`,
    difficulty: 'easy',
  },

  // Test Case 7: Coroutine context missing
  {
    id: 'TC007',
    name: 'Lateinit in Coroutine',
    errorText: `kotlin.UninitializedPropertyAccessException: lateinit property viewModel has not been initialized
    at com.example.MainActivity$onCreate$1.invokeSuspend(MainActivity.kt:52)`,
    expectedType: 'lateinit',
    expectedRootCause: 'Property accessed in coroutine before initialization completes',
    sampleCode: `class MainActivity : AppCompatActivity() {
    private lateinit var viewModel: MainViewModel
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        lifecycleScope.launch {
            viewModel.loadData() // ERROR: viewModel not yet initialized
        }
        
        viewModel = ViewModelProvider(this).get(MainViewModel::class.java)
    }
}`,
    difficulty: 'hard',
  },

  // Test Case 8: Fragment view after onDestroyView
  {
    id: 'TC008',
    name: 'Fragment View Lifecycle',
    errorText: `NullPointerException: Attempt to read from field 'android.view.View' on null object
    at com.example.HomeFragment.updateData(HomeFragment.kt:89)`,
    expectedType: 'npe',
    expectedRootCause: 'Accessing view after onDestroyView - view is destroyed',
    sampleCode: `class HomeFragment : Fragment() {
    private var binding: FragmentHomeBinding? = null
    
    override fun onDestroyView() {
        super.onDestroyView()
        binding = null
    }
    
    fun updateData(data: List<String>) {
        binding?.recyclerView?.adapter?.notifyDataSetChanged() // Called after onDestroyView
    }
}`,
    difficulty: 'hard',
  },

  // Test Case 9: Companion object lateinit
  {
    id: 'TC009',
    name: 'Companion Object Lateinit',
    errorText: `kotlin.UninitializedPropertyAccessException: lateinit property instance has not been initialized
    at com.example.AppConfig$Companion.getConfig(AppConfig.kt:15)`,
    expectedType: 'lateinit',
    expectedRootCause: 'Singleton instance accessed before initialization',
    sampleCode: `class AppConfig private constructor() {
    companion object {
        private lateinit var instance: AppConfig
        
        fun initialize(context: Context) {
            instance = AppConfig()
        }
        
        fun getConfig(): AppConfig {
            return instance // ERROR: called before initialize()
        }
    }
}`,
    difficulty: 'medium',
  },

  // Test Case 10: Safe call chain null
  {
    id: 'TC010',
    name: 'Forced Non-Null (!!) on Null',
    errorText: `NullPointerException: Attempt to invoke virtual method on null
    at com.example.UserService.getName(UserService.kt:28)`,
    expectedType: 'npe',
    expectedRootCause: 'Force unwrapping null value with !! operator',
    sampleCode: `class UserService {
    private var currentUser: User? = null
    
    fun getName(): String {
        return currentUser!!.name // ERROR: !! forces non-null but value is null
    }
}`,
    difficulty: 'easy',
  },
];

/**
 * Get test cases by difficulty
 */
export function getTestCasesByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): TestCase[] {
  return testDataset.filter(tc => tc.difficulty === difficulty);
}

/**
 * Get test case by ID
 */
export function getTestCaseById(id: string): TestCase | undefined {
  return testDataset.find(tc => tc.id === id);
}

/**
 * Statistics about test dataset
 */
export const datasetStats = {
  total: testDataset.length,
  easy: testDataset.filter(tc => tc.difficulty === 'easy').length,
  medium: testDataset.filter(tc => tc.difficulty === 'medium').length,
  hard: testDataset.filter(tc => tc.difficulty === 'hard').length,
};
