// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract ChainOfCustody is AccessControl {
    bytes32 public constant JUDGE_ROLE = keccak256("JUDGE_ROLE");
    bytes32 public constant INVESTIGATOR_ROLE = keccak256("INVESTIGATOR_ROLE");

    // Evidence state enum
    enum EvidenceState {
        Active, // Currently being investigated
        Sealed, // Court sealed
        Archived, // Case closed
        UnderReview // Being analyzed
    }

    struct Evidence {
        bytes32 evidenceHash;
        address currentHolder;
        uint256 createdAt;
        EvidenceState state;
        bool exists;
    }

    // Custody history log
    struct CustodyLog {
        address handler;
        uint256 timestamp;
        string action;
    }

    mapping(bytes32 => Evidence) private evidences;
    mapping(bytes32 => CustodyLog[]) private custodyHistory;
    mapping(address => bytes32[]) private holderEvidenceList;

    event EvidenceRegistered(
        bytes32 indexed evidenceId,
        bytes32 evidenceHash,
        address indexed registeredBy,
        uint256 timestamp
    );

    event CustodyTransferred(
        bytes32 indexed evidenceId,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );

    event EvidenceStateChanged(
        bytes32 indexed evidenceId,
        EvidenceState indexed newState,
        address indexed changedBy,
        uint256 timestamp
    );

    event CustodyActionLogged(
        bytes32 indexed evidenceId,
        address indexed handler,
        string action,
        uint256 timestamp
    );

    constructor(address judge) {
        _grantRole(DEFAULT_ADMIN_ROLE, judge);
        _grantRole(JUDGE_ROLE, judge);
    }

    function registerEvidence(
        bytes32 evidenceId,
        bytes32 evidenceHash
    ) external onlyRole(INVESTIGATOR_ROLE) {
        require(!evidences[evidenceId].exists, "Evidence already exists");

        evidences[evidenceId] = Evidence({
            evidenceHash: evidenceHash,
            currentHolder: msg.sender,
            createdAt: block.timestamp,
            state: EvidenceState.Active,
            exists: true
        });

        // Add to holder's evidence list
        holderEvidenceList[msg.sender].push(evidenceId);

        // Log initial custody action
        custodyHistory[evidenceId].push(
            CustodyLog({
                handler: msg.sender,
                timestamp: block.timestamp,
                action: "Evidence registered"
            })
        );

        emit EvidenceRegistered(
            evidenceId,
            evidenceHash,
            msg.sender,
            block.timestamp
        );

        emit CustodyActionLogged(
            evidenceId,
            msg.sender,
            "Evidence registered",
            block.timestamp
        );
    }

    function transferCustody(
        bytes32 evidenceId,
        address newHolder
    ) external onlyRole(INVESTIGATOR_ROLE) {
        require(evidences[evidenceId].exists, "Evidence not found");

        // Allow transfer if: caller is current holder OR caller has JUDGE_ROLE
        bool isCurrentHolder = evidences[evidenceId].currentHolder ==
            msg.sender;
        bool isJudge = hasRole(JUDGE_ROLE, msg.sender);

        require(isCurrentHolder || isJudge, "Not current holder or judge");
        require(
            evidences[evidenceId].state == EvidenceState.Active,
            "Evidence must be active to transfer"
        );

        address previousHolder = evidences[evidenceId].currentHolder;
        evidences[evidenceId].currentHolder = newHolder;

        // Add to new holder's evidence list
        holderEvidenceList[newHolder].push(evidenceId);

        // Log custody transfer
        custodyHistory[evidenceId].push(
            CustodyLog({
                handler: newHolder,
                timestamp: block.timestamp,
                action: "Custody transferred"
            })
        );

        emit CustodyTransferred(
            evidenceId,
            previousHolder,
            newHolder,
            block.timestamp
        );

        emit CustodyActionLogged(
            evidenceId,
            newHolder,
            "Custody transferred",
            block.timestamp
        );
    }

    function getEvidence(
        bytes32 evidenceId
    )
        external
        view
        returns (
            bytes32 evidenceHash,
            address currentHolder,
            uint256 createdAt,
            EvidenceState state
        )
    {
        require(evidences[evidenceId].exists, "Evidence not found");

        Evidence memory e = evidences[evidenceId];
        return (e.evidenceHash, e.currentHolder, e.createdAt, e.state);
    }

    // New functions for enhanced features

    function updateEvidenceState(
        bytes32 evidenceId,
        EvidenceState newState
    ) external onlyRole(JUDGE_ROLE) {
        require(evidences[evidenceId].exists, "Evidence not found");
        require(
            newState != evidences[evidenceId].state,
            "State is already set to this value"
        );

        EvidenceState oldState = evidences[evidenceId].state;
        evidences[evidenceId].state = newState;

        // Log state change
        string memory action = string(
            abi.encodePacked(
                "State changed from ",
                _stateToString(oldState),
                " to ",
                _stateToString(newState)
            )
        );

        custodyHistory[evidenceId].push(
            CustodyLog({
                handler: msg.sender,
                timestamp: block.timestamp,
                action: action
            })
        );

        emit EvidenceStateChanged(
            evidenceId,
            newState,
            msg.sender,
            block.timestamp
        );
        emit CustodyActionLogged(
            evidenceId,
            msg.sender,
            action,
            block.timestamp
        );
    }

    function getCustodyHistory(
        bytes32 evidenceId
    ) external view returns (CustodyLog[] memory) {
        require(evidences[evidenceId].exists, "Evidence not found");
        return custodyHistory[evidenceId];
    }

    function getAllEvidenceByHolder(
        address holder
    ) external view returns (bytes32[] memory) {
        return holderEvidenceList[holder];
    }

    function logCustomAction(
        bytes32 evidenceId,
        string memory action
    ) external onlyRole(INVESTIGATOR_ROLE) {
        require(evidences[evidenceId].exists, "Evidence not found");
        require(
            evidences[evidenceId].currentHolder == msg.sender ||
                hasRole(JUDGE_ROLE, msg.sender),
            "Not current holder or judge"
        );

        custodyHistory[evidenceId].push(
            CustodyLog({
                handler: msg.sender,
                timestamp: block.timestamp,
                action: action
            })
        );

        emit CustodyActionLogged(
            evidenceId,
            msg.sender,
            action,
            block.timestamp
        );
    }

    // Helper function to convert state enum to string
    function _stateToString(
        EvidenceState state
    ) internal pure returns (string memory) {
        if (state == EvidenceState.Active) return "Active";
        if (state == EvidenceState.Sealed) return "Sealed";
        if (state == EvidenceState.Archived) return "Archived";
        if (state == EvidenceState.UnderReview) return "UnderReview";
        return "Unknown";
    }
}
