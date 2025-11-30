import { useState } from "react";
import {
  Settings as SettingsIcon,
  Wallet,
  Bell,
  Shield,
  Code2,
  Globe,
  Moon,
  Sun,
  Monitor,
  Save,
  RefreshCcw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";

export default function Settings() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    compilationSuccess: true,
    compilationError: true,
    deploymentStatus: true,
    securityAlerts: true,
    stakingRewards: false,
  });
  const [network, setNetwork] = useState("casper-testnet");
  const [autoSave, setAutoSave] = useState(true);
  const [gasLimit, setGasLimit] = useState("3000000");

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated",
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6" data-testid="settings-page">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and application settings
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet Connection
            </CardTitle>
            <CardDescription>
              Connect your wallet to deploy contracts and manage assets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Casper Signer</p>
                  <p className="text-sm text-muted-foreground">Not connected</p>
                </div>
              </div>
              <Button data-testid="button-connect-wallet">Connect</Button>
            </div>

            <div className="space-y-2">
              <Label>Default Network</Label>
              <Select value={network} onValueChange={setNetwork}>
                <SelectTrigger data-testid="select-network">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casper-testnet">Casper Testnet</SelectItem>
                  <SelectItem value="casper-mainnet">Casper Mainnet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how the application looks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label>Theme</Label>
              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "default" : "secondary"}
                  className="flex-1"
                  onClick={() => setTheme("light")}
                  data-testid="button-theme-light"
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "secondary"}
                  className="flex-1"
                  onClick={() => setTheme("dark")}
                  data-testid="button-theme-dark"
                >
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "secondary"}
                  className="flex-1"
                  onClick={() => setTheme("system")}
                  data-testid="button-theme-system"
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  System
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Choose what notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compilation Success</Label>
                <p className="text-xs text-muted-foreground">
                  Notify when compilation completes successfully
                </p>
              </div>
              <Switch
                checked={notifications.compilationSuccess}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, compilationSuccess: checked })
                }
                data-testid="switch-compilation-success"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compilation Errors</Label>
                <p className="text-xs text-muted-foreground">
                  Notify when compilation fails
                </p>
              </div>
              <Switch
                checked={notifications.compilationError}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, compilationError: checked })
                }
                data-testid="switch-compilation-error"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Deployment Status</Label>
                <p className="text-xs text-muted-foreground">
                  Notify on deployment confirmation or failure
                </p>
              </div>
              <Switch
                checked={notifications.deploymentStatus}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, deploymentStatus: checked })
                }
                data-testid="switch-deployment-status"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Security Alerts</Label>
                <p className="text-xs text-muted-foreground">
                  Notify when critical vulnerabilities are found
                </p>
              </div>
              <Switch
                checked={notifications.securityAlerts}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, securityAlerts: checked })
                }
                data-testid="switch-security-alerts"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Staking Rewards</Label>
                <p className="text-xs text-muted-foreground">
                  Notify when staking rewards are distributed
                </p>
              </div>
              <Switch
                checked={notifications.stakingRewards}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, stakingRewards: checked })
                }
                data-testid="switch-staking-rewards"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5" />
              Compiler Settings
            </CardTitle>
            <CardDescription>
              Configure Solidity compiler and deployment options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-Save</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically save contracts while editing
                </p>
              </div>
              <Switch
                checked={autoSave}
                onCheckedChange={setAutoSave}
                data-testid="switch-auto-save"
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="gas-limit">Default Gas Limit</Label>
              <Input
                id="gas-limit"
                type="number"
                value={gasLimit}
                onChange={(e) => setGasLimit(e.target.value)}
                data-testid="input-gas-limit"
              />
              <p className="text-xs text-muted-foreground">
                Maximum gas for contract deployment (in motes)
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Solidity Version</Label>
              <Select defaultValue="0.8.20">
                <SelectTrigger data-testid="select-solidity-version">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.8.20">0.8.20 (Latest)</SelectItem>
                  <SelectItem value="0.8.19">0.8.19</SelectItem>
                  <SelectItem value="0.8.18">0.8.18</SelectItem>
                  <SelectItem value="0.8.17">0.8.17</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Optimizer</Label>
                <p className="text-xs text-muted-foreground">
                  Enable Solidity optimizer (200 runs)
                </p>
              </div>
              <Switch defaultChecked data-testid="switch-optimizer" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              API & Integrations
            </CardTitle>
            <CardDescription>
              Manage API connections and external services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium">Casper Testnet RPC</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    https://rpc.testnet.casperlabs.io
                  </p>
                </div>
              </div>
              <Badge className="bg-green-500">Connected</Badge>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="font-medium">OpenAI API</p>
                  <p className="text-xs text-muted-foreground">
                    AI security analysis
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-yellow-500">
                Not Configured
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium">Sepolia RPC</p>
                  <p className="text-xs text-muted-foreground">
                    Bridge destination network
                  </p>
                </div>
              </div>
              <Badge className="bg-green-500">Connected</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" data-testid="button-reset-settings">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} data-testid="button-save-settings">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
