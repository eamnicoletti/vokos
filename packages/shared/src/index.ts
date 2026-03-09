import { z } from "zod";

export const workspaceRoleSchema = z.enum(["admin", "manager", "member"]);
export type WorkspaceRole = z.infer<typeof workspaceRoleSchema>;

export const taskSourceSchema = z.enum(["manual", "email", "dje", "portal"]);
export type TaskSource = z.infer<typeof taskSourceSchema>;

export const createdByTypeSchema = z.enum(["human", "bot", "system"]);
export type CreatedByType = z.infer<typeof createdByTypeSchema>;

export const createTaskSchema = z.object({
  workspaceId: z.string().uuid(),
  boardId: z.string().uuid(),
  listId: z.string().uuid(),
  title: z.string().min(3).max(180),
  description: z.string().max(4000).optional(),
  dueDate: z.string().datetime().optional(),
  assigneeUserId: z.string().uuid().optional()
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const m1AuditActionSchema = z.enum([
  "task_create",
  "task_update",
  "task_move",
  "task_assign",
  "task_comment_create",
  "board_create",
  "list_create"
]);
export type M1AuditAction = z.infer<typeof m1AuditActionSchema>;
