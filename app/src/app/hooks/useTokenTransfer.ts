import { ethers } from 'ethers';
import contracts from '../contracts/AuraxToken.json';
import { useState, useCallback } from 'react';

// Define the ABI for the token contract
const AURAX_TOKEN_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// Get the contract address from the deployment
const AURAX_TOKEN_ADDRESS = contracts.address as `0x${string}`;

// Get the contract owner's private key from environment variables
const CONTRACT_OWNER_PRIVATE_KEY = process.env.NEXT_PUBLIC_CONTRACT_OWNER_PRIVATE_KEY;

// Transfer function
async function transferTokens(toAddress: string, amount: string) {
  if (!CONTRACT_OWNER_PRIVATE_KEY) {
    throw new Error('Contract owner private key not configured');
  }

  // Create provider with specific RPC URL
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  console.log('Provider created');

  // Create wallet with contract owner's private key
  const ownerWallet = new ethers.Wallet(CONTRACT_OWNER_PRIVATE_KEY, provider);
  console.log('Owner wallet created with address:', ownerWallet.address);

  // Create contract instance with owner's signer
  const tokenContract = new ethers.Contract(
    AURAX_TOKEN_ADDRESS,
    AURAX_TOKEN_ABI,
    ownerWallet
  );
  console.log('Contract instance created at:', AURAX_TOKEN_ADDRESS);

  // Get decimals
  const decimals = await tokenContract.decimals();
  console.log('Token decimals:', decimals);

  // Check owner's balance first
  const ownerBalance = await tokenContract.balanceOf(ownerWallet.address);
  console.log('Owner balance:', ethers.formatUnits(ownerBalance, decimals), 'AURX');

  if (ownerBalance === 0n) {
    throw new Error('Contract owner has no tokens to transfer');
  }

  // Convert amount to proper units
  const tokenAmount = ethers.parseUnits(amount, decimals);
  if (tokenAmount > ownerBalance) {
    throw new Error(`Insufficient balance. Owner has ${ethers.formatUnits(ownerBalance, decimals)} AURX`);
  }

  console.log('Transferring', amount, 'tokens');
  console.log('From:', ownerWallet.address);
  console.log('To:', toAddress);
  console.log('Contract:', AURAX_TOKEN_ADDRESS);

  try {
    // Encode the transfer function data to verify it
    const data = tokenContract.interface.encodeFunctionData('transfer', [toAddress, tokenAmount]);
    console.log('Encoded transfer data:', data);

    // Send transfer transaction
    const tx = await tokenContract.transfer(toAddress, tokenAmount);
    console.log('Transaction sent:', tx.hash);

    // Wait for confirmation and get transaction details
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);

    // Get the transfer event from the receipt
    const transferEvent = receipt.logs.map(log => {
      try {
        return tokenContract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data
        });
      } catch (e) {
        return null;
      }
    }).find(event => event && event.name === 'Transfer');

    if (transferEvent) {
      console.log('Transfer event:', {
        from: transferEvent.args[0],
        to: transferEvent.args[1],
        amount: transferEvent.args[2].toString()
      });
    }

    return receipt;
  } catch (error) {
    console.error('Transfer error details:', error);
    throw error;
  }
}

export function useTokenTransfer() {
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendTokens = useCallback(async (toAddress: string) => {
    if (!toAddress) {
      setError('Recipient address is required');
      return;
    }

    try {
      setIsTransferring(true);
      setError(null);
      await transferTokens(toAddress, '100');
    } catch (err) {
      console.error('Error transferring tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to transfer tokens');
    } finally {
      setIsTransferring(false);
    }
  }, []);

  return {
    sendTokens,
    isTransferring,
    error
  };
} 