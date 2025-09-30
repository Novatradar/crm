"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingChange, setLoadingChange] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    api.getMe().then((me) => {
      if (me.role !== "super_agent") router.replace("/");
    }).catch(() => router.replace("/"));
  }, [router]);

  const sendOtp = async () => {
    try {
      setLoadingSend(true);
      await api.sendSuperAgentPasswordOtp();
      setOtpSent(true);
      toast.success("OTP sent to novatradar@gmail.com");
    } catch (e: any) {
      toast.error(e?.message || "Failed to send OTP");
    } finally {
      setLoadingSend(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword || !otp) {
      toast.error("Fill all fields including OTP");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    try {
      setLoadingChange(true);
      await api.changeSuperAgentPassword(oldPassword, newPassword, otp);
      toast.success("Password updated successfully");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOtp("");
      setOtpSent(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update password");
    } finally {
      setLoadingChange(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Change your super agent password with OTP verification</p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>We will send an OTP to novatradar@gmail.com before updating</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="oldPassword">Current password</Label>
            <div className="relative">
              <Input id="oldPassword" type={showOld ? "text" : "password"} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} autoComplete="current-password" />
              <button type="button" aria-label={showOld ? "Hide password" : "Show password"} onClick={() => setShowOld((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <div className="relative">
              <Input id="newPassword" type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
              <button type="button" aria-label={showNew ? "Hide password" : "Show password"} onClick={() => setShowNew((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <div className="relative">
              <Input id="confirmPassword" type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
              <button type="button" aria-label={showConfirm ? "Hide password" : "Show password"} onClick={() => setShowConfirm((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="otp">OTP</Label>
              <Input id="otp" placeholder="Enter 6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} />
            </div>
            <Button variant="outline" onClick={sendOtp} disabled={loadingSend}>
              {loadingSend ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
            </Button>
          </div>

          <div className="pt-2">
            <Button onClick={handleChangePassword} disabled={loadingChange}>
              {loadingChange ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

