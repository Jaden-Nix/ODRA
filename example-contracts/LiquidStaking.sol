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

        updateRewards();

        uint256 sharesToMint;
        if (totalShares == 0) {
            sharesToMint = msg.value;
        } else {
            sharesToMint = (msg.value * totalShares) / totalStaked;
        }

        stakedBalance[msg.sender] += msg.value;
        shareBalance[msg.sender] += sharesToMint;
        totalStaked += msg.value;
        totalShares += sharesToMint;

        emit Stake(msg.sender, msg.value, sharesToMint);
    }

    /**
     * @dev Unstake cCSPR, receive CSPR + accrued rewards
     * Amount received = (shares * totalStaked) / totalShares
     */
    function unstake(uint256 _shares) public {
        require(shareBalance[msg.sender] >= _shares, "Insufficient shares");

        updateRewards();

        uint256 amountToReceive = (_shares * totalStaked) / totalShares;
        require(amountToReceive > 0, "Insufficient balance");

        shareBalance[msg.sender] -= _shares;
        stakedBalance[msg.sender] -= amountToReceive;
        totalShares -= _shares;
        totalStaked -= amountToReceive;

        (bool success, ) = msg.sender.call{value: amountToReceive}("");
        require(success, "Transfer failed");

        emit Unstake(msg.sender, _shares, amountToReceive);
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
