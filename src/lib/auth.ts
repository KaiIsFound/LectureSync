// ════════════════════════════════════════
// Auth system — localStorage-based (no database)
// Lưu tài khoản và session vào localStorage
// ════════════════════════════════════════

export interface User {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;   // Simple hash (not production-grade)
  createdAt: string;
}

export interface AuthSession {
  userId: string;
  username: string;
  displayName: string;
  loginTime: string;
}

const USERS_KEY = 'lecturesync_users';
const SESSION_KEY = 'lecturesync_session';

// ── Simple hash function (không phải bcrypt, nhưng đủ cho localStorage) ──
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Thêm salt cố định để khó đoán hơn
  const salted = `ls_${Math.abs(hash).toString(36)}_${str.length}`;
  return salted;
}

// ── Lấy danh sách users ──
function getUsers(): User[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// ── Lưu danh sách users ──
function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ── Đăng ký ──
export function register(username: string, password: string, displayName: string): { success: boolean; error?: string } {
  const trimUser = username.trim().toLowerCase();
  const trimName = displayName.trim();
  
  if (trimUser.length < 3) return { success: false, error: 'Tên đăng nhập phải từ 3 ký tự trở lên' };
  if (password.length < 4) return { success: false, error: 'Mật khẩu phải từ 4 ký tự trở lên' };
  if (!trimName) return { success: false, error: 'Vui lòng nhập tên hiển thị' };
  
  const users = getUsers();
  if (users.find(u => u.username === trimUser)) {
    return { success: false, error: 'Tên đăng nhập đã tồn tại' };
  }

  const newUser: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    username: trimUser,
    displayName: trimName,
    passwordHash: simpleHash(password),
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  // Tự động đăng nhập sau khi đăng ký
  const session: AuthSession = {
    userId: newUser.id,
    username: newUser.username,
    displayName: newUser.displayName,
    loginTime: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  return { success: true };
}

// ── Đăng nhập ──
export function login(username: string, password: string): { success: boolean; error?: string } {
  const trimUser = username.trim().toLowerCase();
  const users = getUsers();
  const user = users.find(u => u.username === trimUser);

  if (!user) return { success: false, error: 'Tên đăng nhập không tồn tại' };
  if (user.passwordHash !== simpleHash(password)) return { success: false, error: 'Mật khẩu không đúng' };

  const session: AuthSession = {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    loginTime: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { success: true };
}

// ── Đăng xuất ──
export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

// ── Kiểm tra đang đăng nhập ──
export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// ── Kiểm tra có đang đăng nhập không ──
export function isLoggedIn(): boolean {
  return getSession() !== null;
}
