import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { db as prisma } from "~/db.server";

const sessionId = crypto.randomUUID();

export const loader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.chatId || !params.userId) {
    throw new Response("Not Found", { status: 404 });
  }

  const chat = await prisma.chat.findUnique({
    where: { id: parseInt(params.chatId) },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { user: true }
      }
    }
  }).catch(() => null)

  const user = await prisma.user.findUnique({
    where: { id: parseInt(params.userId) },
  }).catch(() => null)

  if (!chat || !user) {
    throw new Response("Not Found", { status: 404 });
  }

  return { chat, user };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  if (!params.chatId || !params.userId) {
    throw new Response("Not Found", { status: 404 });
  }

  const formData = await request.formData();
  const text = formData.get("text");

  if (typeof text !== "string" || text.length === 0) {
    return null
  }

  const message = await prisma.message.create({
    data: {
      text,
      chatId: parseInt(params.chatId),
      userId: parseInt(params.userId),
    }
  });

  return message
}

export default function Chat() {
  const { chat, user } = useLoaderData<typeof loader>();

  const [messages, setMessages] = useState(chat.messages);
  const [error, setError] = useState(false);

  useEffect(() => {
    const source = new EventSource(`/users/${user.id}/chats/${chat.id}/messages?sessionId=${sessionId}`);
    source.addEventListener(`message-${chat.id}`, (e) => {
      setMessages((prev) => [...prev, JSON.parse(e.data)]);
    });
    source.addEventListener('error', () => setError(true));
    return () => source.close();
  }, []);

  if (error) {
    throw error;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Chat {chat.id}</h1>
        </div>
      </header>
      <main className="flex-grow overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-gray-500 my-8">No messages yet</p>
        )}
        {messages.length > 0 && (
          <ul className="space-y-4">
            {messages.map((message) => (
              <li key={message.id} className={`flex items-start ${message.user.name === user.name ? 'justify-end' : 'justify-start'}`}>
                {message.user.name !== user.name && (
                  <div className="flex-shrink-0 mr-3">
                    <img className="h-10 w-10 rounded-full" src={`https://ui-avatars.com/api/?name=${message.user.name}&background=random`} alt={message.user.name} />
                  </div>
                )}
                <div className={`${message.user.name === user.name ? 'bg-blue-500 text-white' : 'bg-white'} p-3 rounded-lg shadow`}>
                  <p className="text-sm">{message.text}</p>
                </div>
                {message.user.name === user.name && (
                  <div className="flex-shrink-0 ml-3">
                    <img className="h-10 w-10 rounded-full" src={`https://ui-avatars.com/api/?name=${message.user.name}&background=random`} alt={message.user.name} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
      <footer className="bg-white border-t border-gray-200 p-4">
        <form method="post" className="flex space-x-2">
          <input
            type="text"
            name="text"
            id="text"
            required
            className="flex-grow rounded-full border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}
