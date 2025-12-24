'use client'

/**
 * Learn & Burn Platform Component
 * 
 * Educational platform about FHE technology.
 * Users can learn, take tests, and create custom tests.
 * Test scores are encrypted using FHE before submission.
 */

import { useState, useEffect } from 'react'
import { useAccount, useWalletClient, useSwitchChain, useChainId, useBalance } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ethers } from 'ethers'
import { walletClientToSigner, getSigner, getReadOnlyProvider } from '@/lib/provider'
import { sepolia } from 'wagmi/chains'
import { formatEther } from 'viem'

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_LEARNING_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000').trim()

const CONTRACT_ABI = [
  'function createTest(string memory _title, string memory _description, uint256 _questionCount, uint256 _maxScore) external returns (uint256)',
  'function submitScore(uint256 _testId, bytes32 _encryptedScore, bytes calldata _attestation) external',
  'function getTest(uint256 _testId) external view returns (address creator, string memory title, string memory description, uint256 questionCount, uint256 maxScore, uint256 createdAt, bool isActive)',
  'function getTestScores(uint256 _testId) external view returns (tuple(address student, uint256 testId, bytes32 encryptedScore, uint256 submittedAt, uint256 attemptNumber)[] scores)',
  'function getUserAttemptCount(uint256 _testId, address _user) external view returns (uint256)',
  'function getUserTests(address _user) external view returns (uint256[])',
  'function getUserCompletedTests(address _user) external view returns (uint256[])',
  'function getActiveTests(uint256 _limit) external view returns (uint256[])',
  'function deactivateTest(uint256 _testId) external',
  'function testCounter() external view returns (uint256)',
  'event TestCreated(uint256 indexed testId, address indexed creator, string title, uint256 questionCount, uint256 maxScore)',
  'event ScoreSubmitted(uint256 indexed testId, address indexed student, bytes32 encryptedScore, uint256 attemptNumber)',
  'event TestDeactivated(uint256 indexed testId, address indexed creator)',
]

type Tab = 'ABOUT' | 'LEARN' | 'PROGRESS' | 'CREATE' | 'ALL_TESTS'

interface Test {
  id: number
  title: string
  description: string
  questionCount: number
  maxScore: number
  createdAt: number
  isActive: boolean
  creator: string
  myScore?: number
  attemptCount?: number
}

interface Question {
  question: string
  options: string[]
  correctAnswer: number
}

// Base question pool for random test generation
const QUESTION_POOL: Question[] = [
  {
    question: "What does FHE stand for?",
    options: ["Fully Homomorphic Encryption", "Fast Hash Encryption", "Federated Hash Exchange", "Fixed Header Encoding"],
    correctAnswer: 0
  },
  {
    question: "What is the main advantage of FHE?",
    options: ["Fast computation", "Ability to compute on encrypted data", "Small encrypted data size", "No key management needed"],
    correctAnswer: 1
  },
  {
    question: "What does Zama provide?",
    options: ["FHE solutions and tools", "Blockchain only", "Traditional encryption", "Database management"],
    correctAnswer: 0
  },
  {
    question: "What is FHEVM?",
    options: ["A virtual machine", "FHE for Ethereum Virtual Machine", "A programming language", "A database system"],
    correctAnswer: 1
  },
  {
    question: "Can you perform operations on FHE-encrypted data without decrypting it?",
    options: ["No, you must decrypt first", "Yes, that's the main feature", "Only for certain operations", "It depends on the data type"],
    correctAnswer: 1
  },
  {
    question: "What is the main use case for FHE in blockchain?",
    options: ["Speed up transactions", "Enable private computation on-chain", "Reduce gas costs", "Increase block size"],
    correctAnswer: 1
  },
  {
    question: "What does homomorphic mean in FHE?",
    options: ["Same shape", "Same structure - operations work on encrypted data", "Same size", "Same speed"],
    correctAnswer: 1
  },
  {
    question: "Which operations can typically be performed on FHE-encrypted data?",
    options: ["Only addition", "Only multiplication", "Addition and multiplication", "All operations"],
    correctAnswer: 2
  },
  {
    question: "What is the main challenge with FHE?",
    options: ["Key management", "Performance overhead", "Compatibility", "Ease of use"],
    correctAnswer: 1
  },
  {
    question: "Why is FHE important for privacy?",
    options: ["It makes data smaller", "It allows computation without revealing data", "It speeds up processing", "It simplifies coding"],
    correctAnswer: 1
  },
  {
    question: "What year was FHE first proposed?",
    options: ["1978", "1985", "2009", "2015"],
    correctAnswer: 0
  },
  {
    question: "Which mathematical problem is FHE typically based on?",
    options: ["Integer factorization", "Lattice problems", "Discrete logarithm", "Elliptic curves"],
    correctAnswer: 1
  },
  {
    question: "What is bootstrapping in FHE?",
    options: ["Starting a new encryption", "Reducing noise in ciphertext to enable more operations", "Connecting to blockchain", "Initial key generation"],
    correctAnswer: 1
  },
  {
    question: "Which company is Zama?",
    options: ["A blockchain company", "An FHE research and development company", "A hardware manufacturer", "A cloud provider"],
    correctAnswer: 1
  },
  {
    question: "What is tfhe-rs?",
    options: ["A Rust implementation of FHE", "A Python library", "A JavaScript framework", "A Solidity compiler"],
    correctAnswer: 0
  },
  {
    question: "Can FHE encrypt floating point numbers?",
    options: ["No, only integers", "Yes, with proper encoding", "Only positive numbers", "Only small numbers"],
    correctAnswer: 1
  },
  {
    question: "What is the primary trade-off in FHE?",
    options: ["Security vs speed", "Privacy vs performance", "Cost vs features", "Simplicity vs functionality"],
    correctAnswer: 1
  },
  {
    question: "What does FHEVM enable on Ethereum?",
    options: ["Faster transactions", "Private smart contract execution", "Lower gas fees", "Bigger block sizes"],
    correctAnswer: 1
  },
  {
    question: "What is a relayer in FHE context?",
    options: ["A node validator", "A service that helps encrypt/decrypt for FHE operations", "A bridge between chains", "A wallet provider"],
    correctAnswer: 1
  },
  {
    question: "Which operations are homomorphic?",
    options: ["Addition and multiplication", "Division and subtraction", "All arithmetic operations", "Only addition"],
    correctAnswer: 0
  },
  {
    question: "What is ciphertext in FHE?",
    options: ["The encrypted data", "The decryption key", "The algorithm name", "The blockchain address"],
    correctAnswer: 0
  },
  {
    question: "Can FHE be used for comparisons?",
    options: ["No, only arithmetic", "Yes, with proper encoding", "Only for equality", "Only in some schemes"],
    correctAnswer: 1
  },
  {
    question: "What is the difference between FHE and traditional encryption?",
    options: ["FHE allows computation on encrypted data", "FHE is faster", "FHE uses smaller keys", "FHE doesn't need keys"],
    correctAnswer: 0
  },
  {
    question: "What is Zama's fhEVM?",
    options: ["A virtual machine with FHE support", "A new blockchain", "A programming language", "A wallet"],
    correctAnswer: 0
  },
  {
    question: "Why is FHE slower than regular computation?",
    options: ["Complex encryption schemes and larger ciphertexts", "Network latency", "Blockchain consensus", "Key management overhead"],
    correctAnswer: 0
  },
  {
    question: "What is noise in FHE?",
    options: ["Random values added during encryption for security", "Network interference", "Encoding errors", "Compression artifacts"],
    correctAnswer: 0
  },
  {
    question: "Can FHE be used for machine learning?",
    options: ["Yes, for privacy-preserving ML", "No, it's too slow", "Only for small models", "Only for classification"],
    correctAnswer: 0
  },
  {
    question: "What is the role of public key in FHE?",
    options: ["Used for encryption and computation", "Only for encryption", "Only for decryption", "For key exchange"],
    correctAnswer: 0
  },
  {
    question: "Which industries can benefit from FHE?",
    options: ["Healthcare, finance, and any privacy-sensitive field", "Only blockchain", "Only research", "Only government"],
    correctAnswer: 0
  },
  {
    question: "What is secure computation?",
    options: ["Computing on encrypted data without revealing inputs", "Using secure networks", "Encrypting results", "Secure key storage"],
    correctAnswer: 0
  },
  {
    question: "How does FHE compare to secure multi-party computation?",
    options: ["FHE allows single-party computation on encrypted data", "They are the same", "FHE is faster", "MPC is always better"],
    correctAnswer: 0
  }
]

// Default questions for the main test
const ZAMA_QUESTIONS: Question[] = QUESTION_POOL.slice(0, 10)

// Helper function to get random questions from pool
const getRandomQuestions = (count: number): Question[] => {
  const shuffled = [...QUESTION_POOL].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, QUESTION_POOL.length))
}

export default function ZamaLearning() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { switchChain } = useSwitchChain()
  const chainId = useChainId()
  const { data: balance } = useBalance({
    address: address,
    chainId: sepolia.id,
  })
  
  const [activeTab, setActiveTab] = useState<Tab>('ABOUT')
  const [relayerInstance, setRelayerInstance] = useState<any>(null)
  const [isRelayerLoading, setIsRelayerLoading] = useState(false)
  
  // test state
  const [currentTestId, setCurrentTestId] = useState<number | null>(null) // ID of test being taken
  const [currentTestQuestions, setCurrentTestQuestions] = useState<Question[]>(ZAMA_QUESTIONS) // Questions for current test
  const [testAnswers, setTestAnswers] = useState<number[]>(new Array(10).fill(-1))
  const [testSubmitted, setTestSubmitted] = useState(false)
  const [testScore, setTestScore] = useState<number | null>(null)
  const [isSubmittingScore, setIsSubmittingScore] = useState(false)
  const [showResults, setShowResults] = useState(false)
  
  // my tests
  const [myTests, setMyTests] = useState<Test[]>([])
  const [activeTests, setActiveTests] = useState<Test[]>([])
  const [completedTests, setCompletedTests] = useState<Test[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // create test form
  const [testTitle, setTestTitle] = useState<string>('')
  const [testDescription, setTestDescription] = useState<string>('')
  const [questionCount, setQuestionCount] = useState<string>('10')
  const [maxScore, setMaxScore] = useState<string>('100')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initRelayer()
    }
  }, [])

  useEffect(() => {
    if (isConnected && chainId !== sepolia.id) {
      switchChain({ chainId: sepolia.id })
    }
  }, [isConnected, chainId, switchChain])

  useEffect(() => {
    // Always load active tests (can work without wallet)
    loadActiveTests()
    
    // Only load user-specific data if wallet is connected
    if (isConnected && address) {
      loadMyTests()
      loadCompletedTests()
    }
  }, [isConnected, address])

  // initialize FHE relayer for encrypting test scores
  const initRelayer = async () => {
    setIsRelayerLoading(true)
    try {
      const relayerModule: any = await Promise.race([
        import('@zama-fhe/relayer-sdk/web'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Relayer load timeout')), 10000))
      ])

      const sdkInitialized = await Promise.race([
        relayerModule.initSDK(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('SDK init timeout')), 10000))
      ])
      
      if (!sdkInitialized) {
        throw new Error('SDK initialization failed')
      }

      const instance = await Promise.race([
        relayerModule.createInstance(relayerModule.SepoliaConfig),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Instance creation timeout')), 10000))
      ])
      
      setRelayerInstance(instance)
    } catch (error) {
      console.error('Failed to initialize relayer:', error)
    } finally {
      setIsRelayerLoading(false)
    }
  }

  const getEthersSigner = async () => {
    if (walletClient) {
      try {
        return await walletClientToSigner(walletClient)
      } catch (err) {
        console.warn('Wallet client failed, trying fallback:', err)
      }
    }
    return await getSigner()
  }

  // start taking a test
  const startTest = (testId: number) => {
    // Load questions for this test
    const storedQuestions = getStoredTestQuestions(testId)
    
    if (storedQuestions && storedQuestions.length > 0) {
      setCurrentTestQuestions(storedQuestions)
      setCurrentTestId(testId)
      setTestAnswers(new Array(storedQuestions.length).fill(-1))
      setShowResults(false)
      setTestScore(null)
      setTestSubmitted(false)
      setActiveTab('LEARN')
    } else if (testId === 0) {
      // Default test
      setCurrentTestQuestions(ZAMA_QUESTIONS)
      setCurrentTestId(0)
      setTestAnswers(new Array(ZAMA_QUESTIONS.length).fill(-1))
      setShowResults(false)
      setTestScore(null)
      setTestSubmitted(false)
      setActiveTab('LEARN')
    } else {
      alert('Questions for this test are not available. Please recreate the test.')
    }
  }

  // calculate test score based on answers
  const calculateScore = (): number => {
    let correct = 0
    testAnswers.forEach((answer, index) => {
      if (answer === currentTestQuestions[index].correctAnswer) {
        correct++
      }
    })
    return Math.round((correct / currentTestQuestions.length) * 100)
  }

  // check if test exists and create default test if needed
  const ensureDefaultTestExists = async (): Promise<number> => {
    const signer = await getEthersSigner()
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
    
    try {
      // Try to get test 0
      const testData = await contract.getTest(0)
      if (testData.creator !== ethers.ZeroAddress && testData.isActive) {
        return 0
      }
    } catch (e) {
      // Test doesn't exist, create it
    }
    
    // Create default test
    const tx = await contract.createTest(
      'FHE Knowledge Test',
      'Test your knowledge of Fully Homomorphic Encryption and Zama technology',
      10,
      100
    )
    const receipt = await tx.wait()
    
    // Get test ID from event
    const event = receipt.logs?.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log)
        return parsed?.name === 'TestCreated'
      } catch {
        return false
      }
    })
    
    if (event) {
      const parsed = contract.interface.parseLog(event)
      return Number(parsed?.args?.testId || 0)
    }
    
    // Fallback: get latest test ID from counter
    const testCounter = await contract.testCounter()
    return Number(testCounter) - 1
  }

  // submit test results
  const submitTestResults = async () => {
    if (!address || !isConnected) {
      alert('Please connect your wallet to submit results')
      return
    }
    
    if (!relayerInstance) {
      alert('FHE relayer is still loading. Please wait a moment and try again.')
      return
    }
    
    const score = calculateScore()
    setTestScore(score)
    setShowResults(true)
    
    try {
      setIsSubmittingScore(true)
      
      // Use current test ID or ensure default test exists
      let testId = currentTestId !== null ? currentTestId : await ensureDefaultTestExists()
      if (testId === null) {
        testId = await ensureDefaultTestExists()
      }
      
      // encrypt the score using FHE
      const inputBuilder = relayerInstance.createEncryptedInput(
        CONTRACT_ADDRESS,
        address
      )
      
      inputBuilder.add32(score)
      
      const encryptedInput = await Promise.race([
        inputBuilder.encrypt(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Encryption timeout')), 30000)
        )
      ]) as any
      
      if (!encryptedInput?.handles || encryptedInput.handles.length === 0) {
        throw new Error('Encryption failed')
      }
      
      const encryptedScore = encryptedInput.handles[0]
      const attestation = encryptedInput.inputProof || '0x'
      
      const signer = await getEthersSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      
      // Estimate gas first to catch errors early
      try {
        await contract.submitScore.estimateGas(
          testId,
          encryptedScore,
          attestation
        )
      } catch (estimateError: any) {
        console.error('Gas estimation failed:', estimateError)
        throw new Error(`Transaction will fail: ${estimateError.reason || estimateError.message || 'Unknown error'}`)
      }
      
      const tx = await contract.submitScore(
        testId,
        encryptedScore,
        attestation
      )
      
      await tx.wait()
      
      // save score locally
      storeScore(testId, score)
      
      await loadCompletedTests()
      await loadActiveTests()
      
      alert('Score submitted successfully!')
    } catch (error: any) {
      console.error('Failed to submit score:', error)
      const errorMessage = error.reason || error.message || 'Unknown error'
      alert(`Failed to submit score: ${errorMessage}`)
    } finally {
      setIsSubmittingScore(false)
    }
  }

  // reset test to retake
  const resetTest = () => {
    const questionCount = currentTestQuestions.length
    setTestAnswers(new Array(questionCount).fill(-1))
    setTestSubmitted(false)
    setTestScore(null)
    setShowResults(false)
  }

  // store score locally so user can see it
  const storeScore = (testId: number, score: number) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(`test_score_${testId}`, score.toString())
    } catch (e) {
      console.error('Failed to store score:', e)
    }
  }

  // get stored score
  const getStoredScore = (testId: number): number | undefined => {
    if (typeof window === 'undefined') return undefined
    try {
      const stored = localStorage.getItem(`test_score_${testId}`)
      return stored ? parseInt(stored) : undefined
    } catch {
      return undefined
    }
  }

  // store test questions locally
  const storeTestQuestions = (testId: number, questions: Question[]) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(`test_questions_${testId}`, JSON.stringify(questions))
    } catch (e) {
      console.error('Failed to store questions:', e)
    }
  }

  // get stored test questions
  const getStoredTestQuestions = (testId: number): Question[] | null => {
    if (typeof window === 'undefined') return null
    try {
      const stored = localStorage.getItem(`test_questions_${testId}`)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  // load tests created by user
  const loadMyTests = async () => {
    if (!address || !isConnected) return
    
    setIsLoading(true)
    try {
      const signer = await getEthersSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      
      const testIds = await contract.getUserTests(address)
      const tests: Test[] = []
      
      for (const testId of testIds) {
        const testData = await contract.getTest(testId)
        
        tests.push({
          id: Number(testId),
          title: testData.title,
          description: testData.description,
          questionCount: Number(testData.questionCount),
          maxScore: Number(testData.maxScore),
          createdAt: Number(testData.createdAt),
          isActive: testData.isActive,
          creator: testData.creator,
        })
      }
      
      setMyTests(tests.reverse())
    } catch (error) {
      console.error('Failed to load tests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // load active tests
  const loadActiveTests = async () => {
    try {
      // Use read-only provider if wallet not connected, otherwise use signer
      let contract: ethers.Contract
      if (address && isConnected) {
        const signer = await getEthersSigner()
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      } else {
        const provider = getReadOnlyProvider()
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
      }
      
      const testIds = await contract.getActiveTests(50)
      const tests: Test[] = []
      
      for (const testId of testIds) {
        const testData = await contract.getTest(testId)
        let attemptCount = 0
        if (address && isConnected) {
          try {
            attemptCount = Number(await contract.getUserAttemptCount(testId, address))
          } catch (e) {
            // ignore errors
          }
        }
        const storedScore = address ? getStoredScore(Number(testId)) : undefined
        
        tests.push({
          id: Number(testId),
          title: testData.title,
          description: testData.description,
          questionCount: Number(testData.questionCount),
          maxScore: Number(testData.maxScore),
          createdAt: Number(testData.createdAt),
          isActive: testData.isActive,
          creator: testData.creator,
          attemptCount: attemptCount,
          myScore: storedScore,
        })
      }
      
      setActiveTests(tests)
    } catch (error) {
      console.error('Failed to load active tests:', error)
    }
  }

  // load completed tests
  const loadCompletedTests = async () => {
    if (!address || !isConnected) return
    
    try {
      const signer = await getEthersSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      
      const testIds = await contract.getUserCompletedTests(address)
      const tests: Test[] = []
      
      for (const testId of testIds) {
        const testData = await contract.getTest(testId)
        const attemptCount = await contract.getUserAttemptCount(testId, address)
        const storedScore = getStoredScore(Number(testId))
        
        tests.push({
          id: Number(testId),
          title: testData.title,
          description: testData.description,
          questionCount: Number(testData.questionCount),
          maxScore: Number(testData.maxScore),
          createdAt: Number(testData.createdAt),
          isActive: testData.isActive,
          creator: testData.creator,
          attemptCount: Number(attemptCount),
          myScore: storedScore,
        })
      }
      
      setCompletedTests(tests.reverse())
    } catch (error) {
      console.error('Failed to load completed tests:', error)
    }
  }

  // create new test with random questions
  const createTest = async () => {
    if (!address || !isConnected) {
      alert('Please connect your wallet to create a test')
      return
    }
    
    if (!testTitle.trim()) {
      alert('Please enter a test title')
      return
    }
    
    const qCount = parseInt(questionCount)
    const mScore = parseInt(maxScore)
    
    if (isNaN(qCount) || qCount <= 0) {
      alert('Question count must be a positive number')
      return
    }
    
    if (isNaN(mScore) || mScore <= 0) {
      alert('Max score must be a positive number')
      return
    }
    
    // Limit question count to available pool size
    const actualQCount = Math.min(qCount, QUESTION_POOL.length)
    
    try {
      setIsCreating(true)
      
      // Generate random questions from pool
      const randomQuestions = getRandomQuestions(actualQCount)
      
      const signer = await getEthersSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      
      const tx = await contract.createTest(
        testTitle.trim(),
        testDescription.trim() || `Random test with ${actualQCount} questions about FHE`,
        actualQCount,
        mScore
      )
      
      const receipt = await tx.wait()
      
      // Get test ID from event
      let newTestId = 0
      try {
        const event = receipt.logs?.find((log: any) => {
          try {
            const parsed = contract.interface.parseLog(log)
            return parsed?.name === 'TestCreated'
          } catch {
            return false
          }
        })
        
        if (event) {
          const parsed = contract.interface.parseLog(event)
          newTestId = Number(parsed?.args?.testId || 0)
        } else {
          // Fallback: get latest test ID from counter
          const testCounter = await contract.testCounter()
          newTestId = Number(testCounter) - 1
        }
      } catch (e) {
        console.error('Failed to get test ID, using counter:', e)
        const testCounter = await contract.testCounter()
        newTestId = Number(testCounter) - 1
      }
      
      // Store questions locally for this test
      if (newTestId > 0 || newTestId === 0) {
        storeTestQuestions(newTestId, randomQuestions)
      }
      
      // clear form
      setTestTitle('')
      setTestDescription('')
      setQuestionCount('10')
      setMaxScore('100')
      
      await loadMyTests()
      await loadActiveTests()
      
      alert(`Test created successfully with ${actualQCount} random questions!`)
      setActiveTab('ALL_TESTS')
    } catch (error: any) {
      console.error('Failed to create test:', error)
      alert(`Failed to create test: ${error.message || 'Unknown error'}`)
    } finally {
      setIsCreating(false)
    }
  }

  // deactivate test
  const deactivateTest = async (testId: number) => {
    if (!address || !isConnected) return
    
    if (!confirm('Are you sure you want to deactivate this test?')) return
    
    try {
      const signer = await getEthersSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      
      const tx = await contract.deactivateTest(testId)
      await tx.wait()
      
      await loadMyTests()
      await loadActiveTests()
      
      alert('Test deactivated')
    } catch (error: any) {
      console.error('Failed to deactivate test:', error)
      alert(`Failed to deactivate test: ${error.message || 'Unknown error'}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-red-900 to-black">
      {/* header */}
      <div className="bg-gray-900/90 backdrop-blur-xl border-b border-orange-500/30 sticky top-0 z-50 shadow-lg shadow-orange-500/20">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🔥</div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-red-500 to-orange-600 bg-clip-text text-transparent">
                  Learn & Burn
                </h1>
                <p className="text-sm text-gray-400">Master FHE with encrypted results</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {balance && isConnected && (
                <div className="text-sm text-orange-300 bg-gray-800/50 px-3 py-1.5 rounded-lg font-medium border border-orange-500/30">
                  {parseFloat(formatEther(balance.value)).toFixed(4)} ETH
                </div>
              )}
              <ConnectButton />
            </div>
          </div>
          
          {/* tabs */}
          <div className="flex gap-2 border-t border-orange-500/20 pt-4">
            {([
              { key: 'ABOUT', label: 'About this app' },
              { key: 'LEARN', label: 'Learn' },
              { key: 'PROGRESS', label: 'Your progress' },
              { key: 'CREATE', label: 'Create test' },
              { key: 'ALL_TESTS', label: 'All tests' }
            ] as { key: Tab; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === key
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-500/50'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-800 border border-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* about tab */}
        {activeTab === 'ABOUT' && (
          <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-orange-500/30">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent mb-6">About This App</h2>
            
            <div className="space-y-6 text-gray-300 leading-relaxed">
              <div>
                <h3 className="text-xl font-semibold text-orange-400 mb-3">What is Learn & Burn?</h3>
                <p>
                  Learn & Burn is an educational platform for learning Fully Homomorphic Encryption (FHE) technology. 
                  Take quizzes, test your knowledge, and track your progress. All test scores are encrypted using FHE 
                  before being stored on the blockchain, ensuring privacy while allowing you to see your own results.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-orange-400 mb-3">How It Works</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Study FHE concepts through our learning materials</li>
                  <li>Take quizzes to test your understanding</li>
                  <li>Your scores are encrypted using FHE before submission</li>
                  <li>View your progress and retake tests to improve</li>
                  <li>Create custom tests for others</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-orange-400 mb-3">Privacy First</h3>
                <p>
                  Your test scores are encrypted using Fully Homomorphic Encryption, meaning they can be stored 
                  and computed on-chain without revealing the actual scores. Only you can see your own results 
                  stored locally in your browser.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* learn tab */}
        {activeTab === 'LEARN' && (
          <div className="space-y-6">
            <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-orange-500/30">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent mb-6">About FHE</h2>
              
              <div className="space-y-6 text-gray-300 leading-relaxed">
                <div>
                  <h3 className="text-xl font-semibold text-orange-400 mb-3">What is FHE?</h3>
                  <p>
                    Fully Homomorphic Encryption (FHE) is a form of encryption that allows computation on encrypted data 
                    without decrypting it first. This means you can perform operations like addition and multiplication 
                    on encrypted data, and the result will also be encrypted.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-orange-400 mb-3">Why is FHE Important?</h3>
                  <p>
                    FHE enables privacy-preserving computation. You can outsource computation to third parties or perform 
                    operations on blockchain without revealing your data. This is especially valuable for sensitive data 
                    like financial records, medical information, or personal details.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-orange-400 mb-3">What is Zama?</h3>
                  <p>
                    Zama is a company that provides FHE solutions and tools. They developed FHEVM, which brings Fully 
                    Homomorphic Encryption to the Ethereum Virtual Machine, allowing private computation on blockchain.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-orange-400 mb-3">How FHE Works on Blockchain</h3>
                  <p>
                    With FHEVM, you can store encrypted data on-chain and perform computations on it. The blockchain 
                    executes operations on encrypted values, producing encrypted results. Only those with the decryption 
                    key can see the actual values, but the computation is verifiable on-chain.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-orange-400 mb-3">Key Features</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Privacy-preserving computation</li>
                    <li>On-chain encrypted data storage</li>
                    <li>Verifiable computation without revealing data</li>
                    <li>Support for addition and multiplication operations</li>
                    <li>Compatible with Ethereum ecosystem</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* test section */}
            <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-orange-500/30">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent mb-6">FHE Knowledge Test</h2>
              
              {!showResults ? (
                <div className="space-y-8">
                  {currentTestQuestions.map((q, index) => (
                    <div key={index} className="border-b border-gray-700 pb-6 last:border-0">
                      <h3 className="text-lg font-semibold text-orange-300 mb-4">
                        {index + 1}. {q.question}
                      </h3>
                      <div className="space-y-2">
                        {q.options.map((option, optIndex) => (
                          <label
                            key={optIndex}
                            className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                              testAnswers[index] === optIndex
                                ? 'bg-orange-900/50 border-2 border-orange-500'
                                : 'bg-gray-700/50 border-2 border-transparent hover:bg-gray-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${index}`}
                              value={optIndex}
                              checked={testAnswers[index] === optIndex}
                              onChange={() => {
                                const newAnswers = [...testAnswers]
                                newAnswers[index] = optIndex
                                setTestAnswers(newAnswers)
                              }}
                              className="mr-3"
                            />
                            <span className="text-gray-200">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => {
                      if (!isConnected || !address) {
                        alert('Please connect your wallet first')
                        return
                      }
                      const allAnswered = testAnswers.every(a => a !== -1)
                      if (!allAnswered) {
                        alert('Please answer all questions')
                        return
                      }
                      setTestSubmitted(true)
                      submitTestResults()
                    }}
                    disabled={testAnswers.some(a => a === -1) || isSubmittingScore || !isConnected || !relayerInstance}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-4 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/50 text-lg"
                  >
                    {!isConnected ? 'Connect Wallet First' : !relayerInstance ? 'Loading FHE...' : isSubmittingScore ? 'Submitting...' : '🔥 Submit Test'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-orange-900/50 to-red-900/50 border border-orange-500/30 rounded-lg p-6 text-center">
                    <div className="text-5xl mb-4">
                      {testScore !== null && testScore >= 80 ? '🔥' : testScore !== null && testScore >= 60 ? '⚡' : '📚'}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Test Complete!</h3>
                    <p className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent mb-2">
                      Your Score: {testScore}%
                    </p>
                    <p className="text-gray-300">
                      {testScore !== null && testScore >= 80 
                        ? 'Excellent! You know your FHE!' 
                        : testScore !== null && testScore >= 60 
                        ? 'Good job! Keep learning!' 
                        : 'Keep studying! You can retake the test.'}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-xl font-semibold text-orange-400">Review Your Answers:</h4>
                    {currentTestQuestions.map((q, index) => {
                      const userAnswer = testAnswers[index]
                      const isCorrect = userAnswer === q.correctAnswer
                      
                      return (
                        <div key={index} className={`border-2 rounded-lg p-4 ${isCorrect ? 'border-green-500/50 bg-green-900/20' : 'border-red-500/50 bg-red-900/20'}`}>
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-semibold text-white">{index + 1}. {q.question}</h5>
                            {isCorrect ? (
                              <span className="text-green-400 font-bold">✓ Correct</span>
                            ) : (
                              <span className="text-red-400 font-bold">✗ Wrong</span>
                            )}
                          </div>
                          <div className="space-y-1 text-sm">
                            <p className={userAnswer === q.correctAnswer ? 'text-green-300 font-medium' : 'text-gray-400'}>
                              Your answer: {q.options[userAnswer]}
                            </p>
                            {!isCorrect && (
                              <p className="text-green-300 font-medium">
                                Correct answer: {q.options[q.correctAnswer]}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      onClick={resetTest}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                    >
                      Retake Test
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* progress tab */}
        {activeTab === 'PROGRESS' && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent mb-5">Your Progress</h2>
            
            {!isConnected ? (
              <div className="text-center py-12 text-gray-400 bg-gray-800/60 rounded-2xl border border-orange-500/30">
                Connect your wallet to view your progress
              </div>
            ) : isLoading ? (
              <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : completedTests.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-gray-800/60 rounded-2xl border border-orange-500/30">
                You haven't completed any tests yet. Go to Learn tab to take the test!
              </div>
            ) : (
              <div className="grid gap-4">
                {completedTests.map((test) => (
                  <div
                    key={test.id}
                    className="bg-gray-800/60 backdrop-blur-xl rounded-xl shadow-lg p-6 border border-orange-500/30"
                  >
                    <div className="text-orange-300 font-semibold text-lg mb-2">
                      {test.title}
                    </div>
                    <div className="text-gray-400 text-sm space-y-1">
                      <div>Questions: {test.questionCount}</div>
                      {test.myScore !== undefined && (
                        <div className="text-orange-400 font-semibold text-lg mt-2">
                          Your score: {test.myScore}%
                        </div>
                      )}
                      {test.attemptCount !== undefined && (
                        <div>Attempts: {test.attemptCount}</div>
                      )}
                      <div>Completed: {new Date(test.createdAt * 1000).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* create test tab */}
        {activeTab === 'CREATE' && (
          <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-orange-500/30">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent mb-6 flex items-center gap-3">
              <span className="text-3xl">➕</span>
              Create New Test
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-orange-300 font-medium mb-2">Test Title</label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder="e.g., Advanced FHE Concepts"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-orange-300 font-medium mb-2">Description (optional)</label>
                <textarea
                  value={testDescription}
                  onChange={(e) => setTestDescription(e.target.value)}
                  placeholder="Describe what this test covers..."
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-orange-300 font-medium mb-2">
                    Number of Questions (max {QUESTION_POOL.length})
                  </label>
                  <input
                    type="number"
                    value={questionCount}
                    onChange={(e) => {
                      const val = e.target.value
                      const num = parseInt(val)
                      if (!isNaN(num) && num > QUESTION_POOL.length) {
                        setQuestionCount(QUESTION_POOL.length.toString())
                      } else {
                        setQuestionCount(val)
                      }
                    }}
                    min="1"
                    max={QUESTION_POOL.length}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Random questions will be selected from {QUESTION_POOL.length} available questions
                  </p>
                </div>
                <div>
                  <label className="block text-orange-300 font-medium mb-2">Maximum Score</label>
                  <input
                    type="number"
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                    min="1"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              {!isConnected && (
                <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-4 text-orange-300">
                  Connect your wallet to create a test
                </div>
              )}

              <button
                onClick={createTest}
                disabled={isCreating || !isConnected}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-3.5 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/50 text-lg"
              >
                {isCreating ? 'Creating Test...' : '🔥 Create Test'}
              </button>
            </div>
          </div>
        )}

        {/* all tests tab */}
        {activeTab === 'ALL_TESTS' && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent mb-5">All Tests</h2>
            
            {!isConnected ? (
              <div className="text-center py-12 text-gray-400 bg-gray-800/60 rounded-2xl border border-orange-500/30">
                Connect your wallet to view tests
              </div>
            ) : isLoading ? (
              <div className="text-center py-12 text-gray-400">Loading tests...</div>
            ) : activeTests.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-gray-800/60 rounded-2xl border border-orange-500/30">
                No active tests available
              </div>
            ) : (
              <div className="grid gap-4">
                {activeTests.map((test) => (
                  <div
                    key={test.id}
                    className="bg-gray-800/60 backdrop-blur-xl rounded-xl shadow-lg p-6 border border-orange-500/30 hover:border-orange-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="text-orange-300 font-semibold text-lg mb-2">
                          {test.title}
                        </div>
                        <div className="text-gray-400 text-sm space-y-1">
                          <div>{test.description || 'No description'}</div>
                          <div>Questions: {test.questionCount}</div>
                          <div>Max Score: {test.maxScore}</div>
                          <div>Created: {new Date(test.createdAt * 1000).toLocaleDateString()}</div>
                          {test.myScore !== undefined && (
                            <div className="text-orange-400 font-semibold mt-2">
                              Your score: {test.myScore}%
                            </div>
                          )}
                          {test.attemptCount !== undefined && test.attemptCount > 0 && (
                            <div>Attempts: {test.attemptCount}</div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => startTest(test.id)}
                        className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-5 py-2 rounded-lg font-medium shadow-lg shadow-orange-500/50 whitespace-nowrap ml-4"
                      >
                        Take Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
