const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Upload", function () {
  async function deployFixture() {
    const [owner, user, stranger] = await ethers.getSigners();
    const Upload = await ethers.getContractFactory("Upload");
    const upload = await Upload.deploy();
    await upload.deployed();
    return { upload, owner, user, stranger };
  }

  it("stores a file reference only for the caller", async function () {
    const { upload, owner, user } = await deployFixture();

    await expect(upload.connect(owner).add("ipfs://file-1"))
      .to.emit(upload, "FileAdded")
      .withArgs(owner.address, "ipfs://file-1");

    expect(await upload.connect(owner).display(owner.address)).to.deep.equal(["ipfs://file-1"]);
    await expect(upload.connect(user).display(owner.address)).to.be.revertedWith(
      "You don't have access"
    );
  });

  it("rejects an empty file URL", async function () {
    const { upload } = await deployFixture();
    await expect(upload.add("")).to.be.revertedWith("File URL cannot be empty");
  });

  it("grants and revokes access", async function () {
    const { upload, owner, user } = await deployFixture();

    await upload.connect(owner).add("ipfs://file-1");
    await expect(upload.connect(owner).allow(user.address))
      .to.emit(upload, "AccessGranted")
      .withArgs(owner.address, user.address);

    expect(await upload.connect(user).display(owner.address)).to.deep.equal(["ipfs://file-1"]);

    const records = await upload.connect(owner).shareAccess();
    expect(records[0].user).to.equal(user.address);
    expect(records[0].access).to.equal(true);

    await expect(upload.connect(owner).disallow(user.address))
      .to.emit(upload, "AccessRevoked")
      .withArgs(owner.address, user.address);

    await expect(upload.connect(user).display(owner.address)).to.be.revertedWith(
      "You don't have access"
    );
  });

  it("reactivates a previously revoked address without duplicating it", async function () {
    const { upload, owner, user } = await deployFixture();

    await upload.connect(owner).allow(user.address);
    await upload.connect(owner).disallow(user.address);
    await upload.connect(owner).allow(user.address);

    const records = await upload.connect(owner).shareAccess();
    expect(records.length).to.equal(1);
    expect(records[0].user).to.equal(user.address);
    expect(records[0].access).to.equal(true);
  });

  it("rejects invalid sharing targets", async function () {
    const { upload, owner } = await deployFixture();

    await expect(upload.connect(owner).allow(ethers.constants.AddressZero)).to.be.revertedWith(
      "Invalid user address"
    );
    await expect(upload.connect(owner).allow(owner.address)).to.be.revertedWith(
      "Owner already has access"
    );
  });

  it("does not allow a caller to add data for another owner", async function () {
    const { upload, owner, user } = await deployFixture();

    await upload.connect(user).add("ipfs://user-file");

    await expect(upload.connect(owner).display(user.address)).to.be.revertedWith(
      "You don't have access"
    );
    expect(await upload.connect(user).display(user.address)).to.deep.equal(["ipfs://user-file"]);
  });

  it("allows an owner to call disallow repeatedly without corrupting the list", async function () {
    const { upload, owner, user } = await deployFixture();

    await upload.connect(owner).allow(user.address);
    await upload.connect(owner).disallow(user.address);
    await upload.connect(owner).disallow(user.address);

    const records = await upload.connect(owner).shareAccess();
    expect(records.length).to.equal(1);
    expect(records[0].access).to.equal(false);
  });
});
