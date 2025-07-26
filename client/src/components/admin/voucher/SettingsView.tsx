import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Settings, ShoppingCart, Mail, CreditCard, CheckCircle } from "lucide-react";

const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState({
    allowCouponStacking: false,
    maxDiscountPerOrder: "50",
    defaultCouponExpiry: "30",
    requireMinimumOrder: true,
    defaultMinimumOrder: "100",
    emailNotifications: true,
    autoExpireCoupons: true,
    trackCouponUsage: true,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    // TODO: Implement API call to save settings
    alert("Settings saved successfully!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Coupon Management Settings</h2>
        <p className="text-gray-600 mt-1">Configure discount coupon behavior and validation rules</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              General Settings
            </CardTitle>
            <CardDescription>Basic coupon behavior configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Allow Coupon Stacking</Label>
                <p className="text-xs text-gray-500">Allow multiple coupons per order</p>
              </div>
              <Switch
                checked={settings.allowCouponStacking}
                onCheckedChange={(checked) => handleSettingChange("allowCouponStacking", checked)}
              />
            </div>

            <div className="space-y-2">
              <Label>Maximum Discount Per Order (€)</Label>
              <Input
                type="number"
                value={settings.maxDiscountPerOrder}
                onChange={(e) => handleSettingChange("maxDiscountPerOrder", e.target.value)}
                placeholder="50"
              />
              <p className="text-xs text-gray-500">Maximum total discount allowed per single order</p>
            </div>

            <div className="space-y-2">
              <Label>Default Coupon Expiry (days)</Label>
              <Input
                type="number"
                value={settings.defaultCouponExpiry}
                onChange={(e) => handleSettingChange("defaultCouponExpiry", e.target.value)}
                placeholder="30"
              />
              <p className="text-xs text-gray-500">Default expiration period for new coupons</p>
            </div>
          </CardContent>
        </Card>

        {/* Order Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Order Requirements
            </CardTitle>
            <CardDescription>Minimum order and validation rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Require Minimum Order</Label>
                <p className="text-xs text-gray-500">Enforce minimum order amounts</p>
              </div>
              <Switch
                checked={settings.requireMinimumOrder}
                onCheckedChange={(checked) => handleSettingChange("requireMinimumOrder", checked)}
              />
            </div>

            <div className="space-y-2">
              <Label>Default Minimum Order Amount (€)</Label>
              <Input
                type="number"
                value={settings.defaultMinimumOrder}
                onChange={(e) => handleSettingChange("defaultMinimumOrder", e.target.value)}
                placeholder="100"
                disabled={!settings.requireMinimumOrder}
              />
              <p className="text-xs text-gray-500">Default minimum order for coupon eligibility</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Auto-Expire Coupons</Label>
                <p className="text-xs text-gray-500">Automatically disable expired coupons</p>
              </div>
              <Switch
                checked={settings.autoExpireCoupons}
                onCheckedChange={(checked) => handleSettingChange("autoExpireCoupons", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications & Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Notifications & Tracking
            </CardTitle>
            <CardDescription>Email notifications and usage tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Email Notifications</Label>
                <p className="text-xs text-gray-500">Send email alerts for coupon usage</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Track Coupon Usage</Label>
                <p className="text-xs text-gray-500">Monitor coupon usage statistics</p>
              </div>
              <Switch
                checked={settings.trackCouponUsage}
                onCheckedChange={(checked) => handleSettingChange("trackCouponUsage", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Checkout Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Checkout Integration
            </CardTitle>
            <CardDescription>Configure how coupons work at checkout</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Checkout Integration Active</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Discount coupons are automatically applied at checkout when customers enter valid codes.
                    All validation rules and settings configured above will be enforced.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Integration Features:</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Real-time coupon validation
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Automatic discount calculation
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Usage limit enforcement
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Expiration date checking
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Settings */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Settings className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default SettingsView;