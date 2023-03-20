import { getFirstSigner } from "../../helpers/helpers";
import { validateBaseEnvs } from "../utils/validation";
import { ethers } from "hardhat";
import { toBN, toBytes32 } from "../../test/utils";

const GOV_ABI = [
  {
    inputs: [
      { internalType: "address", name: "governanceStrategy", type: "address" },
      { internalType: "uint256", name: "votingDelay", type: "uint256" },
      { internalType: "address", name: "guardian", type: "address" },
      { internalType: "address[]", name: "executors", type: "address[]" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "address", name: "executor", type: "address" }],
    name: "ExecutorAuthorized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "address", name: "executor", type: "address" }],
    name: "ExecutorUnauthorized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "newStrategy", type: "address" },
      { indexed: true, internalType: "address", name: "initiatorChange", type: "address" },
    ],
    name: "GovernanceStrategyChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
      { indexed: true, internalType: "address", name: "newOwner", type: "address" },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "uint256", name: "id", type: "uint256" }],
    name: "ProposalCanceled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "id", type: "uint256" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: true, internalType: "contract IExecutorWithTimelock", name: "executor", type: "address" },
      { indexed: false, internalType: "address[]", name: "targets", type: "address[]" },
      { indexed: false, internalType: "uint256[]", name: "values", type: "uint256[]" },
      { indexed: false, internalType: "string[]", name: "signatures", type: "string[]" },
      { indexed: false, internalType: "bytes[]", name: "calldatas", type: "bytes[]" },
      { indexed: false, internalType: "bool[]", name: "withDelegatecalls", type: "bool[]" },
      { indexed: false, internalType: "uint256", name: "startBlock", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "endBlock", type: "uint256" },
      { indexed: false, internalType: "address", name: "strategy", type: "address" },
      { indexed: false, internalType: "bytes32", name: "ipfsHash", type: "bytes32" },
    ],
    name: "ProposalCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "id", type: "uint256" },
      { indexed: true, internalType: "address", name: "initiatorExecution", type: "address" },
    ],
    name: "ProposalExecuted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "id", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "executionTime", type: "uint256" },
      { indexed: true, internalType: "address", name: "initiatorQueueing", type: "address" },
    ],
    name: "ProposalQueued",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "id", type: "uint256" },
      { indexed: true, internalType: "address", name: "voter", type: "address" },
      { indexed: false, internalType: "bool", name: "support", type: "bool" },
      { indexed: false, internalType: "uint256", name: "votingPower", type: "uint256" },
    ],
    name: "VoteEmitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "newVotingDelay", type: "uint256" },
      { indexed: true, internalType: "address", name: "initiatorChange", type: "address" },
    ],
    name: "VotingDelayChanged",
    type: "event",
  },
  {
    inputs: [],
    name: "DOMAIN_TYPEHASH",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "NAME",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "VOTE_EMITTED_TYPEHASH",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [], name: "__abdicate", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [{ internalType: "address[]", name: "executors", type: "address[]" }],
    name: "authorizeExecutors",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "cancel",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract IExecutorWithTimelock", name: "executor", type: "address" },
      { internalType: "address[]", name: "targets", type: "address[]" },
      { internalType: "uint256[]", name: "values", type: "uint256[]" },
      { internalType: "string[]", name: "signatures", type: "string[]" },
      { internalType: "bytes[]", name: "calldatas", type: "bytes[]" },
      { internalType: "bool[]", name: "withDelegatecalls", type: "bool[]" },
      { internalType: "bytes32", name: "ipfsHash", type: "bytes32" },
    ],
    name: "create",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "execute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "getGovernanceStrategy",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getGuardian",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "getProposalById",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "contract IExecutorWithTimelock", name: "executor", type: "address" },
          { internalType: "address[]", name: "targets", type: "address[]" },
          { internalType: "uint256[]", name: "values", type: "uint256[]" },
          { internalType: "string[]", name: "signatures", type: "string[]" },
          { internalType: "bytes[]", name: "calldatas", type: "bytes[]" },
          { internalType: "bool[]", name: "withDelegatecalls", type: "bool[]" },
          { internalType: "uint256", name: "startBlock", type: "uint256" },
          { internalType: "uint256", name: "endBlock", type: "uint256" },
          { internalType: "uint256", name: "executionTime", type: "uint256" },
          { internalType: "uint256", name: "forVotes", type: "uint256" },
          { internalType: "uint256", name: "againstVotes", type: "uint256" },
          { internalType: "bool", name: "executed", type: "bool" },
          { internalType: "bool", name: "canceled", type: "bool" },
          { internalType: "address", name: "strategy", type: "address" },
          { internalType: "bytes32", name: "ipfsHash", type: "bytes32" },
        ],
        internalType: "struct IAaveGovernanceV2.ProposalWithoutVotes",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "getProposalState",
    outputs: [{ internalType: "enum IAaveGovernanceV2.ProposalState", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getProposalsCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "proposalId", type: "uint256" },
      { internalType: "address", name: "voter", type: "address" },
    ],
    name: "getVoteOnProposal",
    outputs: [
      {
        components: [
          { internalType: "bool", name: "support", type: "bool" },
          { internalType: "uint248", name: "votingPower", type: "uint248" },
        ],
        internalType: "struct IAaveGovernanceV2.Vote",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getVotingDelay",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "executor", type: "address" }],
    name: "isExecutorAuthorized",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "queue",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  { inputs: [], name: "renounceOwnership", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [{ internalType: "address", name: "governanceStrategy", type: "address" }],
    name: "setGovernanceStrategy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "votingDelay", type: "uint256" }],
    name: "setVotingDelay",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "proposalId", type: "uint256" },
      { internalType: "bool", name: "support", type: "bool" },
    ],
    name: "submitVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "proposalId", type: "uint256" },
      { internalType: "bool", name: "support", type: "bool" },
      { internalType: "uint8", name: "v", type: "uint8" },
      { internalType: "bytes32", name: "r", type: "bytes32" },
      { internalType: "bytes32", name: "s", type: "bytes32" },
    ],
    name: "submitVoteBySignature",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address[]", name: "executors", type: "address[]" }],
    name: "unauthorizeExecutors",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
const DAI_ABI = [
  {
    inputs: [
      { internalType: "string", name: "name_", type: "string" },
      { internalType: "string", name: "symbol_", type: "string" },
      { internalType: "uint8", name: "decimals_", type: "uint8" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "owner", type: "address" },
      { indexed: true, internalType: "address", name: "spender", type: "address" },
      { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "subtractedValue", type: "uint256" },
    ],
    name: "decreaseAllowance",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "addedValue", type: "uint256" },
    ],
    name: "increaseAllowance",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "bool", name: "permit", type: "bool" },
    ],
    name: "permitMint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "permitted",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint8", name: "newDecimals", type: "uint8" }],
    name: "setDecimals",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
];
const OVM_L1_MESSENGER_ABI_OLD = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: "bytes32", name: "msgHash", type: "bytes32" }],
    name: "FailedRelayedMessage",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: "bytes32", name: "_xDomainCalldataHash", type: "bytes32" }],
    name: "MessageAllowed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: "bytes32", name: "_xDomainCalldataHash", type: "bytes32" }],
    name: "MessageBlocked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
      { indexed: true, internalType: "address", name: "newOwner", type: "address" },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "address", name: "account", type: "address" }],
    name: "Paused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: "bytes32", name: "msgHash", type: "bytes32" }],
    name: "RelayedMessage",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "target", type: "address" },
      { indexed: false, internalType: "address", name: "sender", type: "address" },
      { indexed: false, internalType: "bytes", name: "message", type: "bytes" },
      { indexed: false, internalType: "uint256", name: "messageNonce", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "gasLimit", type: "uint256" },
    ],
    name: "SentMessage",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "address", name: "account", type: "address" }],
    name: "Unpaused",
    type: "event",
  },
  {
    inputs: [{ internalType: "bytes32", name: "_xDomainCalldataHash", type: "bytes32" }],
    name: "allowMessage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "_xDomainCalldataHash", type: "bytes32" }],
    name: "blockMessage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "blockedMessages",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_libAddressManager", type: "address" }],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "libAddressManager",
    outputs: [{ internalType: "contract Lib_AddressManager", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [], name: "pause", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [],
    name: "paused",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_target", type: "address" },
      { internalType: "address", name: "_sender", type: "address" },
      { internalType: "bytes", name: "_message", type: "bytes" },
      { internalType: "uint256", name: "_messageNonce", type: "uint256" },
      {
        components: [
          { internalType: "bytes32", name: "stateRoot", type: "bytes32" },
          {
            components: [
              { internalType: "uint256", name: "batchIndex", type: "uint256" },
              { internalType: "bytes32", name: "batchRoot", type: "bytes32" },
              { internalType: "uint256", name: "batchSize", type: "uint256" },
              { internalType: "uint256", name: "prevTotalElements", type: "uint256" },
              { internalType: "bytes", name: "extraData", type: "bytes" },
            ],
            internalType: "struct Lib_OVMCodec.ChainBatchHeader",
            name: "stateRootBatchHeader",
            type: "tuple",
          },
          {
            components: [
              { internalType: "uint256", name: "index", type: "uint256" },
              { internalType: "bytes32[]", name: "siblings", type: "bytes32[]" },
            ],
            internalType: "struct Lib_OVMCodec.ChainInclusionProof",
            name: "stateRootProof",
            type: "tuple",
          },
          { internalType: "bytes", name: "stateTrieWitness", type: "bytes" },
          { internalType: "bytes", name: "storageTrieWitness", type: "bytes" },
        ],
        internalType: "struct IL1CrossDomainMessenger.L2MessageInclusionProof",
        name: "_proof",
        type: "tuple",
      },
    ],
    name: "relayMessage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "relayedMessages",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [], name: "renounceOwnership", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [
      { internalType: "address", name: "_target", type: "address" },
      { internalType: "address", name: "_sender", type: "address" },
      { internalType: "bytes", name: "_message", type: "bytes" },
      { internalType: "uint256", name: "_queueIndex", type: "uint256" },
      { internalType: "uint32", name: "_oldGasLimit", type: "uint32" },
      { internalType: "uint32", name: "_newGasLimit", type: "uint32" },
    ],
    name: "replayMessage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_name", type: "string" }],
    name: "resolve",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_target", type: "address" },
      { internalType: "bytes", name: "_message", type: "bytes" },
      { internalType: "uint32", name: "_gasLimit", type: "uint32" },
    ],
    name: "sendMessage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "successfulMessages",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "xDomainMessageSender",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];
const OVM_L1_MESSENGER_ABI = [
  {
    inputs: [{ internalType: "contract OptimismPortal", name: "_portal", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: "bytes32", name: "msgHash", type: "bytes32" }],
    name: "FailedRelayedMessage",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "uint8", name: "version", type: "uint8" }],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
      { indexed: true, internalType: "address", name: "newOwner", type: "address" },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "address", name: "account", type: "address" }],
    name: "Paused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: "bytes32", name: "msgHash", type: "bytes32" }],
    name: "RelayedMessage",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "target", type: "address" },
      { indexed: false, internalType: "address", name: "sender", type: "address" },
      { indexed: false, internalType: "bytes", name: "message", type: "bytes" },
      { indexed: false, internalType: "uint256", name: "messageNonce", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "gasLimit", type: "uint256" },
    ],
    name: "SentMessage",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "sender", type: "address" },
      { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "SentMessageExtension1",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "address", name: "account", type: "address" }],
    name: "Unpaused",
    type: "event",
  },
  {
    inputs: [],
    name: "MESSAGE_VERSION",
    outputs: [{ internalType: "uint16", name: "", type: "uint16" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MIN_GAS_CALLDATA_OVERHEAD",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MIN_GAS_CONSTANT_OVERHEAD",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MIN_GAS_DYNAMIC_OVERHEAD_DENOMINATOR",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MIN_GAS_DYNAMIC_OVERHEAD_NUMERATOR",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "OTHER_MESSENGER",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "PORTAL",
    outputs: [{ internalType: "contract OptimismPortal", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes", name: "_message", type: "bytes" },
      { internalType: "uint32", name: "_minGasLimit", type: "uint32" },
    ],
    name: "baseGas",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "failedMessages",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_owner", type: "address" }],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "messageNonce",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [], name: "pause", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [],
    name: "paused",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_nonce", type: "uint256" },
      { internalType: "address", name: "_sender", type: "address" },
      { internalType: "address", name: "_target", type: "address" },
      { internalType: "uint256", name: "_value", type: "uint256" },
      { internalType: "uint256", name: "_minGasLimit", type: "uint256" },
      { internalType: "bytes", name: "_message", type: "bytes" },
    ],
    name: "relayMessage",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  { inputs: [], name: "renounceOwnership", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [
      { internalType: "address", name: "_target", type: "address" },
      { internalType: "bytes", name: "_message", type: "bytes" },
      { internalType: "uint32", name: "_minGasLimit", type: "uint32" },
    ],
    name: "sendMessage",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "successfulMessages",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  { inputs: [], name: "unpause", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [],
    name: "version",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "xDomainMessageSender",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];
const EXE_L2_OP_GOERLI_ABI = [
  {
    inputs: [
      { internalType: "address", name: "ovmL2CrossDomainMessenger", type: "address" },
      { internalType: "address", name: "ethereumGovernanceExecutor", type: "address" },
      { internalType: "uint256", name: "delay", type: "uint256" },
      { internalType: "uint256", name: "gracePeriod", type: "uint256" },
      { internalType: "uint256", name: "minimumDelay", type: "uint256" },
      { internalType: "uint256", name: "maximumDelay", type: "uint256" },
      { internalType: "address", name: "guardian", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  { inputs: [], name: "DelayLongerThanMax", type: "error" },
  { inputs: [], name: "DelayShorterThanMin", type: "error" },
  { inputs: [], name: "DuplicateAction", type: "error" },
  { inputs: [], name: "EmptyTargets", type: "error" },
  { inputs: [], name: "FailedActionExecution", type: "error" },
  { inputs: [], name: "GracePeriodTooShort", type: "error" },
  { inputs: [], name: "InconsistentParamsLength", type: "error" },
  { inputs: [], name: "InsufficientBalance", type: "error" },
  { inputs: [], name: "InvalidActionsSetId", type: "error" },
  { inputs: [], name: "InvalidInitParams", type: "error" },
  { inputs: [], name: "MaximumDelayTooShort", type: "error" },
  { inputs: [], name: "MinimumDelayTooLong", type: "error" },
  { inputs: [], name: "NotGuardian", type: "error" },
  { inputs: [], name: "OnlyCallableByThis", type: "error" },
  { inputs: [], name: "OnlyQueuedActions", type: "error" },
  { inputs: [], name: "TimelockNotFinished", type: "error" },
  { inputs: [], name: "UnauthorizedEthereumExecutor", type: "error" },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: "uint256", name: "id", type: "uint256" }],
    name: "ActionsSetCanceled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
      { indexed: true, internalType: "address", name: "initiatorExecution", type: "address" },
      { indexed: false, internalType: "bytes[]", name: "returnedData", type: "bytes[]" },
    ],
    name: "ActionsSetExecuted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
      { indexed: false, internalType: "address[]", name: "targets", type: "address[]" },
      { indexed: false, internalType: "uint256[]", name: "values", type: "uint256[]" },
      { indexed: false, internalType: "string[]", name: "signatures", type: "string[]" },
      { indexed: false, internalType: "bytes[]", name: "calldatas", type: "bytes[]" },
      { indexed: false, internalType: "bool[]", name: "withDelegatecalls", type: "bool[]" },
      { indexed: false, internalType: "uint256", name: "executionTime", type: "uint256" },
    ],
    name: "ActionsSetQueued",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "oldDelay", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "newDelay", type: "uint256" },
    ],
    name: "DelayUpdate",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "address", name: "oldEthereumGovernanceExecutor", type: "address" },
      { indexed: false, internalType: "address", name: "newEthereumGovernanceExecutor", type: "address" },
    ],
    name: "EthereumGovernanceExecutorUpdate",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "oldGracePeriod", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "newGracePeriod", type: "uint256" },
    ],
    name: "GracePeriodUpdate",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "address", name: "oldGuardian", type: "address" },
      { indexed: false, internalType: "address", name: "newGuardian", type: "address" },
    ],
    name: "GuardianUpdate",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "oldMaximumDelay", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "newMaximumDelay", type: "uint256" },
    ],
    name: "MaximumDelayUpdate",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "oldMinimumDelay", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "newMinimumDelay", type: "uint256" },
    ],
    name: "MinimumDelayUpdate",
    type: "event",
  },
  {
    inputs: [],
    name: "OVM_L2_CROSS_DOMAIN_MESSENGER",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "actionsSetId", type: "uint256" }],
    name: "cancel",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "actionsSetId", type: "uint256" }],
    name: "execute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "target", type: "address" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "executeDelegateCall",
    outputs: [
      { internalType: "bool", name: "", type: "bool" },
      { internalType: "bytes", name: "", type: "bytes" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "actionsSetId", type: "uint256" }],
    name: "getActionsSetById",
    outputs: [
      {
        components: [
          { internalType: "address[]", name: "targets", type: "address[]" },
          { internalType: "uint256[]", name: "values", type: "uint256[]" },
          { internalType: "string[]", name: "signatures", type: "string[]" },
          { internalType: "bytes[]", name: "calldatas", type: "bytes[]" },
          { internalType: "bool[]", name: "withDelegatecalls", type: "bool[]" },
          { internalType: "uint256", name: "executionTime", type: "uint256" },
          { internalType: "bool", name: "executed", type: "bool" },
          { internalType: "bool", name: "canceled", type: "bool" },
        ],
        internalType: "struct IExecutorBase.ActionsSet",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getActionsSetCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "actionsSetId", type: "uint256" }],
    name: "getCurrentState",
    outputs: [{ internalType: "enum IExecutorBase.ActionsSetState", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getDelay",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getEthereumGovernanceExecutor",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getGracePeriod",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getGuardian",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMaximumDelay",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMinimumDelay",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "actionHash", type: "bytes32" }],
    name: "isActionQueued",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address[]", name: "targets", type: "address[]" },
      { internalType: "uint256[]", name: "values", type: "uint256[]" },
      { internalType: "string[]", name: "signatures", type: "string[]" },
      { internalType: "bytes[]", name: "calldatas", type: "bytes[]" },
      { internalType: "bool[]", name: "withDelegatecalls", type: "bool[]" },
    ],
    name: "queue",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  { inputs: [], name: "receiveFunds", outputs: [], stateMutability: "payable", type: "function" },
  {
    inputs: [{ internalType: "uint256", name: "delay", type: "uint256" }],
    name: "updateDelay",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "ethereumGovernanceExecutor", type: "address" }],
    name: "updateEthereumGovernanceExecutor",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "gracePeriod", type: "uint256" }],
    name: "updateGracePeriod",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "guardian", type: "address" }],
    name: "updateGuardian",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "maximumDelay", type: "uint256" }],
    name: "updateMaximumDelay",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "minimumDelay", type: "uint256" }],
    name: "updateMinimumDelay",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

async function main(): Promise<void> {
  validateBaseEnvs();
  const deployer = await getFirstSigner();

  const OVM_L1_MESSENGER = "0x06D225e6dd7d56437486352466137B7431eb0558";
  const OVM_L1_MESSENGER_PROXY = "0x5086d1eEF304eb5284A0f6720f79403b4e9bE294";
  const GOVV2_L1_GOERLI = "0x24b42ab6d48d361AbE86eA90eF81f2072A53D7b8";
  const EXE_L1_GOERLI = "0x89BF04717E051aA9e1DFE3826eddA6Bcc34dd7d7";
  const EXE_L2_OP_GOERLI = "0xbe95dfcaa49fD4bB2178F6725F6A2fF46AC53e0B";
  const DAI_TOKEN_OP = "0x25d61fA5c23002C489455efDf00bFC1FBB2224df";

  const lyraGov = new ethers.Contract(GOVV2_L1_GOERLI, GOV_ABI, deployer);
  const daiToken = new ethers.Contract(DAI_TOKEN_OP, DAI_ABI, deployer);
  const ovmL1Messenger = new ethers.Contract(OVM_L1_MESSENGER, OVM_L1_MESSENGER_ABI, deployer);
  const optimismBridgeExecutor = new ethers.Contract(EXE_L2_OP_GOERLI, EXE_L2_OP_GOERLI_ABI, deployer);

  const testAdddress = "0x15aDBea538f541271dA5E4436E41285e386E3336";

  const transferTx = await daiToken.populateTransaction.transfer(testAdddress, toBN("1000"));
  const opBridgeExecutorTx = await optimismBridgeExecutor.populateTransaction.queue(
    [DAI_TOKEN_OP],
    [0],
    [""],
    [transferTx.data as string],
    [false],
  );

  // // Estimate gas for the sendMessage transaction
  // const estimatedGas = await ovmL1Messenger.estimateGas.sendMessage(EXE_L2_OP_GOERLI, opBridgeExecutorTx.data, 1000000);

  // // Add an additional margin to the estimated gas (optional, but recommended to avoid out-of-gas errors)
  // const gasLimit = estimatedGas.add(ethers.BigNumber.from("10000"));

  // console.log(`GAS ESTIMATION ${gasLimit}`)
  // Proposal payload containing data for opBridgeExecutor.queue() to be called by the L1 messenger
  const tx = await ovmL1Messenger.populateTransaction.sendMessage(EXE_L2_OP_GOERLI, opBridgeExecutorTx.data, 10000000);
  const tx1 = await lyraGov.create(
    EXE_L1_GOERLI,
    [OVM_L1_MESSENGER_PROXY],
    [0],
    [""],
    [tx.data as string],
    [false],
    toBytes32(""),
  );

  console.log("Transaction sent", tx1.hash);
  await tx1.wait();

  console.log("\n****** Finished creating proposal ******");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
