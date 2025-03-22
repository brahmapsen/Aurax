// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @notice Minimal interface for accepting ZK JWT proofs
contract PredictionValidator {
    event ProofValidated(address indexed user);

    function submitProof(bytes calldata proof) external {
        // In production: validate proof, JWT claims, etc.
        emit ProofValidated(msg.sender);
    }
}
