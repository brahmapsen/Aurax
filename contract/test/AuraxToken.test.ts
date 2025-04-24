import { expect } from "chai";
import { ethers } from "hardhat";
import { AuraxToken } from "../typechain-types";

describe("AuraxToken", function () {
  let token: AuraxToken;
  let owner: any;
  let recipient: any;
  const DEPOSIT_AMOUNT = ethers.parseEther("10"); // 10 tokens

  beforeEach(async function () {
    // Get the signers
    [owner, recipient] = await ethers.getSigners();

    // Deploy the token contract
    const Token = await ethers.getContractFactory("AuraxToken");
    token = await Token.deploy();
    await token.waitForDeployment();
  });

  it("Should deposit tokens to recipient wallet", async function () {
    // Get initial balance
    const initialBalance = await token.balanceOf(recipient.address);
    console.log("Initial balance:", ethers.formatEther(initialBalance), " for ", recipient.address);

    // Transfer tokens to recipient
    const transferTx = await token.transfer(recipient.address, DEPOSIT_AMOUNT);
    await transferTx.wait();

    // Get final balance
    const finalBalance = await token.balanceOf(recipient.address);
    console.log("Final balance:", ethers.formatEther(finalBalance));

    // Verify the transfer
    expect(finalBalance).to.equal(initialBalance + DEPOSIT_AMOUNT);
  });

  it("Should fail when trying to transfer more tokens than owned", async function () {
    const tooMuchAmount = ethers.parseEther("1000000000000"); // More than total supply

    // Attempt to transfer more tokens than owned
    await expect(
      token.transfer(recipient.address, tooMuchAmount)
    ).to.be.revertedWith("ERC20: insufficient balance");
  });
});
