import { useEffect, useMemo, useState } from "react";
import { Search, UserCircle2, MessageCircle, History, PenSquare, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Demo hệ thống hỏi đáp SV - CVHT chỉ phía frontend (không kết nối backend)

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

const MOCK_QUESTIONS: Question[] = [
  {
    id: 1,
    title: "Xin tư vấn đăng ký môn học học kỳ 1 năm 2025",
    content:
      "Em là sinh viên năm 1, chưa rõ nên đăng ký những môn nào cho học kỳ đầu tiên để không bị quá tải. Nhờ thầy/cô tư vấn giúp em lộ trình phù hợp.",
    category: "Đăng ký môn học",
    status: "answered",
    studentName: "Nguyễn Văn A (bạn)",
    createdAt: "2025-08-01 09:30",
    tags: ["năm 1", "đăng ký môn", "kế hoạch học tập"],
    latestAnswer: {
      id: 101,
      version: 3,
      content:
        "Thầy gợi ý em nên đăng ký 14–16 tín chỉ trong học kỳ đầu, ưu tiên các môn Đại cương bắt buộc. Chi tiết lộ trình, em xem phần tệp đính kèm (demo).",
      createdAt: "2025-08-02 10:15",
      updatedBy: "ThS. Trần Minh – CVHT khoa CNTT",
      note: "Điều chỉnh lần 3 theo chương trình mới",
    },
    answerHistory: [
      {
        id: 100,
        version: 1,
        content: "Gợi ý ban đầu về số tín chỉ và một số môn cơ bản.",
        createdAt: "2025-08-01 15:20",
        updatedBy: "ThS. Trần Minh",
      },
      {
        id: 101,
        version: 2,
        content: "Bổ sung thêm lưu ý về điều kiện tiên quyết một số học phần.",
        createdAt: "2025-08-01 18:05",
        updatedBy: "ThS. Trần Minh",
      },
      {
        id: 102,
        version: 3,
        content:
          "Cập nhật lại theo chương trình đào tạo mới, chi tiết xem file đính kèm (demo).",
        createdAt: "2025-08-02 10:15",
        updatedBy: "ThS. Trần Minh",
        note: "Phiên bản hiện tại",
      },
    ],
  },
  {
    id: 2,
    title: "Xin xác nhận điểm rèn luyện học kỳ 2",
    content:
      "Em muốn hỏi về cách tính điểm rèn luyện và quy trình phúc khảo nếu em thấy điểm chưa chính xác.",
    category: "Điểm rèn luyện",
    status: "in_progress",
    studentName: "Trần Thị B",
    createdAt: "2025-07-20 14:10",
    tags: ["điểm rèn luyện", "phúc khảo"],
    answerHistory: [],
  },
  {
    id: 3,
    title: "Tư vấn chuyển ngành trong nội bộ trường",
    content:
      "Em đang học năm 2 ngành A nhưng muốn chuyển sang ngành B trong cùng trường. Điều kiện và quy trình cụ thể như thế nào ạ?",
    category: "Chương trình đào tạo",
    status: "pending",
    studentName: "Lê Văn C",
    createdAt: "2025-07-10 08:45",
    tags: ["chuyển ngành", "quy chế"],
    answerHistory: [],
  },
];

const STATUS_LABEL: Record<QuestionStatus, string> = {
  pending: "Chưa trả lời",
  answered: "Đã trả lời",
  in_progress: "Đang xử lý",
};

const Index = () => {
  const [role, setRole] = useState<Role>("student");
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [questions, setQuestions] = useState<Question[]>(MOCK_QUESTIONS);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(MOCK_QUESTIONS[0]?.id ?? null);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | QuestionStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [accountName, setAccountName] = useState("Nguyễn Văn A");
  const [accountEmail, setAccountEmail] = useState("sv001@example.com");
  const [accountFaculty, setAccountFaculty] = useState("Công nghệ thông tin");

  const [newQuestionTitle, setNewQuestionTitle] = useState("");
  const [newQuestionContent, setNewQuestionContent] = useState("");
  const [newQuestionCategory, setNewQuestionCategory] = useState("Đăng ký môn học");

  const [answerDraft, setAnswerDraft] = useState("");
  const [selectedHistoryVersion, setSelectedHistoryVersion] = useState<number | null>(null);

  useEffect(() => {
    document.title = "Hệ thống hỏi đáp SV - CVHT";
  }, []);

  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId) ?? null;

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
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

  const handleCreateQuestion = () => {
    if (!newQuestionTitle.trim() || !newQuestionContent.trim()) return;

    const nextId = Math.max(...questions.map((q) => q.id)) + 1;
    const newQ: Question = {
      id: nextId,
      title: newQuestionTitle.trim(),
      content: newQuestionContent.trim(),
      category: newQuestionCategory,
      status: "pending",
      studentName: `${accountName} (bạn)` || "Sinh viên (bạn)",
      createdAt: "2025-08-05 09:00",
      tags: ["mới tạo"],
      answerHistory: [],
    };

    setQuestions((prev) => [newQ, ...prev]);
    setSelectedQuestionId(newQ.id);
    setNewQuestionTitle("");
    setNewQuestionContent("");
  };

  const handleUpdateQuestionForStudent = () => {
    if (!selectedQuestion) return;
    if (!selectedQuestion.studentName.includes("(bạn)")) return;

    setQuestions((prev) =>
      prev.map((q) =>
        q.id === selectedQuestion.id
          ? {
              ...q,
              title: newQuestionTitle || q.title,
              content: newQuestionContent || q.content,
              category: newQuestionCategory || q.category,
            }
          : q,
      ),
    );
  };

  const handleSaveAnswer = () => {
    if (!selectedQuestion || !answerDraft.trim()) return;

    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== selectedQuestion.id) return q;

        const nextVersion = (q.answerHistory[q.answerHistory.length - 1]?.version ?? 0) + 1;
        const newVersion: AnswerVersion = {
          id: Date.now(),
          version: nextVersion,
          content: answerDraft.trim(),
          createdAt: "2025-08-05 10:00",
          updatedBy: "CVHT (demo)",
          note: nextVersion === 1 ? "Phiên bản đầu tiên" : "Cập nhật nội dung trả lời",
        };

        const updatedHistory = [...q.answerHistory, newVersion];

        return {
          ...q,
          status: "answered",
          latestAnswer: newVersion,
          answerHistory: updatedHistory,
        };
      }),
    );

    setAnswerDraft("");
  };

  const historyToShow = selectedQuestion?.answerHistory ?? [];
  const currentAnswerToShow =
    selectedQuestion && selectedQuestion.answerHistory.length > 0
      ? selectedHistoryVersion
        ? selectedQuestion.answerHistory.find((v) => v.version === selectedHistoryVersion) ??
          selectedQuestion.answerHistory[selectedQuestion.answerHistory.length - 1]
        : selectedQuestion.answerHistory[selectedQuestion.answerHistory.length - 1]
      : selectedQuestion?.latestAnswer ?? null;

  const uniqueCategories = Array.from(new Set(questions.map((q) => q.category)));

  const isStudent = role === "student";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/40 backdrop-blur">
        <div className="container flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Demo giao diện hệ thống
            </p>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Hệ thống hỏi đáp sinh viên – cố vấn học tập
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Giao diện mô phỏng đầy đủ các bước: đăng nhập, đăng ký, cập nhật tài khoản, xem & tìm kiếm câu hỏi,
              tạo/cập nhật câu hỏi, trả lời và xem lịch sử phiên bản trả lời.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full border bg-card px-1 py-1 text-xs shadow-sm md:self-auto">
            <span className="px-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Chế độ xem vai trò
            </span>
            <Button
              size="sm"
              variant={role === "student" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setRole("student")}
            >
              <UserCircle2 className="mr-1 h-3.5 w-3.5" />
              Sinh viên
            </Button>
            <Button
              size="sm"
              variant={role === "advisor" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setRole("advisor")}
            >
              <MessageCircle className="mr-1 h-3.5 w-3.5" />
              Cố vấn học tập
            </Button>
          </div>
        </div>
      </header>

      <main className="container space-y-8 py-6">
        {/* Khối đăng nhập / đăng ký & cập nhật tài khoản */}
        <section
          aria-labelledby="auth-section"
          className="grid gap-4 md:grid-cols-[minmax(0,1.8fr)_minmax(0,2.2fr)] lg:gap-6"
        >
          <Card className="border-dashed">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base md:text-lg">Đăng nhập / Đăng ký tài khoản</CardTitle>
                  <CardDescription>
                    Mô phỏng giao diện đăng nhập, đăng ký cho cả sinh viên và cố vấn học tập (demo frontend).
                  </CardDescription>
                </div>
                <UserCircle2 className="hidden h-8 w-8 text-muted-foreground md:block" />
              </div>
            </CardHeader>
            <CardContent>
              <Tabs
                value={authTab}
                onValueChange={(v) => setAuthTab(v as "login" | "register")}
                className="space-y-4"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Đăng nhập</TabsTrigger>
                  <TabsTrigger value="register">Đăng ký</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="vd: sv001@truong.edu.vn" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Mật khẩu</Label>
                    <Input id="login-password" type="password" placeholder="Nhập mật khẩu" />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
                    <span>Chọn vai trò tương ứng ở góc phải trên cùng để xem giao diện sau đăng nhập.</span>
                    <button type="button" className="text-xs font-medium text-primary underline-offset-4 hover:underline">
                      Quên mật khẩu?
                    </button>
                  </div>
                </TabsContent>

                <TabsContent value="register" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Họ và tên</Label>
                      <Input id="register-name" placeholder="Nhập họ tên" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-role">Vai trò</Label>
                      <Select defaultValue={isStudent ? "student" : "advisor"}>
                        <SelectTrigger id="register-role">
                          <SelectValue placeholder="Chọn vai trò" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Sinh viên</SelectItem>
                          <SelectItem value="advisor">Cố vấn học tập</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input id="register-email" type="email" placeholder="vd: cvht@truong.edu.vn" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Mật khẩu</Label>
                      <Input id="register-password" type="password" placeholder="Tối thiểu 8 ký tự" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password-confirm">Nhập lại mật khẩu</Label>
                      <Input id="register-password-confirm" type="password" placeholder="Nhập lại mật khẩu" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sau khi đăng ký thành công (trong hệ thống thật), người dùng sẽ được chuyển đến giao diện quản lý câu hỏi
                    tương ứng với vai trò.
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" size="sm">
                Xem hướng dẫn
              </Button>
              <Button size="sm">Mô phỏng gửi biểu mẫu</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Cập nhật thông tin tài khoản</CardTitle>
              <CardDescription>
                Giao diện cho phép người dùng sửa thông tin cá nhân, khoa, liên hệ... (demo, không lưu thật).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="account-name">Họ và tên</Label>
                  <Input
                    id="account-name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-email">Email</Label>
                  <Input
                    id="account-email"
                    type="email"
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="account-faculty">Khoa / Đơn vị</Label>
                  <Input
                    id="account-faculty"
                    value={accountFaculty}
                    onChange={(e) => setAccountFaculty(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-code">Mã số</Label>
                  <Input
                    id="account-code"
                    placeholder={isStudent ? "Mã số sinh viên" : "Mã số cán bộ"}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="account-password">Mật khẩu mới</Label>
                  <Input id="account-password" type="password" placeholder="Để trống nếu không đổi" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-password-confirm">Nhập lại mật khẩu mới</Label>
                  <Input id="account-password-confirm" type="password" placeholder="Nhập lại mật khẩu mới" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Trong hệ thống thật, nút "Lưu thay đổi" sẽ gọi API để cập nhật thông tin tài khoản.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Vai trò hiện tại: <span className="font-medium text-foreground">{isStudent ? "Sinh viên" : "CVHT"}</span>
              </p>
              <Button size="sm">Lưu thay đổi (demo)</Button>
            </CardFooter>
          </Card>
        </section>

        {/* Khối câu hỏi – xem danh sách, lọc, chi tiết, tạo/cập nhật, trả lời và lịch sử */}
        <section aria-labelledby="questions-section" className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 id="questions-section" className="text-lg font-semibold tracking-tight md:text-xl">
                Quản lý câu hỏi & câu trả lời
              </h2>
              <p className="text-sm text-muted-foreground">
                {isStudent
                  ? "Sinh viên có thể xem toàn bộ câu hỏi (cho phép), tạo/cập nhật câu hỏi của mình và theo dõi trả lời từ CVHT."
                  : "Cố vấn học tập xem danh sách câu hỏi, lọc theo tiêu chí và soạn/cập nhật câu trả lời cho sinh viên."}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <History className="h-3.5 w-3.5" />
              <span>Phần bên phải hiển thị lịch sử các phiên bản trả lời.</span>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,2.6fr)] xl:gap-6">
            {/* Danh sách & bộ lọc câu hỏi */}
            <Card className="flex flex-col">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base md:text-lg">Danh sách câu hỏi</CardTitle>
                  <Badge variant="outline" className="hidden border-dashed text-[11px] md:inline-flex">
                    Tổng: {questions.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="search" className="text-xs font-medium text-muted-foreground">
                    Tìm kiếm câu hỏi theo tiêu đề, nội dung, thẻ
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Nhập từ khóa..."
                        className="pl-8"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="status-filter" className="text-xs">
                        Trạng thái
                      </Label>
                      <Select
                        value={statusFilter}
                        onValueChange={(v) => setStatusFilter(v as "all" | QuestionStatus)}
                      >
                        <SelectTrigger id="status-filter" className="h-9 text-xs">
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả</SelectItem>
                          <SelectItem value="pending">Chưa trả lời</SelectItem>
                          <SelectItem value="in_progress">Đang xử lý</SelectItem>
                          <SelectItem value="answered">Đã trả lời</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="category-filter" className="text-xs">
                        Nhóm chủ đề
                      </Label>
                      <Select
                        value={categoryFilter}
                        onValueChange={(v) => setCategoryFilter(v)}
                      >
                        <SelectTrigger id="category-filter" className="h-9 text-xs">
                          <SelectValue placeholder="Chọn chủ đề" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả</SelectItem>
                          {uniqueCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-[360px]">
                  <div className="divide-y">
                    {filteredQuestions.length === 0 && (
                      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Không tìm thấy câu hỏi phù hợp với tiêu chí lọc.
                      </p>
                    )}

                    {filteredQuestions.map((q) => {
                      const isSelected = q.id === selectedQuestionId;
                      const displayStatus = STATUS_LABEL[q.status];
                      const isOwnQuestion = q.studentName.includes("(bạn)");

                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setSelectedQuestionId(q.id)}
                          className={`flex w-full flex-col gap-1 px-4 py-3 text-left text-sm transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                            isSelected ? "bg-accent/70" : "bg-background"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="line-clamp-1 font-medium">{q.title}</span>
                                {isOwnQuestion && (
                                  <Badge variant="outline" className="border-dashed text-[10px] uppercase">
                                    Câu hỏi của bạn
                                  </Badge>
                                )}
                              </div>
                              <p className="line-clamp-2 text-xs text-muted-foreground">{q.content}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge
                                variant={
                                  q.status === "answered"
                                    ? "secondary"
                                    : q.status === "in_progress"
                                      ? "outline"
                                      : "destructive"
                                }
                                className="rounded-full px-2 py-0.5 text-[10px]"
                              >
                                {displayStatus}
                              </Badge>
                              <span className="text-[11px] text-muted-foreground">{q.createdAt}</span>
                            </div>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] text-muted-foreground">{q.studentName}</span>
                            <span className="text-[10px] text-muted-foreground">•</span>
                            <Badge variant="outline" className="text-[10px]">
                              {q.category}
                            </Badge>
                            {q.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-[10px]">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chi tiết câu hỏi + tạo/cập nhật (SV) hoặc trả lời (CVHT) + lịch sử trả lời */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base md:text-lg">
                        {selectedQuestion ? selectedQuestion.title : "Chọn một câu hỏi từ danh sách"}
                      </CardTitle>
                      <CardDescription>
                        {selectedQuestion
                          ? `Chi tiết nội dung câu hỏi do ${selectedQuestion.studentName} gửi lên hệ thống.`
                          : "Bấm vào một dòng trong danh sách bên trái để xem nội dung chi tiết."}
                      </CardDescription>
                    </div>
                    <PenSquare className="hidden h-8 w-8 text-muted-foreground md:block" />
                  </div>
                </CardHeader>

                {selectedQuestion ? (
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="rounded-full text-[10px]">
                          {selectedQuestion.category}
                        </Badge>
                        <span>•</span>
                        <span>Người hỏi: {selectedQuestion.studentName}</span>
                        <span>•</span>
                        <span>Thời gian gửi: {selectedQuestion.createdAt}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {selectedQuestion.content}
                      </p>
                    </div>

                    {isStudent ? (
                      <div className="space-y-3 rounded-md border bg-muted/30 p-3 text-xs">
                        <p className="font-medium text-foreground">Quyền của sinh viên trên giao diện này</p>
                        <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
                          <li>Xem đầy đủ nội dung câu hỏi và nội dung trả lời từ cố vấn học tập.</li>
                          <li>Tạo mới câu hỏi khác ở phần "Tạo câu hỏi mới" phía dưới.</li>
                          <li>
                            Nếu là câu hỏi của chính mình (có nhãn "Câu hỏi của bạn"), có thể cập nhật nội dung câu hỏi khi chưa
                            được trả lời.
                          </li>
                          <li>Theo dõi lịch sử các phiên bản câu trả lời trong bảng "Lịch sử phiên bản trả lời".</li>
                        </ul>
                      </div>
                    ) : (
                      <div className="space-y-3 rounded-md border bg-muted/30 p-3 text-xs">
                        <p className="font-medium text-foreground">Quyền của cố vấn học tập trên giao diện này</p>
                        <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
                          <li>Xem câu hỏi của từng sinh viên cùng bối cảnh, thẻ, chủ đề.</li>
                          <li>Soạn câu trả lời mới hoặc cập nhật nội dung trả lời đã gửi trước đó.</li>
                          <li>Mỗi lần chỉnh sửa sẽ sinh ra một phiên bản mới trong lịch sử để có thể tra cứu lại.</li>
                        </ul>
                      </div>
                    )}

                    {currentAnswerToShow ? (
                      <div className="space-y-2 rounded-md border bg-card p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>
                              Phiên bản trả lời đang xem: <span className="font-medium">v{currentAnswerToShow.version}</span>
                            </span>
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {currentAnswerToShow.createdAt} – {currentAnswerToShow.updatedBy}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-foreground">{currentAnswerToShow.content}</p>
                        {currentAnswerToShow.note && (
                          <p className="text-xs text-muted-foreground">Ghi chú: {currentAnswerToShow.note}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Câu hỏi này hiện chưa có nội dung trả lời. Cố vấn học tập có thể sử dụng khung bên dưới để soạn câu trả
                        lời đầu tiên.
                      </p>
                    )}
                  </CardContent>
                ) : (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Chưa có câu hỏi nào được chọn. Vui lòng chọn một câu hỏi từ danh sách bên trái để xem chi tiết.
                    </p>
                  </CardContent>
                )}
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                {/* SV: tạo / cập nhật câu hỏi */}
                {isStudent && (
                  <Card>
                    <CardHeader className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <PlusCircle className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm md:text-base">Tạo / cập nhật câu hỏi (giao diện sinh viên)</CardTitle>
                      </div>
                      <CardDescription>
                        Biểu mẫu này minh họa giao diện sinh viên gửi câu hỏi mới hoặc chỉnh sửa câu hỏi của mình.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="new-title">Tiêu đề câu hỏi</Label>
                        <Input
                          id="new-title"
                          placeholder="Nhập tiêu đề câu hỏi..."
                          value={newQuestionTitle}
                          onChange={(e) => setNewQuestionTitle(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="new-category">Nhóm chủ đề</Label>
                        <Select
                          value={newQuestionCategory}
                          onValueChange={(v) => setNewQuestionCategory(v)}
                        >
                          <SelectTrigger id="new-category">
                            <SelectValue placeholder="Chọn chủ đề" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Đăng ký môn học">Đăng ký môn học</SelectItem>
                            <SelectItem value="Điểm rèn luyện">Điểm rèn luyện</SelectItem>
                            <SelectItem value="Chương trình đào tạo">Chương trình đào tạo</SelectItem>
                            <SelectItem value="Khác">Khác</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="new-content">Nội dung chi tiết</Label>
                        <Textarea
                          id="new-content"
                          placeholder="Mô tả rõ ràng bối cảnh, thắc mắc và mong muốn của bạn..."
                          className="min-h-[110px]"
                          value={newQuestionContent}
                          onChange={(e) => setNewQuestionContent(e.target.value)}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Trong hệ thống thật, sinh viên có thể đính kèm tệp minh chứng (ảnh, PDF,...) và chọn chế độ ẩn danh nếu
                        cần.
                      </p>
                    </CardContent>
                    <CardFooter className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        Bạn đang đăng nhập với vai trò <span className="font-medium">Sinh viên</span>.
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={handleUpdateQuestionForStudent}
                          disabled={!selectedQuestion || !selectedQuestion.studentName.includes("(bạn)")}
                        >
                          Cập nhật câu hỏi đang chọn
                        </Button>
                        <Button size="sm" type="button" onClick={handleCreateQuestion}>
                          Gửi câu hỏi mới
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                )}

                {/* CVHT: soạn / cập nhật câu trả lời */}
                {!isStudent && (
                  <Card>
                    <CardHeader className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm md:text-base">
                          Soạn / cập nhật câu trả lời (giao diện CVHT)
                        </CardTitle>
                      </div>
                      <CardDescription>
                        Mỗi lần lưu sẽ sinh ra một phiên bản câu trả lời, giúp theo dõi lịch sử chỉnh sửa.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="answer-draft">Nội dung câu trả lời</Label>
                        <Textarea
                          id="answer-draft"
                          placeholder="Nhập nội dung trả lời chi tiết cho câu hỏi đang chọn..."
                          className="min-h-[140px]"
                          value={answerDraft}
                          onChange={(e) => setAnswerDraft(e.target.value)}
                          disabled={!selectedQuestion}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Phiên bản mới sẽ được xếp cuối cùng trong bảng lịch sử và được dùng làm nội dung trả lời hiện tại cho
                        sinh viên.
                      </p>
                    </CardContent>
                    <CardFooter className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        Bạn đang đăng nhập với vai trò <span className="font-medium">Cố vấn học tập</span>.
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          disabled={!selectedQuestion}
                          onClick={handleSaveAnswer}
                        >
                          Lưu bản nháp
                        </Button>
                        <Button size="sm" type="button" disabled={!selectedQuestion} onClick={handleSaveAnswer}>
                          Lưu & cập nhật câu trả lời
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                )}

                {/* Lịch sử phiên bản câu trả lời */}
                <Card>
                  <CardHeader className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm md:text-base">Lịch sử phiên bản câu trả lời</CardTitle>
                    </div>
                    <CardDescription>
                      Xem lại các phiên bản cũ hơn nếu CVHT chỉnh sửa câu trả lời. Bấm chọn một dòng để xem nội dung tương ứng.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[190px]">
                      <div className="divide-y text-xs">
                        {!selectedQuestion || historyToShow.length === 0 ? (
                          <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                            {selectedQuestion
                              ? "Chưa có phiên bản trả lời nào cho câu hỏi này. Khi CVHT lưu câu trả lời, lịch sử sẽ xuất hiện tại đây."
                              : "Chọn một câu hỏi ở danh sách bên trái để xem lịch sử phiên bản câu trả lời."}
                          </p>
                        ) : (
                          historyToShow.map((v) => {
                            const active =
                              (selectedHistoryVersion ??
                                selectedQuestion.answerHistory[selectedQuestion.answerHistory.length - 1]?.version) ===
                              v.version;

                            return (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => setSelectedHistoryVersion(v.version)}
                                className={`flex w-full items-start justify-between gap-2 px-4 py-2 text-left transition-colors hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                                  active ? "bg-accent/80" : "bg-background"
                                }`}
                              >
                                <div className="flex-1 space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Phiên bản v{v.version}</span>
                                    {active && (
                                      <Badge variant="secondary" className="h-4 rounded-full px-2 text-[10px]">
                                        Đang xem
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="line-clamp-2 text-[11px] text-muted-foreground">{v.content}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1 text-[10px] text-muted-foreground">
                                  <span>{v.createdAt}</span>
                                  <span>{v.updatedBy}</span>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
