import { getFirstSigner } from "../../helpers/helpers";
import { validateBaseEnvs } from "../utils/validation";
import { ethers } from "hardhat";
import { toBN, toBytes32 } from "../../test/utils";
import { BigNumber, Contract } from "ethers";

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
const EXE_L2_ARBI_GOERLI_ABI = [
  {
    inputs: [
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
const LYRA_TEST_ABI = [
  {
    inputs: [
      { internalType: "string", name: "name", type: "string" },
      { internalType: "string", name: "symbol", type: "string" },
      { internalType: "uint256", name: "supply", type: "uint256" },
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
    inputs: [],
    name: "DOMAIN_SEPARATOR",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
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
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "nonces",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "uint8", name: "v", type: "uint8" },
      { internalType: "bytes32", name: "r", type: "bytes32" },
      { internalType: "bytes32", name: "s", type: "bytes32" },
    ],
    name: "permit",
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
const INBOX_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "dataLength", type: "uint256" },
      { internalType: "uint256", name: "maxDataLength", type: "uint256" },
    ],
    name: "DataTooLarge",
    type: "error",
  },
  { inputs: [], name: "GasLimitTooLarge", type: "error" },
  {
    inputs: [
      { internalType: "uint256", name: "expected", type: "uint256" },
      { internalType: "uint256", name: "actual", type: "uint256" },
    ],
    name: "InsufficientSubmissionCost",
    type: "error",
  },
  {
    inputs: [
      { internalType: "uint256", name: "expected", type: "uint256" },
      { internalType: "uint256", name: "actual", type: "uint256" },
    ],
    name: "InsufficientValue",
    type: "error",
  },
  { inputs: [], name: "L1Forked", type: "error" },
  { inputs: [{ internalType: "address", name: "origin", type: "address" }], name: "NotAllowedOrigin", type: "error" },
  { inputs: [], name: "NotForked", type: "error" },
  { inputs: [], name: "NotOrigin", type: "error" },
  {
    inputs: [
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "address", name: "owner", type: "address" },
    ],
    name: "NotOwner",
    type: "error",
  },
  {
    inputs: [
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "address", name: "rollup", type: "address" },
      { internalType: "address", name: "owner", type: "address" },
    ],
    name: "NotRollupOrOwner",
    type: "error",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "l2CallValue", type: "uint256" },
      { internalType: "uint256", name: "deposit", type: "uint256" },
      { internalType: "uint256", name: "maxSubmissionCost", type: "uint256" },
      { internalType: "address", name: "excessFeeRefundAddress", type: "address" },
      { internalType: "address", name: "callValueRefundAddress", type: "address" },
      { internalType: "uint256", name: "gasLimit", type: "uint256" },
      { internalType: "uint256", name: "maxFeePerGas", type: "uint256" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "RetryableData",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "bool", name: "val", type: "bool" },
    ],
    name: "AllowListAddressSet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "bool", name: "isEnabled", type: "bool" }],
    name: "AllowListEnabledUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "messageNum", type: "uint256" },
      { indexed: false, internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "InboxMessageDelivered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: "uint256", name: "messageNum", type: "uint256" }],
    name: "InboxMessageDeliveredFromOrigin",
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
    inputs: [{ indexed: false, internalType: "address", name: "account", type: "address" }],
    name: "Unpaused",
    type: "event",
  },
  {
    inputs: [],
    name: "allowListEnabled",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "bridge",
    outputs: [{ internalType: "contract IBridge", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "dataLength", type: "uint256" },
      { internalType: "uint256", name: "baseFee", type: "uint256" },
    ],
    name: "calculateRetryableSubmissionFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "l2CallValue", type: "uint256" },
      { internalType: "uint256", name: "maxSubmissionCost", type: "uint256" },
      { internalType: "address", name: "excessFeeRefundAddress", type: "address" },
      { internalType: "address", name: "callValueRefundAddress", type: "address" },
      { internalType: "uint256", name: "gasLimit", type: "uint256" },
      { internalType: "uint256", name: "maxFeePerGas", type: "uint256" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "createRetryableTicket",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "l2CallValue", type: "uint256" },
      { internalType: "uint256", name: "maxSubmissionCost", type: "uint256" },
      { internalType: "address", name: "excessFeeRefundAddress", type: "address" },
      { internalType: "address", name: "callValueRefundAddress", type: "address" },
      { internalType: "uint256", name: "gasLimit", type: "uint256" },
      { internalType: "uint256", name: "maxFeePerGas", type: "uint256" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "createRetryableTicketNoRefundAliasRewrite",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "depositEth",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "depositEth",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract IBridge", name: "_bridge", type: "address" },
      { internalType: "contract ISequencerInbox", name: "_sequencerInbox", type: "address" },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "isAllowed",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
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
    inputs: [{ internalType: "contract IBridge", name: "", type: "address" }],
    name: "postUpgradeInit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "gasLimit", type: "uint256" },
      { internalType: "uint256", name: "maxFeePerGas", type: "uint256" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "sendContractTransaction",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "gasLimit", type: "uint256" },
      { internalType: "uint256", name: "maxFeePerGas", type: "uint256" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "sendL1FundedContractTransaction",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "gasLimit", type: "uint256" },
      { internalType: "uint256", name: "maxFeePerGas", type: "uint256" },
      { internalType: "uint256", name: "nonce", type: "uint256" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "sendL1FundedUnsignedTransaction",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "gasLimit", type: "uint256" },
      { internalType: "uint256", name: "maxFeePerGas", type: "uint256" },
      { internalType: "uint256", name: "nonce", type: "uint256" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "sendL1FundedUnsignedTransactionToFork",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes", name: "messageData", type: "bytes" }],
    name: "sendL2Message",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes", name: "messageData", type: "bytes" }],
    name: "sendL2MessageFromOrigin",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "gasLimit", type: "uint256" },
      { internalType: "uint256", name: "maxFeePerGas", type: "uint256" },
      { internalType: "uint256", name: "nonce", type: "uint256" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "sendUnsignedTransaction",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "gasLimit", type: "uint256" },
      { internalType: "uint256", name: "maxFeePerGas", type: "uint256" },
      { internalType: "uint256", name: "nonce", type: "uint256" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "sendUnsignedTransactionToFork",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "gasLimit", type: "uint256" },
      { internalType: "uint256", name: "maxFeePerGas", type: "uint256" },
      { internalType: "uint256", name: "nonce", type: "uint256" },
      { internalType: "uint256", name: "value", type: "uint256" },
      { internalType: "address", name: "withdrawTo", type: "address" },
    ],
    name: "sendWithdrawEthToFork",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "sequencerInbox",
    outputs: [{ internalType: "contract ISequencerInbox", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address[]", name: "user", type: "address[]" },
      { internalType: "bool[]", name: "val", type: "bool[]" },
    ],
    name: "setAllowList",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bool", name: "_allowListEnabled", type: "bool" }],
    name: "setAllowListEnabled",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "l2CallValue", type: "uint256" },
      { internalType: "uint256", name: "maxSubmissionCost", type: "uint256" },
      { internalType: "address", name: "excessFeeRefundAddress", type: "address" },
      { internalType: "address", name: "callValueRefundAddress", type: "address" },
      { internalType: "uint256", name: "gasLimit", type: "uint256" },
      { internalType: "uint256", name: "maxFeePerGas", type: "uint256" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "uniswapCreateRetryableTicket",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  { inputs: [], name: "unpause", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "l2CallValue", type: "uint256" },
      { internalType: "uint256", name: "maxSubmissionCost", type: "uint256" },
      { internalType: "address", name: "excessFeeRefundAddress", type: "address" },
      { internalType: "address", name: "callValueRefundAddress", type: "address" },
      { internalType: "uint256", name: "gasLimit", type: "uint256" },
      { internalType: "uint256", name: "maxFeePerGas", type: "uint256" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "unsafeCreateRetryableTicket",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
];
// async function main(): Promise<void> {
//   validateBaseEnvs();
//   const deployer = await getFirstSigner();
//   // const lyraToken = await deployAndValidate("Lyra", deployer, "Lyra", ["Lyra Test Token", "Lyra Test", toBN("10000")]);
//   // const EXE_L2_OP_GOERLI = "0x6971BD7c2BACd8526caFD70C3A0D8cFBD8e9d62F";
//   const LYRA_ARBI = "0xF27A512e26e3e77498B2396fC171d1EE2747E1c4";
//   const lyraToken = new ethers.Contract(LYRA_ARBI, LYRA_TEST_ABI, deployer);
//   const EXE_L2_ARBI_GOERLI = "0x6971BD7c2BACd8526caFD70C3A0D8cFBD8e9d62F";
//   await lyraToken.transfer(EXE_L2_ARBI_GOERLI, toBN('10000'))
//   // // Proposal payload containing data for opBridgeExecutor.queue() to be called by the L1 messenger
//   // const tx = await ovmL1Messenger.populateTransaction.sendMessage(EXE_L2_OP_GOERLI, opBridgeExecutorTx.data, 10000000);
//   // const tx1 = await lyraGov.create(
//   //   EXE_L1_GOERLI,
//   //   [OVM_L1_MESSENGER_PROXY],
//   //   [0],
//   //   [""],
//   //   [tx.data as string],
//   //   [false],
//   //   toBytes32(""),
//   // );

//   // console.log("Transaction sent", tx1.hash);
//   // await tx1.wait();

//   console.log("\n****** Finished creating proposal ******");
// }
const encodeSimpleActionsSet = (bridgeExecutor: Contract, target: string, fn: string, params: any[]) => {
  const paramTypes = fn.split("(")[1].split(")")[0].split(",");
  const data = [
    [target],
    [BigNumber.from(0)],
    [fn],
    [ethers.utils.defaultAbiCoder.encode(paramTypes, [...params])],
    [false],
  ];
  const encodedData = bridgeExecutor.interface.encodeFunctionData("queue", data as any);

  return { data, encodedData };
};

const ARBITRUM_MAX_GAS = BigNumber.from(200000).mul(3);
const getSimpleRetryableTicket = (destAddr: string, encodedData: string) => {
  return {
    destAddr,
    arbTxCallValue: 0,
    maxSubmissionCost: 0,
    submissionRefundAddress: "0xC1D0048b50bB4D67dDbF3ba14Abc6Fca05a6A66C",
    valueRefundAddress: "0xC1D0048b50bB4D67dDbF3ba14Abc6Fca05a6A66C",
    maxGas: ARBITRUM_MAX_GAS,
    gasPriceBid: 0,
    data: encodedData,
  };
};

async function main(): Promise<void> {
  validateBaseEnvs();
  const deployer = await getFirstSigner();
  const GOVV2_L1_GOERLI = "0xD5BB4Cd3dbD5164eE5575FBB23542b120a52BdB8";
  const EXE_L1_GOERLI = "0xb6f416a47cACb1583903ae6861D023FcBF3Be7b6";
  const LYRA_ARBI = "0xF27A512e26e3e77498B2396fC171d1EE2747E1c4";
  const EXE_L2_ARBI_GOERLI = "0x6971BD7c2BACd8526caFD70C3A0D8cFBD8e9d62F";
  const ARBI_INBOX = "0x6BEbC4925716945D46F0Ec336D5C2564F419682C";

  const lyraToken = new ethers.Contract(LYRA_ARBI, LYRA_TEST_ABI, deployer);
  const lyraGov = new ethers.Contract(GOVV2_L1_GOERLI, GOV_ABI, deployer);
  const arbiBridgeExecutor = new ethers.Contract(EXE_L2_ARBI_GOERLI, EXE_L2_ARBI_GOERLI_ABI, deployer);
  const arbiInbox = new ethers.Contract(ARBI_INBOX, INBOX_ABI, deployer);

  const testAdddress = "0xC1D0048b50bB4D67dDbF3ba14Abc6Fca05a6A66C";

  // const transferTx = await lyraToken.populateTransaction.transfer(testAdddress, toBN("1000"));

  const { data, encodedData } = encodeSimpleActionsSet(
    arbiBridgeExecutor,
    lyraToken.address,
    "transfer(address, uint256)",
    [testAdddress, toBN("1000")],
  );
  console.log(data);
  const retryableTicket = getSimpleRetryableTicket(arbiBridgeExecutor.address, encodedData);

  // Proposal payload containing data for opBridgeExecutor.queue() to be called by the L1 messenger
  const tx = await arbiInbox.createRetryableTicket(
    retryableTicket.destAddr,
    retryableTicket.arbTxCallValue,
    retryableTicket.maxSubmissionCost,
    retryableTicket.submissionRefundAddress,
    retryableTicket.valueRefundAddress,
    retryableTicket.maxGas,
    retryableTicket.gasPriceBid,
    retryableTicket.data,
    {
      gasLimit: 12000000,
    },
  );

  const tx1 = await lyraGov.create(EXE_L1_GOERLI, [ARBI_INBOX], [0], [""], [tx.data as string], [false], toBytes32(""));

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
