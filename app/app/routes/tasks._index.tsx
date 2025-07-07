import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useFetcher, Link } from "@remix-run/react";
import { useState, useEffect } from "react";
import { prisma } from "~/utils/db.server";
import { MainLayout } from "~/components/layout";
import { Toast } from "~/components/toast";

// タスク一覧を取得
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: "desc" },
    });
    return json({ tasks });
  } catch (error) {
    console.error("タスクの取得に失敗しました:", error);
    throw new Response("データベースエラーが発生しました", { status: 500 });
  }
}

// タスクの作成・更新・削除を処理
export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const intent = formData.get("intent");

    switch (intent) {
      case "create": {
        const title = formData.get("title");
        if (typeof title !== "string" || !title.trim()) {
          return json({ error: "タイトルは必須です" }, { status: 400 });
        }
        await prisma.task.create({
          data: { title: title.trim() },
        });
        break;
      }
      case "toggle": {
        const id = formData.get("id");
        if (typeof id !== "string") {
          return json({ error: "IDが無効です" }, { status: 400 });
        }
        const task = await prisma.task.findUnique({ where: { id } });
        if (!task) {
          return json({ error: "タスクが見つかりません" }, { status: 404 });
        }
        await prisma.task.update({
          where: { id },
          data: { completed: !task.completed },
        });
        break;
      }
      case "delete": {
        const id = formData.get("id");
        if (typeof id !== "string") {
          return json({ error: "IDが無効です" }, { status: 400 });
        }
        try {
          await prisma.task.delete({ where: { id } });
        } catch (error) {
          return json({ error: "タスクの削除に失敗しました" }, { status: 500 });
        }
        break;
      }
      default:
        return json({ error: "無効な操作です" }, { status: 400 });
    }

    return json({ success: true });
  } catch (error) {
    console.error("アクション実行中にエラーが発生しました:", error);
    return json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

export default function TasksIndex() {
  const { tasks } = useLoaderData<typeof loader>();
  const createFetcher = useFetcher();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // フェッチャーのデータに基づいてトーストを表示
  useEffect(() => {
    if (createFetcher.data) {
      if (createFetcher.data.error) {
        setToast({ message: createFetcher.data.error, type: "error" });
      } else if (createFetcher.data.success) {
        setToast({ message: "タスクを作成しました", type: "success" });
      }
    }
  }, [createFetcher.data]);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">タスク管理</h1>

      {/* タスク作成フォーム */}
      <createFetcher.Form method="post" className="mb-8">
        <input type="hidden" name="intent" value="create" />
        <div className="flex gap-2">
          <input
            type="text"
            name="title"
            placeholder="新しいタスクを入力..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            required
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            disabled={createFetcher.state === "submitting"}
          >
            {createFetcher.state === "submitting" ? "追加中..." : "追加"}
          </button>
        </div>
      </createFetcher.Form>

      {/* タスク一覧 */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">タスクがありません</p>
        ) : (
          tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))
        )}
      </div>
      
      {/* トースト通知 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
    </MainLayout>
  );
}

// タスクアイテムコンポーネント
function TaskItem({ task }: { task: { id: string; title: string; completed: boolean; createdAt: string } }) {
  const toggleFetcher = useFetcher();
  const deleteFetcher = useFetcher();

  const isDeleting = deleteFetcher.state === "submitting";
  const isToggling = toggleFetcher.state === "submitting";

  return (
    <div className={`flex items-center gap-2 p-4 bg-white rounded-lg shadow ${isDeleting ? "opacity-50" : ""}`}>
      <toggleFetcher.Form method="post" className="flex-shrink-0">
        <input type="hidden" name="intent" value="toggle" />
        <input type="hidden" name="id" value={task.id} />
        <button
          type="submit"
          disabled={isToggling || isDeleting}
          className="w-5 h-5 border-2 border-gray-300 rounded flex items-center justify-center hover:border-blue-500 transition-colors"
        >
          {task.completed && (
            <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </toggleFetcher.Form>

      <span className={`flex-1 ${task.completed ? "line-through text-gray-500" : "text-gray-900"}`}>
        {task.title}
      </span>

      <Link
        to={`/tasks/${task.id}/edit`}
        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
      >
        編集
      </Link>

      <deleteFetcher.Form method="post" className="flex-shrink-0">
        <input type="hidden" name="intent" value="delete" />
        <input type="hidden" name="id" value={task.id} />
        <button
          type="submit"
          disabled={isDeleting}
          className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          {isDeleting ? "削除中..." : "削除"}
        </button>
      </deleteFetcher.Form>
    </div>
  );
}