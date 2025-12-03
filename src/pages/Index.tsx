import { useEffect, useMemo, useState } from "react";
import { Search, MessageCircle, History, PenSquare, PlusCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Định nghĩa kiểu dữ liệu
type Role = "student" | "advisor";
type QuestionStatus = "pending" | "answered" | "in_progress";

type AnswerVersion = {
  id: number;
  version: number;
  content: string;
  createdAt: string;
  updatedBy: string;
  note?: string;
};

type Question = {
  id: number;
  title: string;
  content: string;
  category: string;
  status: QuestionStatus;
  studentName: string;
  createdAt: string;
  tags: string[];
  latestAnswer?: AnswerVersion;
  answerHistory: AnswerVersion[];
};

const STATUS_LABEL: Record<QuestionStatus, string> = {
  pending: "Chưa trả lời",
  answered: "Đã trả lời",
  in_progress: "Đang xử lý",
};

const Index = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State cho thông tin người dùng và vai trò
  const [role, setRole] = useState<Role | null>(null);
  const [accountName, setAccountName] = useState("Người dùng");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountFaculty, setAccountFaculty] = useState("");

  // State cho bộ lọc và form
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | QuestionStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [newQuestionTitle, setNewQuestionTitle] = useState("");
  const [newQuestionContent, setNewQuestionContent] = useState("");
  const [newQuestionCategory, setNewQuestionCategory] = useState("Đăng ký môn học");

  const [answerDraft, setAnswerDraft] = useState("");
  const [selectedHistoryVersion, setSelectedHistoryVersion] = useState<number | null>(null);

  // 1. Kiểm tra đăng nhập và lấy Role
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedRole = localStorage.getItem("userRole"); // Lấy role đã lưu lúc Login
    
    // Giả lập lấy thông tin user từ localStorage (nếu có lưu)
    // Trong thực tế bạn nên có API /auth/me để lấy thông tin này
    setAccountEmail(localStorage.getItem("userEmail") || "user@example.com");

    if (!token) {
      navigate("/login");
    } else {
      // Nếu không có role, mặc định là student để tránh lỗi
      setRole((storedRole as Role) || "student");
    }
  }, [navigate]);

  // 2. Lấy dữ liệu câu hỏi từ API
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['questions'],
    queryFn: api.getQuestions,
    // Chỉ fetch khi đã xác định được role (tùy chọn)
    enabled: !!role, 
  });

  // 3. API tạo câu hỏi (dành cho SV)
  const createQuestionMutation = useMutation({
    mutationFn: api.createQuestion,
    onSuccess: () => {
      toast.success("Gửi câu hỏi thành công!");
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setNewQuestionTitle("");
      setNewQuestionContent("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleCreateQuestion = () => {
    if (!newQuestionTitle.trim() || !newQuestionContent.trim()) return;
    createQuestionMutation.mutate({
        title: newQuestionTitle,
        content: newQuestionContent,
        category: newQuestionCategory
    });
  };

  const handleUpdateQuestionForStudent = () => {
    toast.info("Tính năng cập nhật đang phát triển");
  };

  const handleSaveAnswer = () => {
    if (!answerDraft.trim()) return;
    // Cần thêm API update answer ở đây
    toast.info("Tính năng trả lời đang phát triển (API chưa sẵn sàng)");
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  // Logic lọc và hiển thị
  const selectedQuestion = questions.find((q: Question) => q.id === selectedQuestionId) ?? null;

  const filteredQuestions = useMemo(() => {
    return questions.filter((q: Question) => {
      if (statusFilter !== "all" && q.status !== statusFilter) return false;
      if (categoryFilter !== "all" && q.category !== categoryFilter) return false;
      if (!keyword.trim()) return true;
      const kw = keyword.toLowerCase();
      return (
        q.title.toLowerCase().includes(kw) ||
        q.content.toLowerCase().includes(kw) ||
        q.tags.some((tag) => tag.toLowerCase().includes(kw))
      );
    });
  }, [questions, statusFilter, categoryFilter, keyword]);

  const historyToShow = selectedQuestion?.answerHistory ?? [];
  const currentAnswerToShow =
    selectedQuestion && selectedQuestion.answerHistory.length > 0
      ? selectedHistoryVersion
        ? selectedQuestion.answerHistory.find((v) => v.version === selectedHistoryVersion) ??
          selectedQuestion.answerHistory[selectedQuestion.answerHistory.length - 1]
        : selectedQuestion.answerHistory[selectedQuestion.answerHistory.length - 1]
      : selectedQuestion?.latestAnswer ?? null;

  const uniqueCategories = Array.from(new Set(questions.map((q: Question) => q.category))) as string[];

  // Biến xác định giao diện
  const isStudent = role === "student";

  // Loading state
  if (isLoading || !role) return <div className="flex h-screen items-center justify-center">Đang tải dữ liệu...</div>;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/40 backdrop-blur sticky top-0 z-50">
        <div className="container flex flex-col gap-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">Hệ thống Hỏi đáp</h1>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-xs font-medium">
                <span className="text-muted-foreground">Xin chào,</span>
                <span className="text-primary">{isStudent ? "Sinh viên" : "Cố vấn"}</span>
            </div>
            
            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        
        {/* Phần thông tin tài khoản */}
        <Card className="bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Thông tin tài khoản ({isStudent ? "Sinh viên" : "Cố vấn học tập"})</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
             <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input value={accountEmail} readOnly className="h-8 bg-background" />
             </div>
             <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Họ và tên</Label>
                <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} className="h-8" />
             </div>
             <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Khoa / Đơn vị</Label>
                <Input value={accountFaculty} onChange={(e) => setAccountFaculty(e.target.value)} className="h-8" />
             </div>
          </CardContent>
        </Card>

        {/* Khối chức năng chính */}
        <section aria-labelledby="questions-section" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,2.6fr)] xl:gap-6">
            
            {/* Cột Trái: Danh sách câu hỏi */}
            <Card className="flex flex-col h-[calc(100vh-250px)]">
              <CardHeader className="space-y-3 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">Danh sách câu hỏi</CardTitle>
                  <Badge variant="outline" className="hidden border-dashed text-[10px] md:inline-flex">
                    {questions.length} câu hỏi
                  </Badge>
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm..."
                    className="h-9 pl-8 text-sm"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                   <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                      <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="all">Tất cả trạng thái</SelectItem><SelectItem value="pending">Chưa trả lời</SelectItem><SelectItem value="answered">Đã trả lời</SelectItem></SelectContent>
                   </Select>
                   <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v)}>
                      <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="all">Tất cả chủ đề</SelectItem>{uniqueCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                   </Select>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full">
                  <div className="divide-y">
                    {filteredQuestions.map((q: Question) => {
                      const isSelected = q.id === selectedQuestionId;
                      return (
                        <button
                          key={q.id}
                          onClick={() => setSelectedQuestionId(q.id)}
                          className={`flex w-full flex-col gap-1.5 px-4 py-3 text-left transition-colors hover:bg-accent/50 ${isSelected ? "bg-accent" : ""}`}
                        >
                          <div className="flex justify-between items-start gap-2">
                             <span className="font-medium text-sm line-clamp-1">{q.title}</span>
                             <Badge variant={q.status === 'answered' ? 'secondary' : 'outline'} className="text-[10px] shrink-0">{STATUS_LABEL[q.status]}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{q.content}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                             <span>{q.studentName}</span>
                             <span>•</span>
                             <span>{q.category}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Cột Phải: Chi tiết & Thao tác */}
            <div className="space-y-4 flex flex-col h-[calc(100vh-250px)] overflow-y-auto pr-1">
              
              {/* Chi tiết câu hỏi */}
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">{selectedQuestion?.title || "Chọn câu hỏi"}</CardTitle>
                  {selectedQuestion && (
                     <CardDescription className="flex items-center gap-2 text-xs mt-1">
                        <span>{selectedQuestion.studentName}</span>
                        <span>•</span>
                        <span>{selectedQuestion.createdAt}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-[10px] h-5">{selectedQuestion.category}</Badge>
                     </CardDescription>
                  )}
                </CardHeader>
                {selectedQuestion && (
                   <CardContent className="space-y-4 pb-4">
                      <div className="text-sm bg-muted/20 p-3 rounded-md">{selectedQuestion.content}</div>
                      
                      {/* Hiển thị câu trả lời (Cả SV và CVHT đều xem được) */}
                      {currentAnswerToShow ? (
                         <div className="border rounded-md p-3 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                               <div className="flex items-center gap-1 font-medium text-primary">
                                  <MessageCircle className="h-3 w-3" /> Trả lời (v{currentAnswerToShow.version})
                               </div>
                               <span>{currentAnswerToShow.updatedBy} - {currentAnswerToShow.createdAt}</span>
                            </div>
                            <p className="text-sm">{currentAnswerToShow.content}</p>
                         </div>
                      ) : (
                         <p className="text-sm text-muted-foreground italic">Chưa có câu trả lời.</p>
                      )}
                   </CardContent>
                )}
              </Card>

              {/* Khu vực thao tác: KHÁC NHAU GIỮA SV VÀ CVHT */}
              <Card className="flex-1">
                <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        {isStudent ? <PlusCircle className="h-4 w-4"/> : <PenSquare className="h-4 w-4"/>}
                        {isStudent ? "Tạo câu hỏi mới" : "Soạn câu trả lời"}
                    </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-3 pb-3">
                    {/* Giao diện cho SINH VIÊN */}
                    {isStudent && (
                        <>
                            <Input 
                                placeholder="Tiêu đề câu hỏi" 
                                value={newQuestionTitle} 
                                onChange={e => setNewQuestionTitle(e.target.value)} 
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <Select value={newQuestionCategory} onValueChange={setNewQuestionCategory}>
                                    <SelectTrigger><SelectValue placeholder="Chủ đề" /></SelectTrigger>
                                    <SelectContent>
                                        {uniqueCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Textarea 
                                placeholder="Nội dung chi tiết..." 
                                value={newQuestionContent} 
                                onChange={e => setNewQuestionContent(e.target.value)} 
                                className="min-h-[100px]" 
                            />
                        </>
                    )}

                    {/* Giao diện cho CỐ VẤN */}
                    {!isStudent && selectedQuestion && (
                        <>
                            <div className="text-xs text-muted-foreground mb-2">
                                Đang trả lời cho câu hỏi: <span className="font-medium">{selectedQuestion.title}</span>
                            </div>
                            <Textarea 
                                placeholder="Nhập nội dung tư vấn..." 
                                value={answerDraft} 
                                onChange={e => setAnswerDraft(e.target.value)} 
                                className="min-h-[150px]" 
                            />
                        </>
                    )}
                    
                    {!isStudent && !selectedQuestion && (
                        <p className="text-sm text-muted-foreground italic py-4 text-center">
                            Vui lòng chọn một câu hỏi để trả lời.
                        </p>
                    )}
                </CardContent>

                <CardFooter className="pt-0 justify-end gap-2">
                    {isStudent ? (
                        <Button size="sm" onClick={handleCreateQuestion}>Gửi câu hỏi</Button>
                    ) : (
                        <Button size="sm" onClick={handleSaveAnswer} disabled={!selectedQuestion}>Gửi trả lời</Button>
                    )}
                </CardFooter>
              </Card>

            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
