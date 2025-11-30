import OpenAI from "openai";

let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface Vulnerability {
  id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  location: string;
  fix: string;
  cveReference?: string;
}

export interface SecurityAnalysisResult {
  vulnerabilities: Vulnerability[];
  optimizations: string[];
  bestPractices: string[];
  riskScore: number;
  recommendation: string;
  coreAnalysis: string;
  casperSpecificSuggestions: string[];
}

export interface YieldAdvice {
  projectedYield: number;
  strategies: string[];
  risks: string[];
  recommendation: string;
  optimalDuration: number;
  compoundingSchedule: string;
}

export interface CodeSuggestion {
  type: "optimization" | "security" | "casper-pattern";
  original: string;
  suggested: string;
  explanation: string;
}

class AIService {
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = !!process.env.OPENAI_API_KEY;
  }

  async analyzeContractSecurity(contractCode: string): Promise<SecurityAnalysisResult> {
    if (!this.isConfigured) {
      return this.fallbackSecurityAnalysis(contractCode);
    }

    try {
      if (!openai) {
        return this.fallbackSecurityAnalysis(contractCode);
      }
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert smart contract security auditor specializing in Solidity and Casper blockchain. Analyze the provided smart contract for security vulnerabilities, gas optimizations, and best practices. Also provide Casper-specific suggestions for deploying this contract on Casper Network.

Respond with JSON in this exact format:
{
  "vulnerabilities": [
    {
      "id": "string",
      "type": "string (e.g., Reentrancy, Integer Overflow, Access Control)",
      "severity": "critical|high|medium|low",
      "description": "string",
      "location": "string (function or line reference)",
      "fix": "string",
      "cveReference": "string (optional)"
    }
  ],
  "optimizations": ["string array of gas optimization suggestions"],
  "bestPractices": ["string array of best practice recommendations"],
  "riskScore": number (0-100, higher = more risky),
  "recommendation": "string (overall assessment)",
  "coreAnalysis": "string (detailed analysis summary)",
  "casperSpecificSuggestions": ["string array of Casper-specific recommendations"]
}`
          },
          {
            role: "user",
            content: `Analyze this Solidity smart contract for security vulnerabilities and provide recommendations for deployment on Casper Network:\n\n${contractCode}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 4096,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        vulnerabilities: result.vulnerabilities || [],
        optimizations: result.optimizations || [],
        bestPractices: result.bestPractices || [],
        riskScore: Math.max(0, Math.min(100, result.riskScore || 0)),
        recommendation: result.recommendation || "Analysis complete.",
        coreAnalysis: result.coreAnalysis || "Contract analyzed successfully.",
        casperSpecificSuggestions: result.casperSpecificSuggestions || [],
      };
    } catch (error) {
      console.error("AI security analysis failed:", error);
      return this.fallbackSecurityAnalysis(contractCode);
    }
  }

  async getYieldAdvice(
    amount: number,
    duration: number,
    currentApy: number,
    networkData?: {
      totalStaked: number;
      activeValidators: number;
      averageApy: number;
    }
  ): Promise<YieldAdvice> {
    if (!this.isConfigured) {
      return this.fallbackYieldAdvice(amount, duration, currentApy);
    }

    try {
      if (!openai) {
        return this.fallbackYieldAdvice(amount, duration, currentApy);
      }
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert DeFi yield advisor specializing in Casper Network staking. Analyze the staking parameters and provide strategic recommendations.

Respond with JSON in this exact format:
{
  "projectedYield": number (estimated yield in tokens),
  "strategies": ["string array of staking strategies"],
  "risks": ["string array of risk factors to consider"],
  "recommendation": "string (main recommendation)",
  "optimalDuration": number (optimal staking duration in days),
  "compoundingSchedule": "string (e.g., 'Weekly', 'Monthly', 'At maturity')"
}`
          },
          {
            role: "user",
            content: `Provide yield advice for staking on Casper Network:
- Amount: ${amount} CSPR
- Duration: ${duration} days
- Current APY: ${currentApy}%
${networkData ? `
- Network Total Staked: ${networkData.totalStaked} CSPR
- Active Validators: ${networkData.activeValidators}
- Average Network APY: ${networkData.averageApy}%` : ''}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2048,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        projectedYield: result.projectedYield || amount * (currentApy / 100) * (duration / 365),
        strategies: result.strategies || [],
        risks: result.risks || [],
        recommendation: result.recommendation || "Consider your risk tolerance when staking.",
        optimalDuration: result.optimalDuration || duration,
        compoundingSchedule: result.compoundingSchedule || "Monthly",
      };
    } catch (error) {
      console.error("AI yield advice failed:", error);
      return this.fallbackYieldAdvice(amount, duration, currentApy);
    }
  }

  async suggestCodeImprovements(contractCode: string): Promise<CodeSuggestion[]> {
    if (!this.isConfigured) {
      return [];
    }

    try {
      if (!openai) return [];
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert Solidity developer. Suggest specific code improvements for the provided smart contract, focusing on:
1. Gas optimizations
2. Security improvements
3. Casper Network compatibility patterns

Respond with JSON in this format:
{
  "suggestions": [
    {
      "type": "optimization|security|casper-pattern",
      "original": "code snippet to replace",
      "suggested": "improved code snippet",
      "explanation": "why this improvement is beneficial"
    }
  ]
}`
          },
          {
            role: "user",
            content: `Suggest improvements for this Solidity contract:\n\n${contractCode}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 4096,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.suggestions || [];
    } catch (error) {
      console.error("AI code suggestions failed:", error);
      return [];
    }
  }

  async analyzeBridgeTransaction(
    sourceChain: string,
    destChain: string,
    amount: number,
    token: string
  ): Promise<{
    estimatedFees: number;
    estimatedTime: string;
    risks: string[];
    recommendations: string[];
  }> {
    if (!this.isConfigured) {
      return {
        estimatedFees: amount * 0.001,
        estimatedTime: "5-10 minutes",
        risks: ["Bridge congestion may cause delays", "Token price volatility during transfer"],
        recommendations: ["Verify destination address", "Monitor transaction status"],
      };
    }

    try {
      if (!openai) {
        return {
          estimatedFees: amount * 0.001,
          estimatedTime: "5-10 minutes",
          risks: ["Bridge congestion may cause delays"],
          recommendations: ["Verify destination address"],
        };
      }
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a cross-chain bridge expert. Analyze the bridge transaction and provide risk assessment and recommendations.

Respond with JSON:
{
  "estimatedFees": number,
  "estimatedTime": "string",
  "risks": ["string array"],
  "recommendations": ["string array"]
}`
          },
          {
            role: "user",
            content: `Analyze this cross-chain bridge transaction:
- Source: ${sourceChain}
- Destination: ${destChain}
- Amount: ${amount} ${token}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1024,
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("AI bridge analysis failed:", error);
      return {
        estimatedFees: amount * 0.001,
        estimatedTime: "5-10 minutes",
        risks: ["Bridge congestion may cause delays"],
        recommendations: ["Verify destination address"],
      };
    }
  }

  private fallbackSecurityAnalysis(contractCode: string): SecurityAnalysisResult {
    const vulnerabilities: Vulnerability[] = [];
    let riskScore = 0;

    if (contractCode.includes("call{value:") && 
        contractCode.indexOf("call{value:") < contractCode.indexOf("-=")) {
      vulnerabilities.push({
        id: "v1",
        type: "Reentrancy",
        severity: "critical",
        description: "External call is made before state update. This allows an attacker to re-enter the function.",
        location: "withdraw() function",
        fix: "Use the checks-effects-interactions pattern. Update state before making external calls.",
        cveReference: "CWE-841",
      });
      riskScore += 40;
    }

    if (!contractCode.includes("onlyOwner") && 
        !contractCode.includes("require(msg.sender ==") &&
        contractCode.includes("function") &&
        (contractCode.includes("transfer(") || contractCode.includes("selfdestruct"))) {
      vulnerabilities.push({
        id: "v2",
        type: "Missing Access Control",
        severity: "high",
        description: "Critical functions lack proper access control modifiers.",
        location: "Multiple functions",
        fix: "Add onlyOwner modifier or require statements to restrict access.",
      });
      riskScore += 25;
    }

    if (contractCode.includes("tx.origin")) {
      vulnerabilities.push({
        id: "v3",
        type: "tx.origin Usage",
        severity: "medium",
        description: "Using tx.origin for authorization can be exploited through phishing attacks.",
        location: "Authorization check",
        fix: "Replace tx.origin with msg.sender for authorization checks.",
      });
      riskScore += 15;
    }

    const optimizations: string[] = [];
    if (contractCode.includes("public") && contractCode.includes("view")) {
      optimizations.push("Consider using external instead of public for functions only called externally");
    }
    if (contractCode.includes("memory") && contractCode.includes("function")) {
      optimizations.push("Use calldata instead of memory for read-only function parameters");
    }

    const bestPractices: string[] = [];
    if (!contractCode.includes("event")) {
      bestPractices.push("Add events for important state changes to enable off-chain tracking");
    }
    if (!contractCode.includes("@notice") && !contractCode.includes("@dev")) {
      bestPractices.push("Add NatSpec documentation for better code readability");
    }

    let recommendation = "";
    if (riskScore >= 60) {
      recommendation = "CRITICAL: Do not deploy this contract. Address critical vulnerabilities first.";
    } else if (riskScore >= 40) {
      recommendation = "HIGH RISK: Significant security issues found. Review and fix before deployment.";
    } else if (riskScore >= 20) {
      recommendation = "MEDIUM RISK: Some issues detected. Consider addressing them for improved security.";
    } else {
      recommendation = "LOW RISK: Contract appears relatively safe. Apply optimizations if desired.";
    }

    return {
      vulnerabilities,
      optimizations,
      bestPractices,
      riskScore: Math.min(100, riskScore),
      recommendation,
      coreAnalysis: `Analyzed ${contractCode.length} characters of Solidity code. Found ${vulnerabilities.length} potential vulnerabilities.`,
      casperSpecificSuggestions: [
        "Map Solidity events to Casper dictionaries for state tracking",
        "Consider using ODRA framework patterns for Casper deployment",
        "Optimize storage access patterns for Casper's trie-based storage",
      ],
    };
  }

  private fallbackYieldAdvice(amount: number, duration: number, apy: number): YieldAdvice {
    const projectedYield = amount * (apy / 100) * (duration / 365);
    
    return {
      projectedYield,
      strategies: [
        `Optimal lock duration is ${Math.min(duration + 30, 365)} days for better APY`,
        "Consider splitting stake across multiple validators for risk diversification",
        "Compound rewards monthly for maximum yield optimization",
        "Monitor validator performance regularly to ensure optimal returns",
      ],
      risks: [
        "Validator slashing risk if validator misbehaves",
        "Lock-up period means funds are illiquid",
        "APY may fluctuate based on network conditions",
      ],
      recommendation: `Staking ${amount} CSPR for ${duration} days at ${apy}% APY will yield approximately ${projectedYield.toFixed(2)} CSPR`,
      optimalDuration: Math.min(duration + 30, 365),
      compoundingSchedule: duration >= 90 ? "Monthly" : "At maturity",
    };
  }

  isAvailable(): boolean {
    return this.isConfigured;
  }
}

export const aiService = new AIService();
