"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  CircleDollarSign,
  IdCard,
  Percent,
  Repeat,
  Trash2,
  CalendarSync,
  Pen,
  HandCoins,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// 1. Định nghĩa Interface rõ ràng thay vì dùng 'any'
export interface SavingsFund {
  title: string;
  account: string;
  balance: number;
  term: string;
  interestRate: string;
  method: string;
  startDate: string;
  endDate: string;
}

interface SavingsFundCardProps {
  initialData?: SavingsFund;
  onDelete?: () => void; // Callback để báo cho component cha khi xóa
  onUpdate?: (updatedData: SavingsFund) => void; // Callback khi cập nhật dữ liệu
}

const DEFAULT_FUND_DATA: SavingsFund = {
  title: "Quỹ dự phòng 1",
  account: "123456789",
  balance: 123456789,
  term: "12 tháng",
  interestRate: "12",
  method: "Trả lãi cuối kỳ",
  startDate: "2026-06-16",
  endDate: "2027-06-16",
};

export default function SavingsFundCard({
  initialData,
  onDelete,
  onUpdate,
}: SavingsFundCardProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [fund, setFund] = useState<SavingsFund>(
    initialData || DEFAULT_FUND_DATA,
  );

  // Đồng bộ lại state nếu initialData từ phía Server/Component cha thay đổi
  useEffect(() => {
    if (initialData) {
      setFund(initialData);
    }
  }, [initialData]);

  // Các trạng thái Form nhập liệu
  const [formData, setFormData] = useState<SavingsFund>(fund);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");

  // Trạng thái đóng/mở Dialog
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  if (!isVisible) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const fundDetails = [
    {
      icon: <IdCard className="w-4 h-4 text-muted-foreground" />,
      label: "Số tài khoản",
      value: fund.account,
    },
    {
      icon: <CircleDollarSign className="w-4 h-4 text-muted-foreground" />,
      label: "Số dư",
      value: formatCurrency(fund.balance),
      highlight: true,
    },
    {
      icon: <CalendarSync className="w-4 h-4 text-muted-foreground" />,
      label: "Kỳ hạn",
      value: fund.term,
    },
    {
      icon: <Percent className="w-4 h-4 text-muted-foreground" />,
      label: "Lãi suất",
      value: `${fund.interestRate}% / năm`,
    },
    {
      icon: <Repeat className="w-4 h-4 text-muted-foreground" />,
      label: "Phương thức trả lãi",
      value: fund.method,
    },
    {
      icon: <Calendar className="w-4 h-4 text-muted-foreground" />,
      label: "Ngày gửi",
      value: new Date(fund.startDate).toLocaleDateString("vi-VN"),
    },
    {
      icon: <Calendar className="w-4 h-4 text-muted-foreground" />,
      label: "Ngày đáo hạn",
      value: new Date(fund.endDate).toLocaleDateString("vi-VN"),
    },
  ];

  const handleSaveEdit = () => {
    setFund(formData);
    onUpdate?.(formData);
    setIsEditOpen(false);
  };

  const handleDeleteConfirm = () => {
    setIsVisible(false);
    setIsDeleteOpen(false);
    onDelete?.();
  };

  const handleWithdrawConfirm = () => {
    const amount = Number(withdrawAmount);
    if (amount > 0 && amount <= fund.balance) {
      const updatedFund = { ...fund, balance: fund.balance - amount };
      setFund(updatedFund);
      onUpdate?.(updatedFund);
      setIsWithdrawOpen(false);
      setWithdrawAmount("");
    } else {
      alert("Số tiền không hợp lệ hoặc vượt quá số dư hiện tại!");
    }
  };

  return (
    <Card className="w-full max-w-md shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold">{fund.title}</CardTitle>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Action: Withdraw (Rút tiền) */}
          <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                title="Rút tiền"
              >
                <HandCoins className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rút tiền từ quỹ</DialogTitle>
                <DialogDescription>
                  Nhập số tiền bạn muốn rút từ{" "}
                  <span className="font-medium text-foreground">
                    {fund.title}
                  </span>
                  .
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="withdrawAmount">Số tiền cần rút</Label>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-xs text-primary hover:underline"
                      onClick={() => setWithdrawAmount(fund.balance.toString())}
                    >
                      Rút tất cả ({formatCurrency(fund.balance)})
                    </Button>
                  </div>
                  <Input
                    id="withdrawAmount"
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Ví dụ: 1000000"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsWithdrawOpen(false)}
                >
                  Hủy
                </Button>
                <Button onClick={handleWithdrawConfirm}>Xác nhận</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Action: Edit (Chỉnh sửa) */}
          <Dialog
            open={isEditOpen}
            onOpenChange={(open) => {
              setIsEditOpen(open);
              if (open) setFormData(fund);
            }}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                title="Chỉnh sửa"
              >
                <Pen className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Chỉnh sửa thông tin</DialogTitle>
                <DialogDescription>
                  Cập nhật các thông tin chi tiết của quỹ tích lũy.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Tên quỹ</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-account">Số tài khoản</Label>
                  <Input
                    id="edit-account"
                    value={formData.account}
                    onChange={(e) =>
                      setFormData({ ...formData, account: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-balance">Số dư (VNĐ)</Label>
                  <Input
                    id="edit-balance"
                    type="number"
                    value={formData.balance}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        balance: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-term">Kỳ hạn</Label>
                  <Input
                    id="edit-term"
                    value={formData.term}
                    onChange={(e) =>
                      setFormData({ ...formData, term: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-rate">Lãi suất (%)</Label>
                  <Input
                    id="edit-rate"
                    type="number"
                    step="0.1"
                    value={formData.interestRate}
                    onChange={(e) =>
                      setFormData({ ...formData, interestRate: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-start">Ngày gửi</Label>
                    <Input
                      id="edit-start"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-end">Ngày đáo hạn</Label>
                    <Input
                      id="edit-end"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleSaveEdit}>Lưu thay đổi</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Action: Delete (Xóa) */}
          <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                title="Xóa"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Xóa quỹ này?</DialogTitle>
                <DialogDescription>
                  Bạn có chắc chắn muốn xóa quỹ{" "}
                  <span className="font-bold text-foreground">
                    {fund.title}
                  </span>
                  ? Hành động này không thể hoàn tác.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteOpen(false)}
                >
                  Hủy
                </Button>
                <Button variant="destructive" onClick={handleDeleteConfirm}>
                  Xóa quỹ
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        {fundDetails.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-0.5 border-b border-dashed border-slate-100 dark:border-slate-800 last:border-0 pb-2 last:pb-0"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              {item.icon}
              <span>{item.label}:</span>
            </div>
            <span
              className={`font-semibold ${
                item.highlight
                  ? "text-emerald-600 dark:text-emerald-400 text-base"
                  : "text-foreground"
              }`}
            >
              {item.value}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
