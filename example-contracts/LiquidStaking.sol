// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title LiquidStaking (cCSPR)
 * @dev Liquid staking contract for CSPR → cCSPR minting on Casper testnet
 * Users deposit CSPR, receive cCSPR tokens representing their stake + rewards
 */
contract LiquidStaking {
    string public name = "Casper Liquid Stake";
    string public symbol = "cCSPR";
    uint8 public decimals = 9;

    // FIXED: Added constant to check for overflow protection
    uint256 private constant MAX_UINT256 = type(uint256).max;
    uint256 private constant MAX_STAKE = 10_000_000 ether; // 10M ETH max stake

    uint256 public totalStaked = 0;
    uint256 public totalShares = 0;
    uint256 public accumulatedRewards = 0;
    uint256 public lastRewardTime = block.timestamp;
    uint256 public rewardRate = 85; // 8.5% APY in basis points (850/10000)

    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public shareBalance;

    event Stake(address indexed user, uint256 amount, uint256 sharesReceived);
    event Unstake(address indexed user, uint256 shares, uint256 amountReceived);
    event RewardAccumulated(uint256 totalReward, uint256 timestamp);

    receive() external payable {
        stake();
    }

    /**
     * @dev Stake CSPR, receive cCSPR shares
     * Share price = totalStaked / totalShares
     * New shares = (amount * totalShares) / totalStaked
     */
    function stake() public payable {
        require(msg.value > 0, "Must stake some amount");
        // FIXED: Added overflow check
        require(totalStaked + msg.value <= MAX_STAKE, "Stake limit exceeded");
        require(totalStaked <= MAX_UINT256 - msg.value, "Overflow protection");

        updateRewards();

        uint256 sharesToMint;
        if (totalShares == 0) {
            sharesToMint = msg.value;
        } else {
            // FIXED: Check for division by zero
            require(totalStaked > 0, "Invalid state");
            sharesToMint = (msg.value * totalShares) / totalStaked;
        }

        // FIXED: Check for overflow on all additions
        require(stakedBalance[msg.sender] <= MAX_UINT256 - msg.value, "Balance overflow");
        require(shareBalance[msg.sender] <= MAX_UINT256 - sharesToMint, "Share overflow");
        require(totalStaked <= MAX_UINT256 - msg.value, "Total stake overflow");
        require(totalShares <= MAX_UINT256 - sharesToMint, "Total shares overflow");

        stakedBalance[msg.sender] += msg.value;
        shareBalance[msg.sender] += sharesToMint;
        totalStaked += msg.value;
        totalShares += sharesToMint;

        emit Stake(msg.sender, msg.value, sharesToMint);
    }

    /**
     * @dev Unstake cCSPR, receive CSPR + accrued rewards
     * Amount received = (shares * totalStaked) / totalShares
     * FIXED: Checks-Effects-Interactions pattern to prevent reentrancy
     */
    function unstake(uint256 _shares) public {
        require(shareBalance[msg.sender] >= _shares, "Insufficient shares");

        updateRewards();

        uint256 amountToReceive = (_shares * totalStaked) / totalShares;
        require(amountToReceive > 0, "Insufficient balance");

        // EFFECTS: Update state BEFORE external call (CEI pattern)
        shareBalance[msg.sender] -= _shares;
        stakedBalance[msg.sender] -= amountToReceive;
        totalShares -= _shares;
        totalStaked -= amountToReceive;

        emit Unstake(msg.sender, _shares, amountToReceive);

        // INTERACTIONS: External call AFTER state update
        (bool success, ) = msg.sender.call{value: amountToReceive}("");
        require(success, "Transfer failed");
    }

    /**
     * @dev Calculate and accumulate staking rewards
     * Rewards = totalStaked * rewardRate * timeSinceLastReward
     */
    function updateRewards() internal {
        uint256 timeElapsed = block.timestamp - lastRewardTime;
        if (timeElapsed == 0 || totalStaked == 0) return;

        uint256 reward = (totalStaked * rewardRate * timeElapsed) / (365 days * 10000);
        accumulatedRewards += reward;
        totalStaked += reward;
        lastRewardTime = block.timestamp;

        emit RewardAccumulated(reward, block.timestamp);
    }

    /**
     * @dev Get user's cCSPR balance in CSPR value
     */
    function balanceOf(address _user) public view returns (uint256) {
        if (totalShares == 0) return 0;
        return (shareBalance[_user] * totalStaked) / totalShares;
    }

    /**
     * @dev Get current exchange rate: CSPR per cCSPR
     */
    function exchangeRate() public view returns (uint256) {
        if (totalShares == 0) return 1e9;
        return (totalStaked * 1e9) / totalShares;
    }

    /**
     * @dev Get APY (Annual Percentage Yield)
     */
    function getCurrentAPY() public pure returns (uint256) {
        return 85; // 8.5%
    }
}
