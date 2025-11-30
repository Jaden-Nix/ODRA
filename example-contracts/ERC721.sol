// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SimpleERC721
 * @dev Simple ERC-721 NFT contract for deployment to Casper testnet via ODRA-EVM
 */
contract SimpleERC721 {
    string public name = "ODRA NFT";
    string public symbol = "ONFT";

    uint256 private tokenIdCounter = 1;
    
    mapping(uint256 => address) public tokenOwner;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => string) public tokenURI;
    mapping(uint256 => address) public tokenApprovals;
    mapping(address => mapping(address => bool)) public operatorApprovals;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function mint(address _to, string memory _tokenURI) public returns (uint256) {
        uint256 tokenId = tokenIdCounter++;
        
        tokenOwner[tokenId] = _to;
        tokenURI[tokenId] = _tokenURI;
        balanceOf[_to]++;

        emit Transfer(address(0), _to, tokenId);
        return tokenId;
    }

    function transferFrom(address _from, address _to, uint256 _tokenId) public {
        require(_from == tokenOwner[_tokenId], "Not token owner");
        require(_to != address(0), "Invalid address");
        require(
            msg.sender == _from || msg.sender == tokenApprovals[_tokenId] || operatorApprovals[_from][msg.sender],
            "Not authorized"
        );

        balanceOf[_from]--;
        balanceOf[_to]++;
        tokenOwner[_tokenId] = _to;
        delete tokenApprovals[_tokenId];

        emit Transfer(_from, _to, _tokenId);
    }

    function approve(address _to, uint256 _tokenId) public {
        require(msg.sender == tokenOwner[_tokenId], "Not owner");
        tokenApprovals[_tokenId] = _to;
        emit Approval(msg.sender, _to, _tokenId);
    }

    function setApprovalForAll(address _operator, bool _approved) public {
        operatorApprovals[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }
}
