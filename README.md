# Learn & Burn

Learn about Fully Homomorphic Encryption (FHE) and test your knowledge. Take quizzes, track your progress, and create your own tests. All test scores are encrypted before being saved to the blockchain.

## What it does

This app helps you learn about FHE technology. You can read educational content, take quizzes to see how much you know, and create your own tests with random questions. When you submit a test score, it gets encrypted using FHE so your actual score stays private while still being stored on the blockchain.

## Features

- Learn about FHE through simple educational content
- Take a 10-question quiz about FHE and Zama
- View your test scores and track your progress
- Create custom tests with random questions (30 questions available)
- All scores are encrypted using FHE before submission
- Retake tests and resubmit scores as many times as you want

## How to use

1. Connect your wallet (works on Sepolia testnet)
2. Click "Learn" to read about FHE
3. Take the test to check your knowledge
4. Check "Your progress" to see your scores
5. Click "Create test" to make your own test
6. Browse "All tests" to see available tests

## Setup

Install dependencies:

```bash
npm install
```

Create `.env.local` file:

```env
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
NEXT_PUBLIC_LEARNING_CONTRACT_ADDRESS=your_contract_address
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
PRIVATE_KEY=your_private_key_for_deployment
```

Run locally:

```bash
npm run dev
```

## Deploy contract

Deploy the smart contract to Sepolia:

```bash
npm run deploy:learning
```

The script will automatically update `.env.local` with the deployed contract address.

## Tech stack

- Next.js 14, React, TypeScript
- Tailwind CSS
- Zama FHEVM Relayer SDK
- Wagmi, RainbowKit
- Solidity smart contract
- Sepolia testnet

## License

MIT

