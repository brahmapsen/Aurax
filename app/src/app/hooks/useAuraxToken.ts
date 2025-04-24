import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import contracts from '../contracts/AuraxToken.json';

// Define the ABI for the token contract
const AURAX_TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

// Get the contract address from the deployment
const AURAX_TOKEN_ADDRESS = contracts.address as `0x${string}`;

export function useAuraxToken() {
  const { address } = useAccount();
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [symbol, setSymbol] = useState<string>('AURX');
  const [decimals, setDecimals] = useState<number>(18);

  // Get native token balance
  const { data: nativeBalance } = useBalance({
    address,
    query: {
      enabled: !!address
    }
  });

  const fetchContractData = async () => {
    if (!address) return;

    try {
      const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
      const contract = new ethers.Contract(
        AURAX_TOKEN_ADDRESS,
        AURAX_TOKEN_ABI,
        provider
      );

      console.log('Fetching balance for address:', address);
      const balanceResult = await contract.balanceOf(address);
      console.log('Raw balance result:', balanceResult.toString());
      setBalance(balanceResult);

      const symbolResult = await contract.symbol();
      console.log('Symbol result:', symbolResult);
      setSymbol(symbolResult);

      const decimalsResult = await contract.decimals();
      console.log('Decimals result:', decimalsResult);
      setDecimals(decimalsResult);
    } catch (error) {
      console.error('Error fetching contract data:', error);
    }
  };

  // Fetch data on mount and when address changes
  useEffect(() => {
    fetchContractData();
  }, [address]);

  // Format balance with proper decimals
  const formattedBalance = balance ? Number(formatEther(balance)) : 0;

  return {
    balance: formattedBalance,
    nativeBalance: nativeBalance ? formatEther(nativeBalance.value) : '0',
    symbol,
    refetchBalance: fetchContractData,
  };
}   