import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { db as prisma } from "~/db.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.userId) {
    throw new Response("Not Found", { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: parseInt(params.userId) },
    include: { chats: true },
  }).catch(() => null);

  if (!user) {
    throw new Response("Not Found", { status: 404 });
  }

  return { user };
};

export default function UserChats() {
  const { user } = useLoaderData<typeof loader>();
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-16">
      <header>
        <h1 className="text-2xl font-bold">{user.name}&apos;s chats</h1>
      </header>
      <div>
        <ul className="flex flex-col gap-4">
          {user.chats.map((chat) => (
            <li className="text-lg font-medium" key={chat.id}>
              <Link className="text-blue-700 hover:underline dark:text-blue-500" to={`/users/${user.id}/chats/${chat.id}`}>Chat {chat.id}</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}