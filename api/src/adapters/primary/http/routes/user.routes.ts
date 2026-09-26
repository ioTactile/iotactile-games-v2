import type { FastifyInstance } from 'fastify';
import { PrismaUserRepository } from '@/adapters/secondary/persistence/PrismaUserRepository.ts';
import { GetUserByIdUsecase } from '@/application/query/usecases/user/get-user-by-id.usecase.ts';

export async function registerUserRoutes(server: FastifyInstance) {
  const userRepository = new PrismaUserRepository();
  const getUserByIdUsecase = new GetUserByIdUsecase(userRepository);

  server.get<{
    Params: { id: string };
  }>(
    '/users/:id',
    { preHandler: [server.requireAuth, server.requireAdmin] },
    async (request, reply) => {
      const { id } = request.params;
      const result = await getUserByIdUsecase.execute(id);
      if (!result.ok) {
        request.log.error(result.error);
        return reply.status(500).send({ error: 'Erreur serveur.' });
      }
      const user = result.value;
      if (!user) {
        return reply.status(404).send({ error: 'Utilisateur non trouvé.' });
      }
      return reply.status(200).send({ ...user, password: undefined });
    },
  );
}
