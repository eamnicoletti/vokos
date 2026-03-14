import { notFound } from "next/navigation";
import { BoardView } from "@/features/boards/board-view";
import { getBoardSnapshot } from "@/lib/db/boards";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  await requirePageSession(`/boards/${boardId}`);
  const snapshot = await getBoardSnapshot(boardId);

  if (!snapshot) {
    notFound();
  }

  return <BoardView snapshot={snapshot} />;
}
