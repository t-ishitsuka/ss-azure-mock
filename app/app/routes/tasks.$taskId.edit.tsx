import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, Link, useNavigation } from "@remix-run/react";
import { prisma } from "~/utils/db.server";
import { MainLayout } from "~/components/layout";

// タスクの詳細を取得
export async function loader({ params }: LoaderFunctionArgs) {
  const taskId = params.taskId;
  if (!taskId) {
    throw new Response("タスクIDが指定されていません", { status: 400 });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Response("タスクが見つかりません", { status: 404 });
    }

    return json({ task });
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error("タスクの取得に失敗しました:", error);
    throw new Response("データベースエラーが発生しました", { status: 500 });
  }
}

// タスクの更新を処理
export async function action({ request, params }: ActionFunctionArgs) {
  const taskId = params.taskId;
  if (!taskId) {
    return json({ error: "タスクIDが指定されていません" }, { status: 400 });
  }

  const formData = await request.formData();
  const title = formData.get("title");
  const description = formData.get("description");

  if (typeof title !== "string" || !title.trim()) {
    return json({ error: "タイトルは必須です" }, { status: 400 });
  }

  if (typeof description !== "string") {
    return json({ error: "説明が無効です" }, { status: 400 });
  }

  try {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        title: title.trim(),
        description: description.trim() || null,
      },
    });
  } catch (error) {
    return json({ error: "タスクの更新に失敗しました" }, { status: 500 });
  }

  return redirect("/tasks");
}

export default function EditTask() {
  const { task } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">タスクの編集</h1>

      <Form method="post" className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            defaultValue={task.title}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            説明
          </label>
          <textarea
            id="description"
            name="description"
            defaultValue={task.description || ""}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "更新中..." : "更新"}
          </button>
          <Link
            to="/tasks"
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            キャンセル
          </Link>
        </div>
      </Form>
    </div>
    </MainLayout>
  );
}