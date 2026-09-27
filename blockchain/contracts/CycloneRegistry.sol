// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract CycloneRegistry is AccessControl {
    enum RecordType { PREDICTION, ALERT, ENVIRONMENT, VERIFICATION }
    enum RiskLevel { LOW, MODERATE, HIGH, CRITICAL }

    struct CycloneRecord {
        string recordId;
        string locationId;
        uint256 timestamp;
        uint256 riskScore;
        RiskLevel riskLevel;
        bytes32 dataHash;
        string modelVersion;
        RecordType recordType;
        address issuer;
        bool exists;
    }

    mapping(string => CycloneRecord) private records;
    string[] private recordIds;

    bytes32 public constant SYSTEM_ROLE = keccak256("SYSTEM_ROLE");
    bytes32 public constant AUTHORITY_ROLE = keccak256("AUTHORITY_ROLE");

    event PredictionRegistered(string indexed recordId, string locationId, uint256 riskScore, bytes32 dataHash, address issuer);
    event AlertRegistered(string indexed recordId, string locationId, uint256 riskScore, bytes32 dataHash, address issuer);
    event EnvironmentHashRegistered(string indexed recordId, bytes32 dataHash);
    event RecordVerified(string indexed recordId, bool isValid);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SYSTEM_ROLE, msg.sender);
        _grantRole(AUTHORITY_ROLE, msg.sender);
    }

    function registerPrediction(
        string memory recordId,
        string memory locationId,
        uint256 riskScore,
        RiskLevel riskLevel,
        bytes32 dataHash,
        string memory modelVersion
    ) external onlyRole(SYSTEM_ROLE) {
        require(bytes(recordId).length > 0, "Record ID cannot be empty");
        require(dataHash != bytes32(0), "Data hash cannot be empty");
        require(!records[recordId].exists, "Record ID already exists");

        records[recordId] = CycloneRecord({
            recordId: recordId,
            locationId: locationId,
            timestamp: block.timestamp,
            riskScore: riskScore,
            riskLevel: riskLevel,
            dataHash: dataHash,
            modelVersion: modelVersion,
            recordType: RecordType.PREDICTION,
            issuer: msg.sender,
            exists: true
        });
        
        recordIds.push(recordId);
        emit PredictionRegistered(recordId, locationId, riskScore, dataHash, msg.sender);
    }

    function registerAlert(
        string memory recordId,
        string memory locationId,
        uint256 riskScore,
        RiskLevel riskLevel,
        bytes32 dataHash
    ) external {
        require(hasRole(AUTHORITY_ROLE, msg.sender) || hasRole(SYSTEM_ROLE, msg.sender), "Caller is not authorized");
        require(bytes(recordId).length > 0, "Record ID cannot be empty");
        require(dataHash != bytes32(0), "Data hash cannot be empty");
        require(!records[recordId].exists, "Record ID already exists");

        records[recordId] = CycloneRecord({
            recordId: recordId,
            locationId: locationId,
            timestamp: block.timestamp,
            riskScore: riskScore,
            riskLevel: riskLevel,
            dataHash: dataHash,
            modelVersion: "",
            recordType: RecordType.ALERT,
            issuer: msg.sender,
            exists: true
        });

        recordIds.push(recordId);
        emit AlertRegistered(recordId, locationId, riskScore, dataHash, msg.sender);
    }

    function registerEnvironmentHash(
        string memory recordId,
        string memory locationId,
        bytes32 dataHash
    ) external onlyRole(SYSTEM_ROLE) {
        require(bytes(recordId).length > 0, "Record ID cannot be empty");
        require(dataHash != bytes32(0), "Data hash cannot be empty");
        require(!records[recordId].exists, "Record ID already exists");

        records[recordId] = CycloneRecord({
            recordId: recordId,
            locationId: locationId,
            timestamp: block.timestamp,
            riskScore: 0,
            riskLevel: RiskLevel.LOW,
            dataHash: dataHash,
            modelVersion: "",
            recordType: RecordType.ENVIRONMENT,
            issuer: msg.sender,
            exists: true
        });

        recordIds.push(recordId);
        emit EnvironmentHashRegistered(recordId, dataHash);
    }

    function verifyRecord(string memory recordId, bytes32 dataHash) external view returns (bool isValid, bytes32 storedHash, uint256 timestamp) {
        require(records[recordId].exists, "Record does not exist");
        CycloneRecord memory record = records[recordId];
        bool valid = (record.dataHash == dataHash);
        return (valid, record.dataHash, record.timestamp);
    }

    function getRecord(string memory recordId) external view returns (CycloneRecord memory) {
        require(records[recordId].exists, "Record does not exist");
        return records[recordId];
    }

    function getRecordCount() external view returns (uint256) {
        return recordIds.length;
    }

    function getRecordIdAtIndex(uint256 index) external view returns (string memory) {
        require(index < recordIds.length, "Index out of bounds");
        return recordIds[index];
    }

    function grantSystemRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(SYSTEM_ROLE, account);
    }

    function grantAuthorityRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(AUTHORITY_ROLE, account);
    }
}
