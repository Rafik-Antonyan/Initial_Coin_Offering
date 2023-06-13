// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ICryptoDevs.sol";

contract CryptoDevToken is ERC20, Ownable {
    ICryptoDevs CryptoDevNFT;
    uint256 public constant tokenPrice = 0.001 ether;
    mapping(uint256 => bool) public tokenIdsClaimed;
    uint256 public constant tokensPerNFT = 10 * 10 ** 18;
    uint256 public constant maxTotalSupply = 10000 * 10 ** 18;

    constructor(address _cryptoDevsContract) ERC20("Crypto Dev Token", "CD") {
        CryptoDevNFT = ICryptoDevs(_cryptoDevsContract);
    }

    function mint(uint256 amount) public payable {
        uint256 _requireAmount = tokenPrice * amount;
        require(msg.value >= _requireAmount, "Ether sent is incorrect");
        uint256 amountWithDecimals = amount * 10 ** 18;
        require(
            totalSupply() + amountWithDecimals <= maxTotalSupply,
            "Exceeds the max total supply available"
        );
        _mint(msg.sender, amount * tokensPerNFT);
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "Nothing to withdraw, contract balance empty");

        address _owner = owner();
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }

    receive() external payable {}

    fallback() external payable {}

    function claim() public {
        address sender = msg.sender;

        uint256 balance = CryptoDevNFT.balanceOf(sender);
        require(balance > 0, "You don't own any Crypto Dev NFT's");
        uint256 amount = 0;

        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = CryptoDevNFT.tokenOfOwnerByIndex(sender, i);
            if (!tokenIdsClaimed[tokenId]) {
                amount++;
                tokenIdsClaimed[tokenId] = true;
            }
        }
        require(amount > 0, "You have already claimed all your tokens");
        _mint(sender, amount * tokensPerNFT);
    }
}
