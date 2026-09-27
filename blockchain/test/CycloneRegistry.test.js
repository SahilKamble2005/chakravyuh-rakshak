const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CycloneRegistry", function () {
  let CycloneRegistry;
  let registry;
  let owner, systemUser, authorityUser, user;

  const SYSTEM_ROLE = ethers.keccak256(ethers.toUtf8Bytes("SYSTEM_ROLE"));
  const AUTHORITY_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AUTHORITY_ROLE"));
  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;

  beforeEach(async function () {
    [owner, systemUser, authorityUser, user] = await ethers.getSigners();

    CycloneRegistry = await ethers.getContractFactory("CycloneRegistry");
    registry = await CycloneRegistry.deploy();
    await registry.waitForDeployment();

    // Grant roles for testing
    await registry.grantRole(SYSTEM_ROLE, systemUser.address);
    await registry.grantRole(AUTHORITY_ROLE, authorityUser.address);
  });

  describe("Deployment", function () {
    it("Should grant deployer all initial roles", async function () {
      expect(await registry.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await registry.hasRole(SYSTEM_ROLE, owner.address)).to.be.true;
      expect(await registry.hasRole(AUTHORITY_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Registering Records", function () {
    const dataHash = ethers.keccak256(ethers.toUtf8Bytes("sample data"));

    it("Should register a prediction successfully with SYSTEM_ROLE", async function () {
      await expect(
        registry.connect(systemUser).registerPrediction("PRED-1", "LOC-1", 85, 2, dataHash, "v1.0")
      ).to.emit(registry, "PredictionRegistered")
        .withArgs("PRED-1", "LOC-1", 85, dataHash, systemUser.address);

      const count = await registry.getRecordCount();
      expect(count).to.equal(1n);
    });

    it("Should reject prediction registration from unauthorized user", async function () {
      await expect(
        registry.connect(user).registerPrediction("PRED-2", "LOC-1", 85, 2, dataHash, "v1.0")
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });

    it("Should register an alert with AUTHORITY_ROLE", async function () {
      await expect(
        registry.connect(authorityUser).registerAlert("ALT-1", "LOC-2", 90, 3, dataHash)
      ).to.emit(registry, "AlertRegistered")
        .withArgs("ALT-1", "LOC-2", 90, dataHash, authorityUser.address);
    });

    it("Should register an alert with SYSTEM_ROLE", async function () {
      await expect(
        registry.connect(systemUser).registerAlert("ALT-2", "LOC-2", 90, 3, dataHash)
      ).to.emit(registry, "AlertRegistered")
        .withArgs("ALT-2", "LOC-2", 90, dataHash, systemUser.address);
    });

    it("Should reject alert registration from unauthorized user", async function () {
      await expect(
        registry.connect(user).registerAlert("ALT-3", "LOC-2", 90, 3, dataHash)
      ).to.be.revertedWith("Caller is not authorized");
    });

    it("Should register environment hash with SYSTEM_ROLE", async function () {
      await expect(
        registry.connect(systemUser).registerEnvironmentHash("ENV-1", "LOC-3", dataHash)
      ).to.emit(registry, "EnvironmentHashRegistered")
        .withArgs("ENV-1", dataHash);
    });
    
    it("Should prevent duplicate record IDs", async function () {
      await registry.connect(systemUser).registerPrediction("DUP-1", "LOC-1", 85, 2, dataHash, "v1.0");
      await expect(
        registry.connect(systemUser).registerPrediction("DUP-1", "LOC-2", 90, 3, dataHash, "v1.1")
      ).to.be.revertedWith("Record ID already exists");
    });
  });

  describe("Verification & Retrieval", function () {
    const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test data"));
    const wrongHash = ethers.keccak256(ethers.toUtf8Bytes("wrong data"));

    beforeEach(async function () {
      await registry.connect(owner).registerPrediction("REC-1", "LOC-1", 75, 1, dataHash, "v1.0");
    });

    it("Should verify correct hash and return true", async function () {
      const [isValid, storedHash] = await registry.verifyRecord("REC-1", dataHash);
      expect(isValid).to.be.true;
      expect(storedHash).to.equal(dataHash);
    });

    it("Should verify wrong hash and return false", async function () {
      const [isValid] = await registry.verifyRecord("REC-1", wrongHash);
      expect(isValid).to.be.false;
    });

    it("Should revert verification for non-existent record", async function () {
      await expect(registry.verifyRecord("NONE", dataHash)).to.be.revertedWith("Record does not exist");
    });

    it("Should get a record", async function () {
      const record = await registry.getRecord("REC-1");
      expect(record.recordId).to.equal("REC-1");
      expect(record.locationId).to.equal("LOC-1");
      expect(record.dataHash).to.equal(dataHash);
    });

    it("Should revert getting non-existent record", async function () {
      await expect(registry.getRecord("NONE")).to.be.revertedWith("Record does not exist");
    });

    it("Should get record ID at index", async function () {
      const id = await registry.getRecordIdAtIndex(0);
      expect(id).to.equal("REC-1");
    });

    it("Should revert getting record ID at invalid index", async function () {
      await expect(registry.getRecordIdAtIndex(1)).to.be.revertedWith("Index out of bounds");
    });
  });

  describe("Role Management", function () {
    it("Should allow admin to grant roles", async function () {
      await registry.connect(owner).grantSystemRole(user.address);
      expect(await registry.hasRole(SYSTEM_ROLE, user.address)).to.be.true;
      
      await registry.connect(owner).grantAuthorityRole(user.address);
      expect(await registry.hasRole(AUTHORITY_ROLE, user.address)).to.be.true;
    });

    it("Should prevent non-admin from granting roles", async function () {
      await expect(
        registry.connect(user).grantSystemRole(user.address)
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });
  });
});
