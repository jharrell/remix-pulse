import type { LoaderFunctionArgs } from "@remix-run/node";
import { eventStream } from 'remix-utils/sse/server';
import { db as prisma } from "~/db.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const sessionId = new URL(request.url).searchParams.get('sessionId');
  const messages = await prisma.message.stream({
    name: sessionId ?? undefined,
    create: {
      chatId: parseInt(params.chatId!),
    }
  });

  return eventStream(request.signal, function setup(send) {
    async function run() {
      for await (const message of messages) {
        if (!request.signal.aborted) {
          send({ event: `message-${params.chatId}`, data: JSON.stringify(message.created) });
        }
      }
    }

    run();

    return function clear() {
      messages.stop();
    };
  });
}