import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileArchive, Trash2, Eye, Download, Filter } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Documents() {
  const { isStaff, session } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");
  const [filterOrg, setFilterOrg] = useState<string>("all");
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [organization, setOrganization] = useState("");
  const [siteId, setSiteId] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*, sites(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const { data } = await supabase.from("sites").select("id, name, organization").order("name");
      return data ?? [];
    },
  });

  const organizations = [...new Set(sites.map((s) => s.organization))].sort();

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file || !name || !organization) throw new Error("Заполните обязательные поля");

      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("documents").insert({
        name,
        file_path: path,
        file_type: file.type,
        file_size: file.size,
        organization,
        site_id: siteId || null,
        uploaded_by: session?.user.id,
        description: description || null,
      });
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      resetForm();
      toast({ title: "Документ загружен" });
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: any) => {
      await supabase.storage.from("documents").remove([doc.file_path]);
      const { error } = await supabase.from("documents").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Документ удалён" });
    },
  });

  const resetForm = () => {
    setOpen(false);
    setName("");
    setDescription("");
    setOrganization("");
    setSiteId("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handlePreview = (doc: any) => {
    const { data } = supabase.storage.from("documents").getPublicUrl(doc.file_path);
    setPreviewUrl(data.publicUrl);
    setPreviewName(doc.name);
  };

  const handleDownload = (doc: any) => {
    const { data } = supabase.storage.from("documents").getPublicUrl(doc.file_path);
    const a = document.createElement("a");
    a.href = data.publicUrl;
    a.download = doc.name;
    a.target = "_blank";
    a.click();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredDocs = filterOrg === "all" ? documents : documents.filter((d) => d.organization === filterOrg);

  const canPreviewInBrowser = (type: string) =>
    type === "application/pdf" || type?.startsWith("image/");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading text-2xl font-bold">Документация</h1>
        {isStaff && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Загрузить</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Загрузить документ</DialogTitle>
                <DialogDescription>Поддерживаемые форматы: PDF, DOC/DOCX, изображения</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Название документа *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Схема сети ЦОД" />
                </div>
                <div className="space-y-2">
                  <Label>Организация *</Label>
                  <Select value={organization} onValueChange={setOrganization}>
                    <SelectTrigger><SelectValue placeholder="Выберите организацию" /></SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org} value={org}>{org}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ЦОД (опционально)</Label>
                  <Select value={siteId} onValueChange={setSiteId}>
                    <SelectTrigger><SelectValue placeholder="Выберите ЦОД" /></SelectTrigger>
                    <SelectContent>
                      {sites.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Файл *</Label>
                  <Input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.bmp,.svg"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Описание</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => uploadMutation.mutate()}
                  disabled={!name || !organization || !file || uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? "Загрузка..." : "Загрузить"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="w-64">
          <Select value={filterOrg} onValueChange={setFilterOrg}>
            <SelectTrigger>
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Все организации" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все организации</SelectItem>
              {organizations.map((org) => (
                <SelectItem key={org} value={org}>{org}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : filteredDocs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileArchive className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Документы ещё не загружены</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Организация</TableHead>
                <TableHead className="hidden md:table-cell">ЦОД</TableHead>
                <TableHead className="hidden md:table-cell">Тип</TableHead>
                <TableHead className="hidden lg:table-cell">Размер</TableHead>
                <TableHead className="w-32">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocs.map((doc: any) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{doc.organization}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {doc.sites?.name ?? "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {doc.file_type?.split("/").pop()?.toUpperCase() ?? "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                    {doc.file_size ? formatSize(doc.file_size) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {canPreviewInBrowser(doc.file_type) && (
                        <Button variant="ghost" size="icon" onClick={() => handlePreview(doc)} title="Просмотр">
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)} title="Скачать">
                        <Download className="h-4 w-4" />
                      </Button>
                      {isStaff && (
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(doc)} title="Удалить">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Preview dialog */}
      <Dialog open={!!previewUrl} onOpenChange={(v) => { if (!v) { setPreviewUrl(null); setPreviewName(""); } }}>
        <DialogContent className="max-w-5xl h-[85vh]">
          <DialogHeader>
            <DialogTitle>{previewName}</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <iframe
              src={previewUrl}
              className="w-full flex-1 rounded border"
              style={{ minHeight: "calc(85vh - 80px)" }}
              title={previewName}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
