// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title GaslessTransfer
 * @dev 支持通过EIP-2612 permit进行零Gas费转账的合约
 * 
 * 用户通过permit签名授权，中继器可以代付Gas执行转账
 */
contract GaslessTransfer is EIP712 {
    using ECDSA for bytes32;

    bytes32 public constant PERMIT_TYPEHASH = keccak256(
        "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
    );

    event GaslessTransferExecuted(
        address indexed owner,
        address indexed spender,
        address indexed token,
        uint256 value,
        uint256 deadline
    );

    constructor() EIP712("GaslessTransfer", "1") {}

    /**
     * @dev 通过EIP-2612 permit执行转账
     * @param token 代币合约地址（必须支持IERC20Permit）
     * @param owner 代币所有者
     * @param spender 被授权者（接收方）
     * @param value 转账金额
     * @param deadline 签名过期时间（Unix时间戳）
     * @param v 签名v值
     * @param r 签名r值  
     * @param s 签名s值
     */
    function executeGaslessTransfer(
        address token,
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        // 使用EIP-2612 permit进行授权
        IERC20Permit(token).permit(owner, spender, value, deadline, v, r, s);
        
        // 从owner转账到spender
        bool success = IERC20(token).transferFrom(owner, spender, value);
        require(success, "GaslessTransfer: transfer failed");

        emit GaslessTransferExecuted(owner, spender, token, value, deadline);
    }

    /**
     * @dev 批量permit转账
     */
    // function batchTransferWithPermit(
    //     address token,
    //     address[] memory owners,
    //     address[] memory spenders,
    //     uint256[] memory values,
    //     uint256[] memory deadlines,
    //     uint8[] memory vs,
    //     bytes32[] memory rs,
    //     bytes32[] memory ss
    // ) external {
    //     require(
    //         owners.length == spenders.length &&
    //         spenders.length == values.length &&
    //         values.length == deadlines.length &&
    //         deadlines.length == vs.length &&
    //         vs.length == rs.length &&
    //         rs.length == ss.length,
    //         "GaslessTransfer: array length mismatch"
    //     );

    //     for (uint256 i = 0; i < owners.length; i++) {
    //         transferWithPermit(
    //             token,
    //             owners[i],
    //             spenders[i],
    //             values[i],
    //             deadlines[i],
    //             vs[i],
    //             rs[i],
    //             ss[i]
    //         );
    //     }
    // }

    /**
     * @dev 获取域分隔符（用于EIP-712签名验证）
     */
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
}