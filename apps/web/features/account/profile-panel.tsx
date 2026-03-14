"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Camera, Mail, Save, ShieldCheck, Trash2, Upload, UserRound } from "lucide-react";
import { toast } from "sonner";
import { updateMyProfileAction } from "@/app/(app)/conta/profile/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { OrganizationContext } from "@/lib/auth";
import { getUserInitials } from "@/lib/user-profile";

type ProfilePanelProps = {
  user: {
    name: string;
    email: string;
    avatarUrl: string | null;
    customAvatarUrl: string | null;
    providerAvatarUrl: string | null;
    activeOrganizationId: string | null;
  };
  organizations: OrganizationContext[];
};

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function ProfilePanel({ user, organizations }: ProfilePanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fullName, setFullName] = useState(user.name);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedAvatarPreview = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : null),
    [avatarFile]
  );
  const avatarPreview = selectedAvatarPreview ?? (removeAvatar ? user.providerAvatarUrl ?? undefined : user.avatarUrl ?? undefined);
  const hasManagedAvatar = Boolean(user.customAvatarUrl || avatarFile);
  const hasNameChanged = fullName.trim() !== user.name.trim();
  const hasAvatarChanged = avatarFile !== null || removeAvatar;
  const canSubmit = !pending && fullName.trim().length >= 2 && (hasNameChanged || hasAvatarChanged);

  useEffect(() => {
    return () => {
      if (selectedAvatarPreview) {
        URL.revokeObjectURL(selectedAvatarPreview);
      }
    };
  }, [selectedAvatarPreview]);

  function handlePickAvatar(file: File | null) {
    if (!file) {
      return;
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      toast.error("Selecione uma imagem JPG, PNG, WEBP ou GIF.");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("A imagem deve ter no máximo 2 MB.");
      return;
    }

    setAvatarFile(file);
    setRemoveAvatar(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const formData = new FormData();
      formData.set("fullName", fullName);
      formData.set("removeAvatar", removeAvatar ? "true" : "false");

      if (avatarFile) {
        formData.set("avatarFile", avatarFile);
      }

      const request = updateMyProfileAction(formData);

      toast.promise(request, {
        loading: "Salvando perfil...",
        success: "Perfil atualizado com sucesso.",
        error: (error) => (error instanceof Error ? error.message : "Falha ao atualizar perfil")
      });

      try {
        await request;
        setAvatarFile(null);
        setRemoveAvatar(false);
        router.refresh();
      } catch {
        // Toast already handles feedback.
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="border-muted">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar className="size-20 border border-border">
              <AvatarImage src={avatarPreview} alt={fullName} />
              <AvatarFallback className="text-lg">{getUserInitials(fullName, user.email)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle>Seu perfil</CardTitle>
              <CardDescription>Atualize seu nome e a foto exibidos no workspace.</CardDescription>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="size-4" />
                <span>{user.email}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="full-name" className="text-sm font-medium">
                  Nome
                </label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="full-name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="pl-9"
                    placeholder="Seu nome"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Foto de perfil</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG, WEBP ou GIF com até 2 MB.</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(event) => {
                      handlePickAvatar(event.target.files?.[0] ?? null);
                      event.target.value = "";
                    }}
                  />
                </div>

                <div className="flex flex-col gap-2 md:flex-row">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    disabled={pending} 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 size-4" />
                    {avatarFile || user.avatarUrl ? "Trocar foto" : "Enviar foto"}
                  </Button>
                  {hasManagedAvatar ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={pending}
                      className="w-full"
                      onClick={() => {
                        setAvatarFile(null);
                        setRemoveAvatar(true);
                      }}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Remover foto enviada
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={!canSubmit}>
                  <Save className="mr-2 size-4" />
                  {pending ? "Salvando..." : "Salvar alterações"}
                </Button>
              </div>
            </div>

            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Pré-visualização</CardTitle>
                <CardDescription>Como seu perfil aparece no app.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                <Avatar className="size-12 border border-border">
                  <AvatarImage src={avatarPreview} alt={fullName} />
                  <AvatarFallback>{getUserInitials(fullName, user.email)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">{fullName}</p>
                  <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Camera className="size-3.5" />
                    {removeAvatar ? "A foto será removida ao salvar." : avatarFile ? avatarFile.name : "Sem nova foto selecionada."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </form>
        </CardContent>
      </Card>

      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-4" />
            Organizações
          </CardTitle>
          <CardDescription>Organizações às quais sua conta possui acesso.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {organizations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Você ainda não faz parte de nenhuma organização ativa.</p>
          ) : (
            organizations.map((organization) => (
              <div key={organization.organizationId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{organization.organizationName}</p>
                  <p className="truncate text-sm text-muted-foreground">{organization.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {organization.organizationId === user.activeOrganizationId ? (
                    <Badge variant="secondary">Organização atual</Badge>
                  ) : null}
                  <Badge variant="outline">{organization.planLabel}</Badge>
                  <Badge variant="outline" className={organization.role === "owner" ? "bg-blue-500/10 text-blue-700" : undefined}>
                    {organization.role === "owner" ? (
                      <>
                        <ShieldCheck className="mr-1 size-3.5" />
                        Administrador
                      </>
                    ) : (
                      "Membro"
                    )}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
