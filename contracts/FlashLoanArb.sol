// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPool {
    function flashLoanSimple(
        address receiver,
        address asset,
        uint256 amount,
        bytes calldata params,
        uint16 referralCode
    ) external;
}

contract FlashLoanArb {

    address public owner;
    IPool public pool;

    constructor(address _pool) {
        owner = msg.sender;
        pool = IPool(_pool);
    }

    function executeFlashLoan(address asset, uint amount) external {
        require(msg.sender == owner, "Not owner");

        pool.flashLoanSimple(
            address(this),
            asset,
            amount,
            "",
            0
        );
    }

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address,
        bytes calldata
    ) external returns (bool) {

        // 🔥 THIS IS WHERE ARBITRAGE HAPPENS
        // swap on Uniswap
        // compare vs Binance

        uint totalOwed = amount + premium;

        // approve repayment
        IERC20(asset).approve(address(pool), totalOwed);

        return true;
    }
}

interface IERC20 {
    function approve(address spender, uint amount) external returns (bool);
}
