"use client";

import { useState, useEffect } from "react";
import CardTest from "./_components/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper tính ngày đáo hạn tự động dựa trên ngày gửi và số tháng kì hạn
const calculateEndDate = (startDateStr: string, monthsStr: string): string => {
  if (!startDateStr || !monthsStr) return "";
  const date = new Date(startDateStr);
  const months = parseInt(monthsStr, 10);
  if (isNaN(date.getTime()) || isNaN(months)) return "";

  date.setMonth(date.getMonth() + months);
  return date.toISOString().split("T")[0];
};

export default function Test() {
  const [cards, setCards] = useState([
    {
      id: 1,
      title: "Quỹ dự phòng 1",
      account: "123456789",
      balance: 123456789,
      term: "12",
      interestRate: "12",
      method: "Trả lãi cuối kỳ",
      startDate: "2026-06-16",
      endDate: "2027-06-16",
    },
    {
      id: 2,
      title: "Sổ tiết kiệm mua nhà",
      account: "987654321",
      balance: 500000000,
      term: "24",
      interestRate: "10.5",
      method: "Trả lãi hàng tháng",
      startDate: "2026-01-01",
      endDate: "2028-01-01",
    },
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const defaultNewData = {
    title: "",
    account: "",
    balance: "" as unknown as number, // Ép kiểu để tránh số 0 hiển thị mặc định trong input
    term: "",
    interestRate: "",
    method: "Trả lãi cuối kỳ", // Giá trị mặc định ban đầu
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  };

  const [newData, setNewData] = useState(defaultNewData);

  // Tự động cập nhật Ngày đáo hạn khi Ngày gửi hoặc Kỳ hạn thay đổi
  useEffect(() => {
    if (newData.startDate && newData.term) {
      const calculatedEnd = calculateEndDate(newData.startDate, newData.term);
      setNewData((prev) => ({ ...prev, endDate: calculatedEnd }));
    }
  }, [newData.startDate, newData.term]);

  const handleAdd = () => {
    if (!newData.title || !newData.account || !newData.balance) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc!");
      return;
    }

    setCards([
      ...cards,
      { ...newData, balance: Number(newData.balance), id: Date.now() },
    ]);
    setIsAddDialogOpen(false);
    setNewData(defaultNewData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Danh sách Sổ tiết kiệm
        </h1>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Thêm sổ tiết kiệm
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Thêm sổ tiết kiệm mới</DialogTitle>
              <DialogDescription>
                Nhập thông tin chi tiết cho sổ tiết kiệm mới.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Tên quỹ */}
                <div className="space-y-2">
                  <Label>Tên quỹ / Sổ tiết kiệm</Label>
                  <Input
                    placeholder="VD: Sổ tiết kiệm mua nhà"
                    value={newData.title}
                    onChange={(e) =>
                      setNewData({ ...newData, title: e.target.value })
                    }
                  />
                </div>

                {/* Phương thức trả lãi (MỚI THÊM) */}
                <div className="space-y-2">
                  <Label>Phương thức trả lãi</Label>
                  <Select
                    value={newData.method}
                    onValueChange={(value) =>
                      setNewData({ ...newData, method: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phương thức trả lãi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Trả trước kỳ">Trả trước kỳ</SelectItem>
                      <SelectItem value="Trả hàng tháng">
                        Trả hàng tháng
                      </SelectItem>
                      <SelectItem value="Trả cuối kỳ">Trả cuối kỳ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Số tài khoản & Số tiền gửi */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Số tài khoản</Label>
                  <Input
                    placeholder="Nhập số tài khoản"
                    value={newData.account}
                    onChange={(e) =>
                      setNewData({ ...newData, account: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Số tiền gửi (VNĐ)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newData.balance}
                    onChange={(e) =>
                      setNewData({
                        ...newData,
                        balance: e.target.value as unknown as number,
                      })
                    }
                  />
                </div>
              </div>

              {/* Kỳ hạn & Lãi suất */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kỳ hạn</Label>
                  <Select
                    value={newData.term}
                    onValueChange={(value) =>
                      setNewData({ ...newData, term: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn kỳ hạn" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 tháng</SelectItem>
                      <SelectItem value="3">3 tháng</SelectItem>
                      <SelectItem value="6">6 tháng</SelectItem>
                      <SelectItem value="12">12 tháng</SelectItem>
                      <SelectItem value="24">24 tháng</SelectItem>
                      <SelectItem value="36">36 tháng</SelectItem>
                      <SelectItem value="48">48 tháng</SelectItem>
                      <SelectItem value="60">60 tháng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Lãi suất (% / năm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="VD: 6.5"
                    value={newData.interestRate}
                    onChange={(e) =>
                      setNewData({ ...newData, interestRate: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Ngày gửi & Ngày đáo hạn */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ngày gửi</Label>
                  <Input
                    type="date"
                    value={newData.startDate}
                    onChange={(e) =>
                      setNewData({ ...newData, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ngày đáo hạn</Label>
                  <Input
                    type="date"
                    value={newData.endDate}
                    onChange={(e) =>
                      setNewData({ ...newData, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button onClick={handleAdd}>Thêm mới</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <CardTest key={card.id} initialData={card} />
        ))}
      </div>
    </div>
  );
}
