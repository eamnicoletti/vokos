"use client";

import type { Route } from "next";
import type { ComponentProps, FormEvent } from "react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";

type AuthMode = "login" | "signup";

type LoginFormProps = ComponentProps<"div"> & {
  mode?: AuthMode;
  nextPath?: string;
  initialEmail?: string;
  invitationOrganization?: string;
};

type PasswordRules = {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
};

function evaluatePasswordStrength(password: string): PasswordRules {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };
}

function safeNextPath(value?: string): string {
  if (!value || !value.startsWith("/")) {
    return "/dashboard";
  }

  return value;
}

function getFriendlyErrorMessage(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("rate limit")) {
    return "Muitas tentativas consecutivas. Por favor, aguarde alguns minutos antes de tentar novamente.";
  }
  if (lower.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (lower.includes("user already registered")) {
    return "Este e-mail já está em uso.";
  }
  return "Ocorreu um erro ao processar sua solicitação. Tente novamente.";
}

function getOAuthCallbackUrl(nextPath: string, mode: AuthMode) {
  const callbackUrl = new URL("/auth/callback", window.location.origin);
  callbackUrl.searchParams.set("next", nextPath);
  callbackUrl.searchParams.set("mode", mode);

  return callbackUrl.toString();
}

export function LoginForm({
  className,
  mode = "login",
  nextPath,
  initialEmail,
  invitationOrganization,
  ...props
}: LoginFormProps) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const safeNext = safeNextPath(nextPath);
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [pending, setPending] = useState(false);
  const passwordRules = useMemo(() => evaluatePasswordStrength(password), [password]);
  const isStrongPassword = Object.values(passwordRules).every(Boolean);
  const passwordsMatch = password === confirmPassword;
  const hasConfirmPassword = confirmPassword.length > 0;
  const isSignupSubmitDisabled = !isStrongPassword || !hasConfirmPassword || !passwordsMatch;
  const showPasswordRules = isSignup && isPasswordFocused && password.length > 0;

  async function handleGoogleAuth() {
    setPending(true);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getOAuthCallbackUrl(safeNext, mode),
        scopes: "openid email profile"
      }
    });

    if (error) {
      toast.error(getFriendlyErrorMessage(error.message));
      setPending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const supabase = createBrowserSupabaseClient();

    if (isSignup && !isStrongPassword) {
      toast.error("A senha precisa ser forte para concluir o cadastro.");
      setPending(false);
      return;
    }

    if (isSignup) {
      if (!passwordsMatch) {
        toast.error("As senhas digitadas precisam ser iguais.");
        setPending(false);
        return;
      }

      const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: callbackUrl
        }
      });

      if (error) {
        toast.error(getFriendlyErrorMessage(error.message));
        setPending(false);
        return;
      }

      if (data.session) {
        toast.success("Conta criada com sucesso.");
        router.replace(safeNext as Route);
      } else {
        toast.success("Conta criada. Verifique seu e-mail para confirmar o cadastro.");
        const checkEmailParams = new URLSearchParams({
          email,
          next: safeNext
        });

        if (invitationOrganization) {
          checkEmailParams.set("organization", invitationOrganization);
        }

        router.replace((`/signup/check-email?${checkEmailParams.toString()}`) as Route);
      }

      router.refresh();
      setPending(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(getFriendlyErrorMessage(error.message));
      setPending(false);
      return;
    }

    toast.success("Login realizado com sucesso.");
    router.replace(safeNext as Route);
    router.refresh();
    setPending(false);
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-10" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">{isSignup ? "Crie sua conta" : "Bem-vindo de volta"}</h1>
                <p className="text-balance text-muted-foreground">
                  {invitationOrganization
                    ? isSignup
                      ? `Crie sua conta para entrar na organização ${invitationOrganization}.`
                      : `Entre com sua conta para aceitar o convite da organização ${invitationOrganization}.`
                    : isSignup
                      ? "Cadastre-se com e-mail e senha forte."
                      : "Acesse sua conta com e-mail e senha."}
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu-email@exemplo.com"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                {isSignup ? (
                  <div className="relative">
                    <Input
                      id="password"
                      type={isPasswordVisible ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      className="pr-10"
                      value={password}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2"
                      aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setIsPasswordVisible((current) => !current)}
                    >
                      {isPasswordVisible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                    </button>
                    {showPasswordRules ? (
                      <div className="absolute left-0 top-full z-30 mt-2 w-[min(20rem,calc(100vw-3rem))] rounded-md border bg-popover p-3 text-popover-foreground shadow-md">
                        <p className={cn("font-medium", isStrongPassword ? "text-emerald-600" : "text-amber-600")}>
                          Força da senha: {isStrongPassword ? "forte" : "fraca"}
                        </p>
                        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                          <li className={passwordRules.minLength ? "text-emerald-600" : undefined}>Pelo menos 8 caracteres</li>
                          <li className={passwordRules.uppercase ? "text-emerald-600" : undefined}>Uma letra maiúscula</li>
                          <li className={passwordRules.lowercase ? "text-emerald-600" : undefined}>Uma letra minúscula</li>
                          <li className={passwordRules.number ? "text-emerald-600" : undefined}>Um número</li>
                          <li className={passwordRules.special ? "text-emerald-600" : undefined}>Um caractere especial</li>
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      id="password"
                      type={isPasswordVisible ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      className="pr-10"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2"
                      aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setIsPasswordVisible((current) => !current)}
                    >
                      {isPasswordVisible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                    </button>
                  </div>
                )}
              </div>

              {isSignup ? (
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirmar senha</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={isConfirmPasswordVisible ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      className="pr-10"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      aria-invalid={hasConfirmPassword && !passwordsMatch}
                    />
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2"
                      aria-label={isConfirmPasswordVisible ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setIsConfirmPasswordVisible((current) => !current)}
                    >
                      {isConfirmPasswordVisible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                    </button>
                  </div>
                  {hasConfirmPassword && !passwordsMatch ? (
                    <p className="text-xs text-destructive">As senhas não conferem.</p>
                  ) : null}
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={pending || (isSignup && isSignupSubmitDisabled)}>
                {pending ? "Processando..." : isSignup ? "Criar conta" : "Entrar"}
              </Button>

              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:border-t after:border-border">
                <span className="relative z-10 bg-card px-2 text-muted-foreground">ou</span>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={pending}
                onClick={() => {
                  void handleGoogleAuth();
                }}
              >
                <img src="https://img.icons8.com/color/48/google-logo.png" alt="google-logo" className="mr-2 size-5" />
                {pending ? "Redirecionando..." : isSignup ? "Cadastrar com Google" : "Entrar com Google"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Ao continuar com Google, poderemos solicitar acesso ao seu nome e foto para completar seu perfil.
              </p>

              <div className="text-center text-sm">
                {isSignup ? "Já tem conta?" : "Não tem conta?"}{" "}
                <Link
                  href={{
                    pathname: isSignup ? "/login" : "/cadastro",
                    query: {
                      next: safeNext,
                      ...(email ? { email } : {}),
                      ...(invitationOrganization ? { organization: invitationOrganization } : {})
                    }
                  }}
                  className="underline underline-offset-4"
                >
                  {isSignup ? "Entrar" : "Cadastre-se"}
                </Link>
              </div>
            </div>
          </form>
          <div className="relative hidden bg-muted md:block">
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <Image src="/images/vokos_submark_white.svg" alt="Vokos" width={220} height={220} className="h-auto w-56" />
            </div>
            <Image src="/images/front-view-blurry-lawyer-working.webp" alt="Ilustração de autenticação" fill className="object-cover" />
          </div>
        </CardContent>
      </Card>
      <div className="px-6 text-center text-xs text-muted-foreground">
        Ao continuar, você concorda com nossos termos de uso e política de privacidade.
      </div>
    </div>
  );
}
