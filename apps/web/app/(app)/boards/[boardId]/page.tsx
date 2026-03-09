import { notFound } from "next/navigation";
import { BoardView } from "@/features/boards/board-view";
import { getBoardSnapshot } from "@/lib/db/boards";

export default async function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  const snapshot = await getBoardSnapshot(boardId);

  if (!snapshot) {
    notFound();
  }

  return <BoardView snapshot={snapshot} />;
}
