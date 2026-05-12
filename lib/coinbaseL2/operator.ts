/**
 * dreamy Operator — viem 기반 컨트랙트 클라이언트.
 *
 * Operator 는 dreamy 가 손님 대신 AuthCaptureEscrow 컨트랙트를 호출하는
 * 권한 있는 주체. 가스비를 우리가 부담하고, 손님은 서명만 함.
 *
 * 핵심 노트:
 *  - private key 는 Vercel env (`OPERATOR_PRIVATE_KEY`) 에서 받음. NEVER commit.
 *  - chain 은 환경변수 (`COINBASE_L2_NETWORK`) 로 mainnet/sepolia 전환.
 *  - viem 의 `walletClient` 가 컨트랙트 write 호출 담당, `publicClient` 가 read.
 *
 * 사용:
 *   const op = getOperator()
 *   const txHash = await op.authorize(paymentInfo, amount, collector, collectorData)
 *   const receipt = await op.waitForTx(txHash)
 */
import 'server-only'
import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
  type Chain,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base, baseSepolia } from 'viem/chains'
import { AUTH_CAPTURE_ESCROW_ABI } from './abi'
import { COINBASE_L2_CONTRACTS } from './constants'

export interface PaymentInfo {
  operator: Address
  payer: Address
  receiver: Address
  token: Address
  maxAmount: bigint
  authorizeBy: number       // uint48 — unix seconds
  authorizationExpiry: number  // uint48 — unix seconds
  feeBps: number            // uint16
  feeReceiver: Address
  salt: Hex                 // bytes32
}

function chainFromEnv(): Chain {
  const network = process.env.COINBASE_L2_NETWORK ?? 'sepolia'
  return network === 'mainnet' ? base : baseSepolia
}

function rpcUrlFromEnv(): string | undefined {
  // 사용자가 별도 RPC URL 제공하면 그거 (Alchemy/Infura 등). 기본은 viem 의 public RPC.
  return process.env.COINBASE_L2_RPC_URL
}

interface OperatorClient {
  publicClient: PublicClient
  walletClient: WalletClient
  account: Address
  authorize: (info: PaymentInfo, amount: bigint, collector: Address, collectorData: Hex) => Promise<Hex>
  capture: (info: PaymentInfo, amount: bigint) => Promise<Hex>
  voidAuth: (info: PaymentInfo) => Promise<Hex>
  refund: (info: PaymentInfo, amount: bigint, collector: Address, collectorData: Hex) => Promise<Hex>
  waitForTx: (hash: Hex) => Promise<{ status: 'success' | 'reverted'; blockNumber: bigint }>
}

let cached: OperatorClient | null = null

export function getOperator(): OperatorClient {
  if (cached) return cached

  const pk = process.env.OPERATOR_PRIVATE_KEY
  if (!pk) {
    throw new Error(
      'OPERATOR_PRIVATE_KEY missing. ' +
      'Generate an EOA, fund it with a few $ of Base ETH for gas, ' +
      'and add the private key to Vercel env as a Sensitive variable.',
    )
  }

  const account = privateKeyToAccount(pk.startsWith('0x') ? (pk as Hex) : (`0x${pk}` as Hex))
  const chain = chainFromEnv()
  const rpcUrl = rpcUrlFromEnv()
  const transport = rpcUrl ? http(rpcUrl) : http()

  const publicClient = createPublicClient({ chain, transport })
  const walletClient = createWalletClient({ chain, transport, account })

  const escrow = COINBASE_L2_CONTRACTS.authCaptureEscrow as Address

  cached = {
    publicClient,
    walletClient,
    account: account.address,

    async authorize(info, amount, collector, collectorData) {
      return walletClient.writeContract({
        chain,
        account,
        address: escrow,
        abi: AUTH_CAPTURE_ESCROW_ABI,
        functionName: 'authorize',
        args: [info, amount, collector, collectorData],
      })
    },

    async capture(info, amount) {
      return walletClient.writeContract({
        chain,
        account,
        address: escrow,
        abi: AUTH_CAPTURE_ESCROW_ABI,
        functionName: 'capture',
        args: [info, amount],
      })
    },

    async voidAuth(info) {
      return walletClient.writeContract({
        chain,
        account,
        address: escrow,
        abi: AUTH_CAPTURE_ESCROW_ABI,
        functionName: 'void',
        args: [info],
      })
    },

    async refund(info, amount, collector, collectorData) {
      return walletClient.writeContract({
        chain,
        account,
        address: escrow,
        abi: AUTH_CAPTURE_ESCROW_ABI,
        functionName: 'refund',
        args: [info, amount, collector, collectorData],
      })
    },

    async waitForTx(hash) {
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      return {
        status: receipt.status,
        blockNumber: receipt.blockNumber,
      }
    },
  }

  return cached
}

export function isCoinbaseL2Configured(): boolean {
  return Boolean(process.env.OPERATOR_PRIVATE_KEY)
}
