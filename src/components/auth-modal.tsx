"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { formatRuPhone, isValidEmail, normalizeRuPhone } from "@/lib/contact-validation";

type AuthMode = "login" | "register";

type CustomerProfile = {
 id?: string;
 name: string;
 lastName: string;
 phone: string;
 email: string;
};

type AuthUser = {
 role: "customer" | "admin";
 profile?: CustomerProfile;
};

type AuthResponse = {
 ok?: boolean;
 message?: string;
 user?: AuthUser;
 redirectTo?: string;
};

type AuthModalProps = {
 initialMode?: AuthMode;
 onClose: () => void;
 onSuccess?: (user: AuthUser) => void;
};

const emptyLogin = {
 login: "",
 password: "",
};

const emptyRegister = {
 firstName: "",
 lastName: "",
 phone: "",
 email: "",
 password: "",
};

export function AuthModal({ initialMode = "login", onClose, onSuccess }: AuthModalProps) {
 const [mode, setMode] = useState<AuthMode>(initialMode);
 const [loginDraft, setLoginDraft] = useState(emptyLogin);
 const [registerDraft, setRegisterDraft] = useState(emptyRegister);
 const [error, setError] = useState("");
 const [fieldErrors, setFieldErrors] = useState<{
 firstName?: string;
 lastName?: string;
 phone?: string;
 email?: string;
 password?: string;
 }>({});
 const [isSubmitting, setIsSubmitting] = useState(false);

 useEffect(() => {
 setMode(initialMode);
 setError("");
 setFieldErrors({});
 }, [initialMode]);

 const title = useMemo(() => {
 return mode === "register" ? "Создать аккаунт" : "Вход в личный кабинет";
 }, [mode]);

 async function submitAuth() {
 setError("");

 if (mode === "register") {
 const nextErrors: typeof fieldErrors = {};
 const normalizedPhone = normalizeRuPhone(registerDraft.phone);

 if (!registerDraft.firstName.trim()) {
 nextErrors.firstName = "Укажите имя.";
 }

 if (!registerDraft.lastName.trim()) {
 nextErrors.lastName = "Укажите фамилию.";
 }

 if (!normalizedPhone) {
 nextErrors.phone = "Введите номер в формате +7 (999) 000-00-00.";
 }

 if (registerDraft.email.trim() && !isValidEmail(registerDraft.email)) {
 nextErrors.email = "Введите корректный e-mail, например name@mail.ru.";
 }

 if (registerDraft.password.length < 6) {
 nextErrors.password = "Пароль должен содержать минимум 6 символов.";
 }

 setFieldErrors(nextErrors);

 if (Object.keys(nextErrors).length > 0) {
 setError("Исправьте ошибки в отмеченных полях.");
 return;
 }
 } else {
 setFieldErrors({});

 if (!loginDraft.login.trim() || !loginDraft.password) {
 setError("Укажите логин и пароль.");
 return;
 }
 }

 setIsSubmitting(true);

 const url = mode === "register" ? "/api/auth/register" : "/api/auth/login";
 const payload =
 mode === "register"
 ? {
 ...registerDraft,
 firstName: registerDraft.firstName.trim(),
 lastName: registerDraft.lastName.trim(),
 phone: normalizeRuPhone(registerDraft.phone),
 email: registerDraft.email.trim().toLowerCase(),
 }
 : loginDraft;

 try {
 const response = await fetch(url, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(payload),
 });
 const data = (await response.json().catch(() => ({}))) as AuthResponse;

 if (!response.ok || !data.user) {
 setError(data.message || "Не получилось войти. Проверь данные и попробуй ещё раз.");
 return;
 }

 window.dispatchEvent(new Event("netizen-auth-updated"));
 onSuccess?.(data.user);

 if (data.redirectTo) {
 window.location.href = data.redirectTo;
 return;
 }

 onClose();
 } catch {
 setError("Сервер авторизации не ответил. Попробуй ещё раз.");
 } finally {
 setIsSubmitting(false);
 }
 }

 return (
 <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-md">
 <div className="w-full max-w-[520px] rounded-[30px] border border-theme bg-page p-6 text-main ">
 <div className="flex items-start justify-between gap-4">
 <div>
 <div className="text-sm font-medium uppercase tracking-[0.2em] text-blue-500">
 Аккаунт
 </div>
 <h2 className="mt-2 text-3xl font-bold tracking-[-0.045em]">
 {title}
 </h2>
 <p className="mt-2 text-sm leading-relaxed text-muted">
 Войдите, чтобы смотреть заказы, сохранять данные и быстрее оформлять покупки.
 </p>
 </div>

 <button
 type="button"
 onClick={onClose}
 className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-theme text-lg transition-colors hover:border-blue-500/40 hover:bg-blue-soft"
 aria-label="Закрыть окно входа"
 >
 ×
 </button>
 </div>

 <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-theme bg-blue-soft p-1">
 <ModeButton
 active={mode === "login"}
 onClick={() => {
 setMode("login");
 setError("");
 setFieldErrors({});
 }}
 >
 Войти
 </ModeButton>
 <ModeButton
 active={mode === "register"}
 onClick={() => {
 setMode("register");
 setError("");
 setFieldErrors({});
 }}
 >
 Регистрация
 </ModeButton>
 </div>

 <div className="mt-6 grid gap-4">
 {mode === "login" ? (
 <>
 <label className="grid gap-2 text-sm font-medium">
 Логин
 <input
 value={loginDraft.login}
 onChange={(event) =>
 setLoginDraft((current) => ({ ...current, login: event.target.value }))
 }
 placeholder="Телефон, e-mail или логин"
 autoComplete="username"
 className="h-12 rounded-xl border border-theme bg-transparent px-4 text-main outline-none placeholder:text-muted-soft focus:border-blue-500/50"
 />
 </label>

 <label className="grid gap-2 text-sm font-medium">
 Пароль
 <input
 type="password"
 value={loginDraft.password}
 onChange={(event) =>
 setLoginDraft((current) => ({ ...current, password: event.target.value }))
 }
 placeholder="Введите пароль"
 autoComplete="current-password"
 className="h-12 rounded-xl border border-theme bg-transparent px-4 text-main outline-none placeholder:text-muted-soft focus:border-blue-500/50"
 />
 </label>
 </>
 ) : (
 <>
 <div className="grid gap-4 sm:grid-cols-2">
 <label className="grid gap-2 text-sm font-medium">
 Имя
 <input
 value={registerDraft.firstName}
 onChange={(event) => {
 setRegisterDraft((current) => ({ ...current, firstName: event.target.value }));
 setFieldErrors((current) => ({ ...current, firstName: undefined }));
 }}
 placeholder="Иван"
 autoComplete="given-name"
 className={`h-12 rounded-xl border bg-transparent px-4 text-main outline-none placeholder:text-muted-soft ${
 fieldErrors.firstName
 ? "border-red-500 focus:border-red-500"
 : "border-theme focus:border-blue-500/50"
 }`}
 />
 {fieldErrors.firstName ? (
 <span className="text-xs font-normal text-red-500">{fieldErrors.firstName}</span>
 ) : null}
 </label>

 <label className="grid gap-2 text-sm font-medium">
 Фамилия
 <input
 value={registerDraft.lastName}
 onChange={(event) => {
 setRegisterDraft((current) => ({ ...current, lastName: event.target.value }));
 setFieldErrors((current) => ({ ...current, lastName: undefined }));
 }}
 placeholder="Иванов"
 autoComplete="family-name"
 className={`h-12 rounded-xl border bg-transparent px-4 text-main outline-none placeholder:text-muted-soft ${
 fieldErrors.lastName
 ? "border-red-500 focus:border-red-500"
 : "border-theme focus:border-blue-500/50"
 }`}
 />
 {fieldErrors.lastName ? (
 <span className="text-xs font-normal text-red-500">{fieldErrors.lastName}</span>
 ) : null}
 </label>
 </div>

 <label className="grid gap-2 text-sm font-medium">
 Телефон
 <input
 value={registerDraft.phone}
 onChange={(event) => {
 setRegisterDraft((current) => ({
 ...current,
 phone: formatRuPhone(event.target.value),
 }));
 setFieldErrors((current) => ({ ...current, phone: undefined }));
 }}
 placeholder="+7 (999) 000-00-00"
 autoComplete="tel"
 inputMode="tel"
 maxLength={18}
 className={`h-12 rounded-xl border bg-transparent px-4 text-main outline-none placeholder:text-muted-soft ${
 fieldErrors.phone
 ? "border-red-500 focus:border-red-500"
 : "border-theme focus:border-blue-500/50"
 }`}
 />
 {fieldErrors.phone ? (
 <span className="text-xs font-normal text-red-500">{fieldErrors.phone}</span>
 ) : null}
 </label>

 <label className="grid gap-2 text-sm font-medium">
 E-mail <span className="text-muted">необязательно</span>
 <input
 type="email"
 value={registerDraft.email}
 onChange={(event) => {
 setRegisterDraft((current) => ({ ...current, email: event.target.value }));
 setFieldErrors((current) => ({ ...current, email: undefined }));
 }}
 placeholder="name@mail.ru"
 autoComplete="email"
 inputMode="email"
 className={`h-12 rounded-xl border bg-transparent px-4 text-main outline-none placeholder:text-muted-soft ${
 fieldErrors.email
 ? "border-red-500 focus:border-red-500"
 : "border-theme focus:border-blue-500/50"
 }`}
 />
 {fieldErrors.email ? (
 <span className="text-xs font-normal text-red-500">{fieldErrors.email}</span>
 ) : null}
 </label>

 <label className="grid gap-2 text-sm font-medium">
 Пароль
 <input
 type="password"
 value={registerDraft.password}
 onChange={(event) => {
 setRegisterDraft((current) => ({ ...current, password: event.target.value }));
 setFieldErrors((current) => ({ ...current, password: undefined }));
 }}
 placeholder="Минимум 6 символов"
 autoComplete="new-password"
 minLength={6}
 className={`h-12 rounded-xl border bg-transparent px-4 text-main outline-none placeholder:text-muted-soft ${
 fieldErrors.password
 ? "border-red-500 focus:border-red-500"
 : "border-theme focus:border-blue-500/50"
 }`}
 />
 {fieldErrors.password ? (
 <span className="text-xs font-normal text-red-500">{fieldErrors.password}</span>
 ) : null}
 </label>
 </>
 )}
 </div>

 {error && (
 <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
 {error}
 </div>
 )}

 <div className="mt-6 flex flex-col gap-3 sm:flex-row">
 <button
 type="button"
 onClick={submitAuth}
 disabled={isSubmitting}
 className="rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
 >
 {isSubmitting ? "Проверяем..." : mode === "register" ? "Зарегистрироваться" : "Войти"}
 </button>

 <button
 type="button"
 onClick={onClose}
 className="rounded-xl border border-theme bg-transparent px-6 py-3.5 text-sm font-medium transition-colors hover:border-blue-500/40 hover:bg-blue-soft"
 >
 Отмена
 </button>
 </div>
 </div>
 </div>
 );
}

function ModeButton({
 active,
 children,
 onClick,
}: {
 active: boolean;
 children: ReactNode;
 onClick: () => void;
}) {
 return (
 <button
 type="button"
 onClick={onClick}
 className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
 active
 ? "bg-blue-600 text-white "
 : "text-muted hover:bg-blue-soft hover:text-main"
 }`}
 >
 {children}
 </button>
 );
}
