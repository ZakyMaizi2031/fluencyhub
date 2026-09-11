export function instructorScopeId(role: string | undefined, userId: number) {
  return role === "admin" ? null : userId;
}
