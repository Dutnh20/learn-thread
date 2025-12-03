import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCircle2, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api"; // Import API
import { toast } from "sonner";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const target = e.target as typeof e.target & {
      email: { value: string };
    };
    const email = target.email.value;

    try {
      await api.forgotPassword(email);
      toast.success("Đã gửi hướng dẫn khôi phục mật khẩu vào email của bạn!");
      
      // Chờ 2s rồi chuyển về trang đăng nhập
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md border-dashed">
        <CardHeader className="space-y-1">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">Quên mật khẩu</CardTitle>
            <UserCircle2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardDescription>
            Nhập email đã đăng ký của bạn. Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="vd: sv001@truong.edu.vn" 
                required 
                disabled={loading} 
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Đang gửi yêu cầu..." : "Gửi yêu cầu"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <div className="text-center text-sm text-muted-foreground">
            <Link to="/login" className={`flex items-center justify-center gap-1 font-medium text-primary underline-offset-4 hover:underline ${loading ? 'pointer-events-none opacity-50' : ''}`}>
              <ArrowLeft className="h-3 w-3" /> Quay lại Đăng nhập
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword;