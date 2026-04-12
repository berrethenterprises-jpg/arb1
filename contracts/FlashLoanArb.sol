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

interface IERC20 {
    function approve(address spender, uint amount) external returns (bool);
    function balanceOf(address account) external view returns (uint);
}

contract FlashLoanArb {

    address public owner;
    IPool public pool;

    constructor(address _pool) {
        owner = msg.sender;
        pool = IPool(_pool);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function executeFlashLoan(
        address asset,
        uint amount,
        bytes calldata params
    ) external onlyOwner {

        pool.flashLoanSimple(
            address(this),
            asset,
            amount,
            params,
            0
        );
    }

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address,
        bytes calldata params
    ) external returns (bool) {

        uint balanceBefore = IERC20(asset).balanceOf(address(this));

        // 🔥 DECODE STRATEGY PARAMS
        (address router, bytes memory swapData) = abi.decode(params, (address, bytes));

        // 🔥 EXECUTE SWAP (UNISWAP)
        (bool success, ) = router.call(swapData);
        require(success, "Swap failed");

        uint balanceAfter = IERC20(asset).balanceOf(address(this));

        uint totalOwed = amount + premium;

        // 🔥 MEV PROTECTION: MUST BE PROFITABLE OR REVERT
        require(balanceAfter > totalOwed, "No profit");

        IERC20(asset).approve(address(pool), totalOwed);

        return true;
    }
}