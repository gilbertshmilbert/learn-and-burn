# 🔥 Learn & Burn 🔥

<div align="center">

### Master Fully Homomorphic Encryption (FHE) through Interactive Learning

**An educational platform that combines blockchain technology with privacy-preserving encryption**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![FHE](https://img.shields.io/badge/FHE-Zama-orange?style=for-the-badge)](https://zama.ai/)
[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-627EEA?style=for-the-badge&logo=ethereum)](https://ethereum.org/)

**🌐 Live Demo:** [learn-and-burn.vercel.app](https://learn-and-burn.vercel.app)

</div>

---

## 📖 Table of Contents

- [🎯 Overview](#-overview)
- [✨ Key Features](#-key-features)
- [🔐 How FHE Works in This App](#-how-fhe-works-in-this-app)
- [🚀 Quick Start](#-quick-start)
- [📋 Smart Contract](#-smart-contract)
- [🛠 Tech Stack](#-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🎮 How to Use](#-how-to-use)
- [🔒 Security & Privacy](#-security--privacy)
- [📦 Deployment](#-deployment)

---

## 🎯 Overview

**Learn & Burn** is an innovative educational platform that teaches users about **Fully Homomorphic Encryption (FHE)** technology while demonstrating its practical implementation on the blockchain. Unlike traditional learning platforms where your scores are stored in plain text, Learn & Burn encrypts all test results using FHE before storing them on-chain, ensuring complete privacy while maintaining verifiability.

### What Makes This Special?

- 🔐 **Privacy-First**: Your test scores are encrypted using FHE technology - they remain private even when stored on a public blockchain
- 📚 **Interactive Learning**: Learn FHE concepts through educational content and hands-on quizzes
- 🎯 **Progress Tracking**: Track your learning journey with encrypted score history
- 🎨 **Custom Tests**: Create your own tests with randomized questions from a pool of 30+ FHE-related questions
- ⛓️ **Blockchain-Powered**: All data stored on Ethereum Sepolia testnet for transparency and permanence
- 🔄 **Unlimited Retakes**: Practice makes perfect - retake tests as many times as you want

---

## ✨ Key Features

### 📚 **Educational Content**

Learn about FHE technology through comprehensive educational materials:

- **What is FHE?** - Understanding Fully Homomorphic Encryption
- **Why FHE Matters** - Real-world applications and use cases
- **Zama & FHEVM** - Introduction to Zama's FHE solutions
- **Blockchain Integration** - How FHE works on Ethereum
- **Technical Details** - Key features and capabilities of FHE

All content is presented in an easy-to-understand format, perfect for both beginners and advanced users.

### 🎮 **Interactive Quizzes**

Test your knowledge with interactive quizzes:

- **Default FHE Knowledge Test** - 10 carefully crafted questions about FHE and Zama
- **Custom Tests** - Create tests with random questions from a pool of 30+ questions
- **Multiple Choice Format** - Easy-to-answer multiple choice questions
- **Instant Feedback** - See your results immediately after submission
- **Detailed Review** - Review correct and incorrect answers to learn from mistakes

### 🔐 **FHE Encryption**

**The core feature that makes this app special:**

- **Automatic Encryption**: All test scores are automatically encrypted using Zama FHEVM Relayer SDK
- **Client-Side Encryption**: Encryption happens in your browser before submission
- **Privacy-Preserving**: Scores are stored as encrypted FHE handles (bytes32) on-chain
- **No Decryption on-Chain**: The actual score values never appear in plain text on the blockchain
- **Local Storage**: Your decrypted scores are stored locally for your reference

**Technical Process:**
1. User completes test and gets a score (e.g., 85%)
2. Score is encrypted using FHE Relayer SDK
3. Encrypted handle (bytes32) and attestation are generated
4. Handle is converted to proper bytes32 format
5. Encrypted data is submitted to smart contract
6. Original score is stored locally in browser for display

### 📊 **Progress Tracking**

Monitor your learning journey:

- **Completed Tests**: View all tests you've completed
- **Score History**: See your scores for each attempt
- **Attempt Count**: Track how many times you've taken each test
- **Test Creation**: View all tests you've created
- **Timestamps**: See when tests were created and completed

### 🎨 **Custom Test Creation**

Create your own tests with ease:

- **Random Questions**: Select random questions from a pool of 30+ FHE-related questions
- **Custom Titles**: Give your test a meaningful title
- **Descriptions**: Add descriptions to explain what your test covers
- **Flexible Question Count**: Choose how many questions (up to 30)
- **Custom Max Score**: Set the maximum possible score
- **Active/Inactive**: Deactivate tests you no longer want to share

### 🔍 **Test Discovery**

Browse and discover tests:

- **All Active Tests**: View all available tests on the platform
- **Test Details**: See test descriptions, question counts, and creators
- **Your Scores**: View your scores on tests you've completed
- **Take Tests**: Start any active test with one click

---

## 🔐 How FHE Works in This App

### Understanding FHE in Learn & Burn

**Fully Homomorphic Encryption (FHE)** allows computations to be performed on encrypted data without decrypting it first. In Learn & Burn, this means your test scores can be stored and verified on the blockchain without ever revealing the actual score value.

### The Encryption Flow

```
User Score (85%)
    ↓
FHE Relayer SDK (Client-Side)
    ↓
Encrypted Handle (bytes32)
    ↓
Smart Contract (Blockchain)
    ↓
Stored Encrypted (Public but Private)
```

### Detailed Technical Process

#### 1. **Client-Side Encryption**

When you submit a test score:

```typescript
// Initialize FHE Relayer
const relayerInstance = await relayerModule.createInstance(relayerModule.SepoliaConfig)

// Create encrypted input
const inputBuilder = relayerInstance.createEncryptedInput(CONTRACT_ADDRESS, userAddress)

// Add score (euint32)
inputBuilder.add32(score) // e.g., 85

// Encrypt
const encryptedInput = await inputBuilder.encrypt()

// Get FHE handle
const encryptedScoreHandle = encryptedInput.handles[0]
```

#### 2. **Handle Conversion**

The FHE handle is converted to `bytes32` format:

```typescript
// Convert Uint8Array to bytes32 hex string
const bytes32Handle = '0x' + Array.from(handle)
  .map(b => b.toString(16).padStart(2, '0'))
  .join('')
  .padStart(64, '0')
```

#### 3. **Blockchain Storage**

The encrypted handle is stored on-chain:

```solidity
function submitScore(
    uint256 _testId,
    bytes32 _encryptedScore,  // FHE handle
    bytes calldata _attestation
) external {
    // Store encrypted handle
    testScores[_testId].push(TestScore({
        student: msg.sender,
        encryptedScore: _encryptedScore,
        // ... other fields
    }));
}
```

#### 4. **Privacy Benefits**

- ✅ **On-Chain Privacy**: Scores stored as encrypted handles, not plain values
- ✅ **No Decryption Required**: Blockchain operations work with encrypted data
- ✅ **Local Access**: Only you can see your decrypted scores (stored locally)
- ✅ **Verifiability**: Score submissions are verifiable on-chain without revealing values

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Web3 wallet (MetaMask, WalletConnect, etc.)
- Sepolia testnet ETH (for gas fees)
- WalletConnect Project ID (for wallet connection)

### Installation

1. **Clone the repository** (or download the project)

2. **Install dependencies:**

```bash
npm install
```

3. **Configure environment variables:**

Create a `.env.local` file in the root directory:

```env
# Blockchain Configuration
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Contract Address (will be set after deployment)
NEXT_PUBLIC_LEARNING_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# Wallet Connection
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Deployment (optional, for contract deployment)
PRIVATE_KEY=your_private_key_for_deployment
```

4. **Deploy the smart contract:**

```bash
npm run deploy:learning
```

The script will automatically:
- Compile the contract
- Deploy to Sepolia testnet
- Update `.env.local` with the contract address

5. **Run the development server:**

```bash
npm run dev
```

6. **Open your browser:**

Navigate to [http://localhost:3000](http://localhost:3000)

### Getting Test ETH

You'll need Sepolia testnet ETH for gas fees:

1. Visit a Sepolia faucet (e.g., [sepoliafaucet.com](https://sepoliafaucet.com))
2. Enter your wallet address
3. Request test ETH
4. Wait for confirmation

---

## 📋 Smart Contract

### ZamaLearning Contract

The heart of Learn & Burn is the `ZamaLearning` smart contract deployed on Ethereum Sepolia testnet.

#### Contract Address

Deploy the contract using:

```bash
npm run deploy:learning
```

The contract address will be displayed and saved to `.env.local`.

#### Key Functions

##### **Test Management**

```solidity
// Create a new test
function createTest(
    string memory _title,
    string memory _description,
    uint256 _questionCount,
    uint256 _maxScore
) external returns (uint256)

// Deactivate a test (only creator)
function deactivateTest(uint256 _testId) external
```

##### **Score Submission**

```solidity
// Submit encrypted test score
function submitScore(
    uint256 _testId,
    bytes32 _encryptedScore,      // FHE handle (bytes32)
    bytes calldata _attestation   // FHE attestation
) external
```

##### **Data Retrieval**

```solidity
// Get test details
function getTest(uint256 _testId) external view returns (
    address creator,
    string memory title,
    string memory description,
    uint256 questionCount,
    uint256 maxScore,
    uint256 createdAt,
    bool isActive
)

// Get all scores for a test
function getTestScores(uint256 _testId) external view returns (TestScore[] memory)

// Get user's attempt count
function getUserAttemptCount(uint256 _testId, address _user) external view returns (uint256)

// Get all active tests
function getActiveTests(uint256 _limit) external view returns (uint256[])
```

#### Data Structures

```solidity
struct Test {
    address creator;
    string title;
    string description;
    uint256 questionCount;
    uint256 maxScore;
    uint256 createdAt;
    bool isActive;
}

struct TestScore {
    address student;
    uint256 testId;
    bytes32 encryptedScore;  // FHE handle - encrypted score
    uint256 submittedAt;
    uint256 attemptNumber;
}
```

#### Events

```solidity
event TestCreated(
    uint256 indexed testId,
    address indexed creator,
    string title,
    uint256 questionCount,
    uint256 maxScore
)

event ScoreSubmitted(
    uint256 indexed testId,
    address indexed student,
    bytes32 encryptedScore,
    uint256 attemptNumber
)

event TestDeactivated(
    uint256 indexed testId,
    address indexed creator
)
```

---

## 🛠 Tech Stack

### Frontend

- **Next.js 14** - React framework with App Router for modern web development
- **React 18** - UI library for building interactive components
- **TypeScript 5.0** - Type-safe JavaScript for better development experience
- **Tailwind CSS** - Utility-first CSS framework for rapid styling

### Blockchain & Web3

- **Ethereum Sepolia** - Test network for development and testing
- **Wagmi 2.0** - React hooks for Ethereum interactions
- **RainbowKit 2.0** - Beautiful wallet connection UI
- **Viem 2.0** - TypeScript interface for Ethereum
- **Ethers.js 6.9** - Ethereum JavaScript library

### FHE & Encryption

- **@zama-fhe/relayer-sdk** (v0.3.0-6) - Zama FHEVM Relayer SDK for client-side encryption
- **FHE Relayer** - Service for handling FHE operations

### Development Tools

- **Hardhat** - Ethereum development environment
- **Solidity 0.8.20** - Smart contract programming language
- **ESLint** - Code linting and quality
- **TypeScript** - Static type checking

---

## 📁 Project Structure

```
learn-and-burn/
├── app/                          # Next.js app directory
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Home page
│   ├── providers.tsx            # Web3 providers setup
│   └── globals.css              # Global styles
│
├── components/                   # React components
│   └── ZamaLearning.tsx         # Main application component
│
├── contracts/                    # Smart contracts
│   └── ZamaLearning.sol         # Main smart contract
│
├── lib/                          # Utilities
│   └── provider.ts              # Ethereum provider helpers
│
├── scripts/                      # Deployment scripts
│   └── deploy-learning.js       # Contract deployment script
│
├── .env.local                    # Environment variables (not in git)
├── hardhat.config.ts            # Hardhat configuration
├── next.config.js               # Next.js configuration
├── package.json                 # Dependencies and scripts
├── tailwind.config.ts           # Tailwind CSS configuration
└── tsconfig.json                # TypeScript configuration
```

---

## 🎮 How to Use

### For Learners

1. **Connect Your Wallet**
   - Click "Connect Wallet" in the header
   - Choose your preferred wallet (MetaMask, WalletConnect, etc.)
   - Switch to Sepolia testnet if prompted

2. **Learn About FHE**
   - Navigate to the "Learn" tab
   - Read the educational content about FHE
   - Understand the concepts before taking the test

3. **Take the Test**
   - Click "Take Test" on any available test
   - Answer all questions
   - Click "Submit Test" when done
   - Your score will be encrypted and submitted to the blockchain

4. **Track Your Progress**
   - Go to "Your progress" tab
   - View all tests you've completed
   - See your scores and attempt counts
   - Retake tests to improve your score

### For Test Creators

1. **Create a Test**
   - Navigate to "Create test" tab
   - Enter a test title and description
   - Choose number of questions (1-30)
   - Set maximum score
   - Click "Create Test"

2. **Manage Your Tests**
   - View your created tests in "Your progress"
   - Deactivate tests you no longer want active
   - Share test IDs with others

3. **Customize Questions**
   - Questions are randomly selected from a pool
   - Each test gets unique random questions
   - Questions cover various FHE topics

---

## 🔒 Security & Privacy

### Privacy Features

- **FHE Encryption**: All scores encrypted before blockchain submission
- **No Plain Text**: Scores never appear in plain text on-chain
- **Local Storage**: Decrypted scores stored only in your browser
- **Private Keys**: Your wallet private key never leaves your device

### Security Measures

- **Wallet Integration**: Secure wallet connection via RainbowKit
- **Transaction Signing**: All transactions require explicit wallet approval
- **Gas Estimation**: Gas estimation before transactions to prevent failures
- **Error Handling**: Comprehensive error handling for all operations

### Blockchain Benefits

- **Transparency**: All test submissions are verifiable on-chain
- **Immutability**: Once submitted, scores cannot be altered
- **Decentralization**: No central server storing your data
- **Permanence**: Data stored on blockchain persists

---

## 📦 Deployment

### Deploy Smart Contract

```bash
npm run deploy:learning
```

This will:
1. Compile the Solidity contract
2. Deploy to Sepolia testnet
3. Update `.env.local` with the contract address

### Deploy Frontend to Vercel

1. **Install Vercel CLI** (if not installed):

```bash
npm i -g vercel
```

2. **Login to Vercel**:

```bash
vercel login
```

3. **Deploy**:

```bash
vercel --prod
```

4. **Set Environment Variables** in Vercel dashboard:
   - `NEXT_PUBLIC_LEARNING_CONTRACT_ADDRESS`
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
   - `SEPOLIA_RPC_URL`

---

## 🎓 Learning Resources

### About FHE

- **Official Zama Documentation**: [docs.zama.ai](https://docs.zama.ai)
- **FHEVM Documentation**: [docs.zama.ai/fhevm](https://docs.zama.ai/fhevm)
- **Zama Blog**: [zama.ai/blog](https://zama.ai/blog)

### About Blockchain

- **Ethereum Foundation**: [ethereum.org](https://ethereum.org)
- **Sepolia Faucet**: [sepoliafaucet.com](https://sepoliafaucet.com)
- **Etherscan Sepolia**: [sepolia.etherscan.io](https://sepolia.etherscan.io)

---

## 🤝 Contributing

This is an educational project demonstrating FHE technology. Feel free to:

- Fork the repository
- Create custom tests
- Improve the educational content
- Add new features
- Report bugs

---

## 📄 License

MIT License - feel free to use this project for learning and educational purposes.

---

## 🙏 Acknowledgments

- **Zama** for providing FHEVM and the Relayer SDK
- **Ethereum Foundation** for the Ethereum blockchain
- **Next.js Team** for the amazing framework
- **RainbowKit** for beautiful wallet UI

---

<div align="center">

**Built with 🔥 by the Learn & Burn team**

**Start Learning FHE Today!** 🚀

[🌐 Live Demo](https://learn-and-burn.vercel.app) | [📚 Documentation](https://docs.zama.ai) | [🐛 Report Issues](#)

</div>
