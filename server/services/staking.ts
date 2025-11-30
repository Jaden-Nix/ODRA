import { casperService } from "./casper";
import { dbStorage } from "../db-storage";
import { CONFIG, motesToCSPR, csprToMotes } from "../config";
import crypto from "crypto";

export interface ValidatorWithAPY {
  publicKey: string;
  delegatorsCount: number;
  totalStake: string;
  totalStakeCSPR: number;
  commission: number;
  commissionPercentage: number;
  isActive: boolean;
  apy: number;
  rank?: number;
}

export interface StakingPosition {
  id: string;
  validatorPublicKey: string;
  amount: string;
  amountCSPR: number;
  apy: number;
  lockDuration: number;
  startDate: Date;
  endDate: Date;
  estimatedAnnualReward: number;
  estimatedDailyReward: number;
  accumulatedRewards: number;
  status: "active" | "pending" | "unstaking" | "completed";
}

export interface StakingSummary {
  totalStaked: number;
  totalRewards: number;
  averageAPY: number;
  activePositions: number;
  pendingPositions: number;
}

class StakingService {
  async getAllValidators(): Promise<ValidatorWithAPY[]> {
    const validators = await casperService.getValidators();

    return validators.map((validator, index) => ({
      ...validator,
      totalStakeCSPR: motesToCSPR(validator.totalStake),
      commissionPercentage: validator.commission,
      apy: this.calculateValidatorAPY(validator),
      rank: index + 1,
    }));
  }

  private calculateValidatorAPY(validator: any): number {
    const INFLATION_RATE = CONFIG.staking.inflationRate;
    const commissionRate = (validator.commission || 10) / 100;
    
    const delegatorAPY = INFLATION_RATE * (1 - commissionRate);
    
    const baseMultiplier = 4;
    const stakeSizeBonus = Math.min(0.02, motesToCSPR(validator.totalStake) / 10000000000);
    
    const normalizedAPY = (delegatorAPY * 100 * baseMultiplier) + stakeSizeBonus;
    
    return Math.min(Math.max(normalizedAPY, 5), 15);
  }

  async createStakingPosition(payload: {
    publicKeyHex: string;
    validatorPublicKey: string;
    amountCSPR: number;
    lockDuration: number;
  }): Promise<StakingPosition> {
    const { publicKeyHex, validatorPublicKey, amountCSPR, lockDuration } = payload;

    if (amountCSPR < CONFIG.staking.minStakeAmount) {
      throw new Error(`Minimum stake amount is ${CONFIG.staking.minStakeAmount} CSPR`);
    }

    if (lockDuration < CONFIG.staking.minLockDays || lockDuration > CONFIG.staking.maxLockDays) {
      throw new Error(`Lock duration must be between ${CONFIG.staking.minLockDays} and ${CONFIG.staking.maxLockDays} days`);
    }

    const validators = await this.getAllValidators();
    const validator = validators.find((v) => v.publicKey === validatorPublicKey);
    
    if (!validator) {
      throw new Error("Validator not found");
    }

    const walletInfo = await casperService.getAccountBalance(publicKeyHex);
    if (walletInfo.balanceInCSPR < amountCSPR) {
      throw new Error(
        `Insufficient balance. Need ${amountCSPR} CSPR, have ${walletInfo.balanceInCSPR.toFixed(4)} CSPR`
      );
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + lockDuration);

    const apy = validator.apy;
    const estimatedAnnualReward = amountCSPR * (apy / 100);
    const estimatedDailyReward = estimatedAnnualReward / 365;

    const txHash = "0x" + crypto.randomBytes(32).toString("hex");

    const position = await dbStorage.createStakingPosition({
      userPublicKey: publicKeyHex,
      validatorPublicKey,
      amount: amountCSPR,
      amountMotes: csprToMotes(amountCSPR),
      currency: "CSPR",
      apy,
      lockDuration,
      startDate,
      endDate,
      status: "pending",
      rewards: 0,
      validator: validator.publicKey,
      txHash,
    });

    setTimeout(async () => {
      await dbStorage.updateStakingPosition(position.id, { status: "active" });
      
      await dbStorage.addActivity({
        type: "stake_confirmed",
        description: `Staked ${amountCSPR} CSPR with validator for ${lockDuration} days`,
        status: "success",
        metadata: {
          positionId: position.id,
          validator: validatorPublicKey,
          amount: amountCSPR,
          apy,
        },
      });
    }, 5000);

    await dbStorage.addActivity({
      type: "stake_initiated",
      description: `Initiating stake of ${amountCSPR} CSPR for ${lockDuration} days`,
      status: "pending",
      metadata: {
        validator: validatorPublicKey,
        amount: amountCSPR,
        txHash,
      },
    });

    return {
      id: position.id.toString(),
      validatorPublicKey,
      amount: csprToMotes(amountCSPR),
      amountCSPR,
      apy,
      lockDuration,
      startDate,
      endDate,
      estimatedAnnualReward,
      estimatedDailyReward,
      accumulatedRewards: 0,
      status: "pending",
    };
  }

  async withdrawStaking(payload: {
    publicKeyHex: string;
    positionId: number;
  }): Promise<{ success: boolean; message: string }> {
    const { publicKeyHex, positionId } = payload;

    const position = await dbStorage.getStakingPosition(positionId);
    if (!position) {
      throw new Error("Staking position not found");
    }

    if (position.userPublicKey !== publicKeyHex) {
      throw new Error("Not authorized to withdraw this position");
    }

    if (position.status !== "active") {
      throw new Error(`Cannot withdraw position with status: ${position.status}`);
    }

    const now = new Date();
    if (position.endDate && now < position.endDate) {
      throw new Error("Lock period not yet completed");
    }

    await dbStorage.updateStakingPosition(positionId, { status: "unstaking" });

    setTimeout(async () => {
      const accumulatedRewards = this.calculateAccumulatedRewards(position);
      
      await dbStorage.updateStakingPosition(positionId, {
        status: "completed",
        rewards: accumulatedRewards,
      });

      await dbStorage.addActivity({
        type: "stake_withdrawn",
        description: `Withdrew ${position.amount} CSPR + ${accumulatedRewards.toFixed(4)} CSPR rewards`,
        status: "success",
        metadata: {
          positionId,
          amount: position.amount,
          rewards: accumulatedRewards,
        },
      });
    }, 5000);

    await dbStorage.addActivity({
      type: "unstake_initiated",
      description: `Initiating withdrawal of staking position`,
      status: "pending",
      metadata: { positionId },
    });

    return {
      success: true,
      message: "Withdrawal initiated. Funds will be available in approximately 7 days.",
    };
  }

  private calculateAccumulatedRewards(position: any): number {
    const startDate = new Date(position.startDate);
    const now = new Date();
    const daysStaked = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const apy = position.apy || CONFIG.staking.defaultAPY;
    const dailyRate = apy / 365 / 100;
    
    return position.amount * dailyRate * daysStaked;
  }

  async getUserStakingPositions(publicKeyHex: string): Promise<StakingPosition[]> {
    const positions = await dbStorage.getStakingPositionsByUser(publicKeyHex);
    
    return positions.map((pos) => {
      const accumulatedRewards = pos.status === "active" 
        ? this.calculateAccumulatedRewards(pos)
        : pos.rewards || 0;
      
      const apy = pos.apy || CONFIG.staking.defaultAPY;
      const estimatedAnnualReward = pos.amount * (apy / 100);
      const estimatedDailyReward = estimatedAnnualReward / 365;

      return {
        id: pos.id.toString(),
        validatorPublicKey: pos.validatorPublicKey || pos.validator || "",
        amount: pos.amountMotes || csprToMotes(pos.amount),
        amountCSPR: pos.amount,
        apy,
        lockDuration: pos.lockDuration || 0,
        startDate: pos.startDate,
        endDate: pos.endDate || new Date(),
        estimatedAnnualReward,
        estimatedDailyReward,
        accumulatedRewards,
        status: pos.status as "active" | "pending" | "unstaking" | "completed",
      };
    });
  }

  async getStakingSummary(publicKeyHex: string): Promise<StakingSummary> {
    const positions = await this.getUserStakingPositions(publicKeyHex);
    
    const activePositions = positions.filter((p) => p.status === "active");
    const pendingPositions = positions.filter((p) => p.status === "pending");
    
    const totalStaked = activePositions.reduce((sum, p) => sum + p.amountCSPR, 0);
    const totalRewards = activePositions.reduce((sum, p) => sum + p.accumulatedRewards, 0);
    const averageAPY = activePositions.length > 0
      ? activePositions.reduce((sum, p) => sum + p.apy, 0) / activePositions.length
      : 0;

    return {
      totalStaked,
      totalRewards,
      averageAPY,
      activePositions: activePositions.length,
      pendingPositions: pendingPositions.length,
    };
  }

  async getNetworkStakingStats(): Promise<{
    totalValidators: number;
    totalStaked: number;
    averageAPY: number;
    topValidators: ValidatorWithAPY[];
  }> {
    const validators = await this.getAllValidators();
    const activeValidators = validators.filter((v) => v.isActive);
    
    const totalStaked = activeValidators.reduce((sum, v) => sum + v.totalStakeCSPR, 0);
    const averageAPY = activeValidators.length > 0
      ? activeValidators.reduce((sum, v) => sum + v.apy, 0) / activeValidators.length
      : 0;

    return {
      totalValidators: activeValidators.length,
      totalStaked,
      averageAPY,
      topValidators: activeValidators.slice(0, 5),
    };
  }
}

export const stakingService = new StakingService();
