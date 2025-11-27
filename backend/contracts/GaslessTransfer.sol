// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract GaslessTransfer is EIP712 {
    using ECDSA for bytes32;

    bytes32 public constant TRANSFER_TYPEHASH = keccak256(
        "Transfer(address owner,address recipient,uint256 value,uint256 nonce,uint256 deadline)"
    );

    mapping(address => uint256) public nonces;

    event GaslessTransferExecuted(
        address indexed owner,
        address indexed recipient,
        address indexed token,
        uint256 value,
        uint256 deadline
    );

    constructor() EIP712("GaslessTransfer", "1") {}

    /**
     * @dev 验证 owner 对 (recipient,value,nonce,deadline) 的签名（在本合约 domain 下）
     */
    function verifyTransferAuthorization(
        address owner,
        address recipient,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public view returns (bool) {
        uint256 nonce = nonces[owner];

        bytes32 structHash = keccak256(
            abi.encode(
                TRANSFER_TYPEHASH,
                owner,
                recipient,
                value,
                nonce,
                deadline
            )
        );

        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, v, r, s);
        return signer == owner;
    }

    /**
     * @dev 执行 gasless 转账：
     *  - 使用 token 的 permit 授权本合约 spender = address(this)
     *  - 使用合约内的 transfer authorization (本合约 domain) 验证 recipient
     */
    function executeGaslessTransfer(
        address token,
        address owner,
        address recipient,
        uint256 value,
        uint256 deadline,
        // permit signature (token domain)
        uint8 v_u2c,
        bytes32 r_u2c,
        bytes32 s_u2c,
        // transfer authorization signature (this contract domain)
        uint8 v_u2t,
        bytes32 r_u2t,
        bytes32 s_u2t
    ) external {
        require(block.timestamp <= deadline, "GaslessTransfer: expired deadline");

        // 验证 transfer authorization (this contract domain)
        require(
            verifyTransferAuthorization(owner, recipient, value, deadline, v_u2t, r_u2t, s_u2t),
            "GaslessTransfer: invalid transfer authorization"
        );

        // 使用 token permit 授权本合约为 spender（token domain）
        IERC20Permit(token).permit(owner, address(this), value, deadline, v_u2c, r_u2c, s_u2c);

        // 执行转账
        bool success = IERC20(token).transferFrom(owner, recipient, value);
        require(success, "GaslessTransfer: transfer failed");

        // 防重放：只在成功转账后增加合约 nonce
        nonces[owner] += 1;

        emit GaslessTransferExecuted(owner, recipient, token, value, deadline);
    }

    /**
     * @dev 获取合约 domain separator（调试用）
     */
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
}
